import test from 'node:test';
import assert from 'node:assert/strict';

// This suite never opens the institutional database or contacts Paystack.
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'isolated-regression-secret-with-at-least-32-characters';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_isolated';
delete process.env.PAYSTACK_SANDBOX;
delete process.env.PAYSTACK_ALLOW_FALLBACK;

const { default: jwt } = await import('jsonwebtoken');
const { default: db } = await import('../src/config/db.js');
const { default: finance } = await import('../src/routes/finance.js');
const { default: payroll } = await import('../src/routes/payroll.js');
const gateway = await import('../src/services/paystack.js');

db.exec(`
  INSERT INTO users (id, username, password_hash, role, full_name, reference_id) VALUES
    (1, 'admin', 'unused', 'admin', 'Administrator', NULL),
    (2, 'student', 'unused', 'student', 'Student', 'STU-1'),
    (3, 'teacher', 'unused', 'teacher', 'Teacher', NULL),
    (4, 'parent', 'unused', 'parent', 'Parent', 'STU-2');
  INSERT INTO students (id, admission_no, first_name, last_name) VALUES
    (1, 'STU-1', 'Test', 'Student'), (2, 'STU-2', 'Other', 'Student');
  INSERT INTO staff (id, staff_no, name, role) VALUES (1, 'STAFF-1', 'Test Staff', 'Teacher');
  INSERT INTO invoices (id, invoice_no, student_id, title, amount_due) VALUES
    (1, 'INV-1', 1, 'Fees', 1000);
`);
const nativeFetch = globalThis.fetch;
let gatewayCalls = 0;
let gatewayResponse;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith('https://api.paystack.co')) {
    gatewayCalls++;
    if (gatewayResponse) return gatewayResponse(url, options);
    return { ok: false, json: async () => ({ status: false, message: 'Gateway rejected request' }) };
  }
  return nativeFetch(url, options);
};
const request = async (path, user = 1, body, method = 'POST') => {
  const router = path.startsWith('/finance') ? finance : payroll;
  const routePath = path.replace(/^\/(finance|payroll)/, '');
  const layer = router.stack.find(layer => layer.route?.methods[method.toLowerCase()] && layer.match(routePath));
  assert.ok(layer, `Route exists: ${method} ${path}`);
  return new Promise((resolve, reject) => {
    const req = { method, params: layer.params, query: {}, body: body || {}, ip: '127.0.0.1', headers: { authorization: `Bearer ${jwt.sign({ id: user }, process.env.JWT_SECRET)}` } };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { resolve({ status: this.statusCode, body: value }); return this; } };
    layer.route.dispatch(req, res, error => error ? reject(error) : reject(new Error('Route did not respond')));
  });
};

test('production financial and authorization regressions', async t => {
  await t.test('invalid money and overpayments never change the ledger', async () => {
    for (const amount of ['invalid', '100abc', -1, 'Infinity', 2000]) {
      assert.equal((await request('/finance/payments', 1, { invoice_id: 1, amount })).status, 400);
    }
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM payments').get().n, 0);
  });
  await t.test('checkout rejects teachers before contacting gateway', async () => {
    const before = gatewayCalls;
    assert.equal((await request('/finance/checkout/initialize', 3, { invoice_id: 1 })).status, 403);
    assert.equal(gatewayCalls, before);
  });
  await t.test('parents cannot verify another child payment or read processed invoices', async () => {
    db.prepare('UPDATE invoices SET paystack_reference = ? WHERE id = 1').run('ref-owned');
    assert.equal((await request('/finance/checkout/verify/ref-owned', 4, undefined, 'GET')).status, 403);
  });
  await t.test('blank guardian emails do not link unrelated families', async () => {
    db.prepare("UPDATE students SET guardian_email = '' WHERE id = 1").run();
    const result = await request('/finance/invoices', 4, undefined, 'GET');
    assert.equal(result.status, 200);
    assert.equal(result.body.data.length, 0);
  });
  await t.test('payslips deny parents/students and teachers missing a staff link', async () => {
    for (const user of [2, 3, 4]) assert.equal((await request('/payroll/payslip/1', user, undefined, 'GET')).status, 403);
  });
  await t.test('gateway failures never turn into simulated successful payments or transfers', async () => {
    await assert.rejects(gateway.verifyFeePayment('bad-reference'), /Sandbox simulation/);
    await assert.rejects(gateway.createTransferRecipient({ name: 'Test', accountNumber: '0123456789', bankCode: '058' }), /Sandbox simulation/);
    await assert.rejects(gateway.initiateBulkTransfer({ batchCode: 'test', transfers: [] }), /Sandbox simulation/);
  });
  await t.test('concurrent verification credits an authentic transaction exactly once', async () => {
    gatewayResponse = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { ok: true, json: async () => ({ status: true, data: { status: 'success', amount: 10000, currency: 'NGN', reference: 'ref-owned', metadata: { invoice_id: 1 } } }) };
    };
    const results = await Promise.all([1, 2].map(() => request('/finance/checkout/verify/ref-owned', 2, undefined, 'GET')));
    assert.deepEqual(results.map(r => r.status), [200, 200]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM payments WHERE reference = ?').get('ref-owned').n, 1);
    assert.equal(db.prepare('SELECT amount_paid FROM invoices WHERE id = 1').get().amount_paid, 100);
  });
  await t.test('concurrent payroll submission sends once and never claims settlement', async () => {
    db.exec(`
      INSERT INTO staff_bank_accounts (staff_id, bank_name, bank_code, account_number, account_name, paystack_recipient_code, is_verified)
        VALUES (1, 'Test Bank', '058', '0123456789', 'Test Staff', 'RCP_verified', 1);
      INSERT INTO payroll_batches (id, batch_code, month_year, status) VALUES (1, 'PAY-TEST', 'October 2026', 'Draft');
      INSERT INTO payroll_items (batch_id, staff_id, base_salary, net_amount, bank_name, bank_code, account_number, account_name, transfer_reference)
        VALUES (1, 1, 1000, 1000, 'Test Bank', '058', '0123456789', 'Test Staff', 'transfer-test');
    `);
    let sends = 0;
    gatewayResponse = async () => {
      sends++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return { ok: true, json: async () => ({ status: true, data: [{ status: 'pending' }] }) };
    };
    const results = await Promise.all([1, 2].map(() => request('/payroll/batches/1/disburse')));
    assert.equal(sends, 1);
    assert.ok(results.some(result => result.status === 200));
    assert.ok(results.some(result => result.status === 400 || result.status === 409));
    assert.equal(db.prepare('SELECT status FROM payroll_batches WHERE id = 1').get().status, 'Processing');
    assert.equal(db.prepare('SELECT status FROM payroll_items WHERE batch_id = 1').get().status, 'Queued');
  });
});

test.after(() => {
  globalThis.fetch = nativeFetch;
  db.close();
});
