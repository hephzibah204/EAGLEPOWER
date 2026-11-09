import db from '../config/db.js';
import { randomUUID } from 'node:crypto';

export function recordFeePayment({ invoice_id, amount, payment_method = 'Bank Transfer', reference, actor }) {
  return db.transaction(() => {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
    const value = Number(amount);
    if (!['number','string'].includes(typeof amount) || !invoice || !Number.isFinite(value) || value <= 0 || value > invoice.amount_due - invoice.amount_paid) throw Object.assign(new Error('Invalid invoice or payment exceeds balance'), {status:400});
    if (reference && db.prepare('SELECT id FROM payments WHERE reference = ?').get(reference)) throw Object.assign(new Error('Duplicate payment reference'), {status:409});
    const receipt_no = 'RCT-' + randomUUID();
    db.prepare('INSERT INTO payments (invoice_id, receipt_no, amount, payment_method, reference, recorded_by) VALUES (?, ?, ?, ?, ?, ?)').run(invoice_id, receipt_no, value, payment_method, reference || 'MANUAL-' + randomUUID(), actor);
    const amount_paid = Number(invoice.amount_paid) + value;
    const status = amount_paid >= invoice.amount_due ? 'Paid' : 'Partial';
    db.prepare('UPDATE invoices SET amount_paid = ?, status = ? WHERE id = ?').run(amount_paid, status, invoice_id);
    return { receipt_no, updated_invoice: { id: invoice_id, amount_paid, status } };
  })();
}

export function correctFeeRecord({ invoice_id, kind, amount, reason, reference, actor }) {
  return db.transaction(() => {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
    const value = Number(amount);
    if (!invoice || !['refund', 'reversal', 'credit', 'cancel'].includes(kind) || !String(reason || '').trim() || !String(reference || '').trim()) throw new Error('Invoice, correction type, reason and unique reference are required');
    if (!Number.isFinite(value) || value <= 0) throw new Error('A positive correction amount is required');
    let paid = Number(invoice.amount_paid), due = Number(invoice.amount_due);
    if (kind === 'refund' || kind === 'reversal') {
      if (value > paid) throw new Error('Correction exceeds collected payments');
      paid -= value;
    } else {
      if (value > due - paid || (kind === 'cancel' && (paid !== 0 || value !== due))) throw new Error('Credit exceeds balance; refund collected money before cancelling');
      due -= value;
    }
    db.prepare('INSERT INTO fee_adjustments (invoice_id, kind, amount, reason, reference, actor) VALUES (?, ?, ?, ?, ?, ?)').run(invoice_id, kind, value, reason.trim(), reference.trim(), actor);
    db.prepare('UPDATE invoices SET amount_due = ?, amount_paid = ?, status = ? WHERE id = ?').run(due, paid, paid >= due ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid', invoice_id);
    return { invoice_id, amount_due: due, amount_paid: paid };
  })();
}

export function debtRegister({ overdue = false, session, term } = {}) {
  const conditions = ['i.amount_due > i.amount_paid']; const values = [];
  if (overdue) conditions.push("date(i.due_date) < date('now')");
  if (session) { conditions.push('i.session = ?'); values.push(session); }
  if (term) { conditions.push('i.term = ?'); values.push(term); }
  return db.prepare(`SELECT i.*, s.admission_no, s.first_name || ' ' || s.last_name AS student_name,
    s.guardian_phone, c.name AS class_name, i.amount_due - i.amount_paid AS balance_due,
    CASE WHEN date(i.due_date) < date('now') THEN 1 ELSE 0 END AS overdue
    FROM invoices i JOIN students s ON s.id = i.student_id LEFT JOIN classes c ON c.id = s.class_id
    WHERE ${conditions.join(' AND ')} ORDER BY i.due_date, i.id`).all(...values);
}

export function normalizeGuardianPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (/^0[789]\d{9}$/.test(digits)) digits = '234' + digits.slice(1);
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export function queueFeeReminders() {
  return db.transaction(() => {
    let queued = 0, missing_contacts = 0;
    for (const invoice of debtRegister({ overdue: true })) {
      const phone = normalizeGuardianPhone(invoice.guardian_phone);
      const contact = db.prepare('SELECT * FROM fee_contact_preferences WHERE student_id = ?').get(invoice.student_id);
      if (!phone || !contact?.verified || contact.opted_out || contact.phone !== phone) { missing_contacts++; continue; }
      if (db.prepare("SELECT id FROM fee_reminders WHERE invoice_id = ? AND (status IN ('pending','sending','review_required') OR created_at > datetime('now', '-7 days'))").get(invoice.id)) continue;
      db.prepare("INSERT INTO fee_reminders (invoice_id, phone, status) VALUES (?, ?, 'pending')").run(invoice.id, phone);
      queued++;
    }
    return { queued, missing_contacts };
  })();
}

export async function dispatchFeeReminders(send) {
  for (const row of db.prepare("SELECT * FROM fee_reminders WHERE status = 'pending' ORDER BY id LIMIT 100").all()) {
    if (!db.prepare("UPDATE fee_reminders SET status = 'sending', attempts = attempts + 1 WHERE id = ? AND status = 'pending'").run(row.id).changes) continue;
    const invoice = debtRegister({ overdue: true }).find(i => i.id === row.invoice_id);
    const contact = invoice && db.prepare('SELECT * FROM fee_contact_preferences WHERE student_id = ?').get(invoice.student_id);
    if (!invoice || !contact?.verified || contact.opted_out || contact.phone !== row.phone || normalizeGuardianPhone(invoice.guardian_phone) !== row.phone) {
      db.prepare("UPDATE fee_reminders SET status = 'cancelled' WHERE id = ?").run(row.id); continue;
    }
    const text = `Eagle Power Schools: Dear parent/guardian, ${invoice.student_name} has an overdue balance of NGN ${Number(invoice.balance_due).toFixed(2)} for ${invoice.title} (${invoice.session}, ${invoice.term}). Invoice ${invoice.invoice_no}. Please contact the bursary for payment or corrections.`;
    try {
      const id = await send(row.phone, text, String(row.id));
      if (!id) throw new Error('Missing provider acknowledgement');
      db.prepare("UPDATE fee_reminders SET status = 'sent', provider_message_id = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?").run(id, row.id);
    } catch {
      // The provider may have accepted a timed-out request. Review before resending.
      db.prepare("UPDATE fee_reminders SET status = 'review_required' WHERE id = ?").run(row.id);
    }
  }
}
