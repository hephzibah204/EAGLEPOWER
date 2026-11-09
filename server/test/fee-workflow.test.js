import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
const { default: db } = await import('../src/config/db.js');
const { recordFeePayment, correctFeeRecord, debtRegister, queueFeeReminders, dispatchFeeReminders } = await import('../src/services/feeWorkflow.js');
db.exec(`INSERT INTO students (id,admission_no,first_name,last_name,guardian_phone) VALUES (1,'A1','Test','Child','08012345678');
 INSERT INTO invoices (id,invoice_no,student_id,title,amount_due,due_date) VALUES (1,'I1',1,'Tuition',1000,'2020-01-01'),(2,'I2',1,'Future',500,'2099-01-01');
 INSERT INTO fee_contact_preferences (student_id,phone,verified,updated_by) VALUES (1,'2348012345678',1,'admin');`);
test('atomic payments, duplicate protection, financial corrections and retention', () => {
  recordFeePayment({ invoice_id:1,amount:200,reference:'PAY1',actor:'admin' });
  assert.throws(() => recordFeePayment({ invoice_id:1,amount:200,reference:'PAY1',actor:'admin' }));
  assert.throws(() => recordFeePayment({ invoice_id:1,amount:9999,actor:'admin' }));
  correctFeeRecord({invoice_id:1,kind:'refund',amount:100,reason:'Returned',reference:'REF1',actor:'admin'});
  assert.equal(db.prepare('SELECT amount_paid FROM invoices WHERE id=1').get().amount_paid,100);
  assert.equal(db.prepare('SELECT amount FROM payments').get().amount,200);
  for (const query of ['DELETE FROM students WHERE id=1','DELETE FROM invoices WHERE id=1','DELETE FROM payments','UPDATE payments SET amount=1']) assert.throws(() => db.exec(query));
});
test('complete register distinguishes future balances; queue deduplicates and rechecks payments', async () => {
  assert.equal(debtRegister().length,2);
  assert.equal(debtRegister({overdue:true}).length,1);
  assert.equal(queueFeeReminders().queued,1);
  assert.equal(queueFeeReminders().queued,0);
  recordFeePayment({invoice_id:1,amount:900,actor:'admin'});
  let sends=0;
  await dispatchFeeReminders(async () => {sends++; return 'provider1';});
  assert.equal(sends,0);
  assert.equal(db.prepare('SELECT status FROM fee_reminders').get().status,'cancelled');
});
test('missing verification blocks dispatch and ambiguous sends require review', async () => {
  db.prepare("UPDATE invoices SET due_date='2020-01-01' WHERE id=2").run();
  db.prepare('UPDATE fee_contact_preferences SET verified=0').run();
  assert.equal(queueFeeReminders().queued,0);
  db.prepare('UPDATE fee_contact_preferences SET verified=1').run();
  assert.equal(queueFeeReminders().queued,1);
  let sends=0;
  await dispatchFeeReminders(async () => {sends++; throw new Error('timeout');});
  await dispatchFeeReminders(async () => {sends++; return 'duplicate';});
  assert.equal(sends,1);
  assert.equal(db.prepare('SELECT status FROM fee_reminders WHERE invoice_id=2').get().status,'review_required');
});
test('scheduler records acknowledgements separately from delivery and respects opt-outs', async () => {
  db.exec("INSERT INTO invoices (id,invoice_no,student_id,title,amount_due,due_date) VALUES (3,'I3',1,'Transport',100,'2020-01-01')");
  process.env.WHATSAPP_BOT_ORIGIN = 'https://bot.example';
  process.env.WHATSAPP_SERVICE_KEY = 'isolated-test-service-key-at-least-32-characters';
  const original = globalThis.fetch;
  let calls = 0, receipts = {};
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer ' + process.env.WHATSAPP_SERVICE_KEY);
    if (String(url).endsWith('/status')) return Response.json(receipts);
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.phone, '2348012345678');
    assert.match(body.text, /100.00/);
    receipts[body.id] = {message_id:'provider-ack',status:'delivered',delivered_at:'2026-11-07T10:00:00.000Z'};
    return Response.json({message_id:'provider-ack'});
  };
  try {
    const {runFeeReminders} = await import('../src/services/feeReminderScheduler.js');
    await runFeeReminders();
    assert.equal(db.prepare('SELECT status FROM fee_reminders WHERE invoice_id=3').get().status,'sent');
    await runFeeReminders();
    assert.equal(calls,1);
    assert.equal(db.prepare('SELECT status FROM fee_reminders WHERE invoice_id=3').get().status,'delivered');
    db.exec("INSERT INTO invoices (id,invoice_no,student_id,title,amount_due,due_date) VALUES (4,'I4',1,'Books',100,'2020-01-01')");
    queueFeeReminders();
    db.prepare('UPDATE fee_contact_preferences SET opted_out=1').run();
    await runFeeReminders();
    assert.equal(calls,1);
    assert.equal(db.prepare('SELECT status FROM fee_reminders WHERE invoice_id=4').get().status,'cancelled');
  } finally { globalThis.fetch = original; }
});
test.after(() => db.close());
