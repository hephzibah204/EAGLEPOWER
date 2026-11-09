import { debtRegister, queueFeeReminders, correctFeeRecord, normalizeGuardianPhone } from '../services/feeWorkflow.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { initializeFeePayment, verifyFeePayment } from '../services/paystack.js';

const router = express.Router();

function canAccessInvoice(user, invoice) {
  if (['admin', 'superadmin', 'bursar'].includes(user.role)) return true;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(invoice.student_id);
  if (!student) return false;
  const reference = String(user.reference_id || '').trim().toUpperCase();
  if (user.role === 'student') {
    return String(student.admission_no).toUpperCase() === String(reference || user.username).toUpperCase();
  }
  if (user.role !== 'parent') return false;
  const phone = String(user.username || '').replace(/\D/g, '');
  const guardianPhone = String(student.guardian_phone || '').replace(/\D/g, '');
  const email = String(user.email || '').trim().toLowerCase();
  return (reference && reference === String(student.admission_no).toUpperCase()) ||
    (phone.length >= 10 && guardianPhone.length >= 10 && phone.slice(-10) === guardianPhone.slice(-10)) ||
    (email && email === String(student.guardian_email || '').trim().toLowerCase());
}

const positiveMoney = value => (typeof value === 'number' || typeof value === 'string') &&
  String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0;

router.post('/adjustments', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {const data=correctFeeRecord({...req.body,actor:req.user.username});logAudit(req.user.id,'FEE_CORRECTION','FINANCE','Invoice ' + data.invoice_id + ' corrected',req.ip);res.status(201).json({success:true,data});}catch(e){res.status(400).json({success:false,message:e.message});}
});
router.get('/adjustments', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {res.json({success:true,data:db.prepare('SELECT * FROM fee_adjustments ORDER BY id DESC').all()});}catch(e){next(e);}
});
router.put('/reminders/contact/:studentId', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {
  const student=db.prepare('SELECT guardian_phone FROM students WHERE id = ?').get(Number(req.params.studentId));
  const phone=normalizeGuardianPhone(student?.guardian_phone);
  if (!phone || typeof req.body.verified !== 'boolean' || typeof req.body.opted_out !== 'boolean') return res.status(400).json({success:false,message:'Valid guardian phone and explicit verification/preferences required'});
  db.prepare('INSERT INTO fee_contact_preferences (student_id,phone,verified,opted_out,updated_by) VALUES (?,?,?,?,?) ON CONFLICT(student_id) DO UPDATE SET phone=excluded.phone,verified=excluded.verified,opted_out=excluded.opted_out,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP').run(Number(req.params.studentId),phone,Number(req.body.verified),Number(req.body.opted_out),req.user.username);
  logAudit(req.user.id,'FEE_CONTACT_PREFERENCE','FINANCE','Updated guardian reminder preference for student ' + req.params.studentId,req.ip);
  res.json({success:true});
 }catch(e){next(e);}
});
router.put('/invoices/:id/due-date', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {
  const date = req.body.due_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) return res.status(400).json({success:false,message:'A valid due date is required'});
  const invoice=db.prepare('SELECT due_date FROM invoices WHERE id=?').get(Number(req.params.id));
  if(!invoice) return res.status(404).json({success:false,message:'Invoice not found'});
  db.prepare('UPDATE invoices SET due_date=? WHERE id=?').run(date,Number(req.params.id));
  logAudit(req.user.id,'FEE_DUE_DATE','FINANCE','Invoice ' + req.params.id + ' due date changed from ' + invoice.due_date + ' to ' + date,req.ip);
  res.json({success:true});
 }catch(e){next(e);}
});
router.get('/reconciliation', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {
  const data=db.prepare("SELECT i.id, i.invoice_no, i.amount_paid AS recorded_paid, COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoice_id=i.id),0) - COALESCE((SELECT SUM(amount) FROM fee_adjustments a WHERE a.invoice_id=i.id AND a.kind IN ('refund','reversal')),0) AS ledger_paid FROM invoices i").all().filter(row => Math.abs(row.recorded_paid-row.ledger_paid)>0.005);
  res.json({success:true,data});
 }catch(e){next(e);}
});
router.get('/debts', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {const data=debtRegister({overdue:req.query.overdue === 'true',session:req.query.session,term:req.query.term});res.json({success:true,data,total:data.length});}catch(e){next(e);}
});
router.post('/reminders/queue', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {res.json({success:true,...queueFeeReminders()});}catch(e){next(e);}
});
router.get('/reminders', authenticate, requireRoles('bursar','admin','superadmin'), (req,res,next) => {
 try {res.json({success:true,data:db.prepare('SELECT * FROM fee_reminders ORDER BY id DESC LIMIT 500').all()});}catch(e){next(e);}
});
/**
 * GET /api/finance/stats
 * Bursary financial analytics (Restricted to Bursar, Admin, SuperAdmin)
 */
router.get('/stats', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const stats = db.prepare(`
      SELECT 
        SUM(amount_due) as total_invoiced,
        SUM(amount_paid) as total_collected,
        SUM(amount_due - amount_paid) as outstanding_debt,
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as count_paid,
        SUM(CASE WHEN status = 'Partial' THEN 1 ELSE 0 END) as count_partial,
        SUM(CASE WHEN status = 'Unpaid' THEN 1 ELSE 0 END) as count_unpaid
      FROM invoices
    `).get();

    res.json({
      success: true,
      data: {
        total_invoiced: stats.total_invoiced || 0,
        total_collected: stats.total_collected || 0,
        outstanding_debt: stats.outstanding_debt || 0,
        total_invoices: stats.total_invoices || 0,
        count_paid: stats.count_paid || 0,
        count_partial: stats.count_partial || 0,
        count_unpaid: stats.count_unpaid || 0,
        collection_rate_percent: stats.total_invoiced > 0 
          ? Math.round((stats.total_collected / stats.total_invoiced) * 100) 
          : 0
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/invoices
 * List invoices with filters (Scoped by user role and ownership)
 */
router.get('/invoices', authenticate, (req, res, next) => {
  try {
    const { status, student_id, session, limit = 50 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    let conditions = [];
    const params = [];

    // Role-based scoping
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student) {
        return res.json({ success: true, count: 0, data: [] });
      }
      conditions.push('i.student_id = ?');
      params.push(student.id);
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 10 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase() || '___no_guardian_email___';
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const children = db.prepare(`
        SELECT id FROM students 
        WHERE (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
           OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
           OR UPPER(admission_no) = ?
      `).all(`%${last10}%`, cleanEmail, cleanRef);

      const childIds = children.map(c => c.id);
      if (childIds.length === 0) {
        return res.json({ success: true, count: 0, data: [] });
      }
      if (student_id && childIds.includes(parseInt(student_id))) {
        conditions.push('i.student_id = ?');
        params.push(parseInt(student_id));
      } else {
        conditions.push(`i.student_id IN (${childIds.map(() => '?').join(',')})`);
        params.push(...childIds);
      }
    } else if (!['admin', 'superadmin', 'bursar'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied to financial records.' });
    } else if (student_id) {
      conditions.push('i.student_id = ?');
      params.push(parseInt(student_id));
    }

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }
    if (session) {
      conditions.push('i.session = ?');
      params.push(session);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const invoices = db.prepare(`
      SELECT 
        i.*,
        s.admission_no, s.first_name, s.last_name, s.guardian_name, s.guardian_phone,
        c.name as class_name
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      ${whereClause}
      ORDER BY i.id DESC
      LIMIT ?
    `).all(...params, safeLimit);

    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/invoices/:id
 * Single invoice details with payments (Ownership verified)
 */
router.get('/invoices/:id', authenticate, (req, res, next) => {
  try {
    const invoice = db.prepare(`
      SELECT 
        i.*,
        s.admission_no, s.first_name, s.last_name, s.guardian_name, s.guardian_phone, s.guardian_email,
        c.name as class_name
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Role-based ownership check
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student || student.id !== invoice.student_id) {
        return res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 10 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase() || '___no_guardian_email___';
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const child = db.prepare(`
        SELECT id FROM students 
        WHERE id = ? AND (
          (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
          OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
          OR UPPER(admission_no) = ?
        )
      `).get(invoice.student_id, `%${last10}%`, cleanEmail, cleanRef);

      if (!child) {
        return res.status(403).json({ success: false, message: 'Access denied to this student invoice.' });
      }
    } else if (!['admin', 'superadmin', 'bursar'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied to invoice.' });
    }

    const payments = db.prepare(`
      SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC
    `).all(invoice.id);

    res.json({
      success: true,
      data: {
        ...invoice,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/finance/invoices
 * Generate new invoice (Bursar / Admin)
 */
router.post('/invoices', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { student_id, title, amount_due, session = '2026/2027', term = 'First Term', due_date } = req.body;

    if (!student_id || !title || !positiveMoney(amount_due)) {
      return res.status(400).json({
        success: false,
        message: 'student_id, title, and amount_due are required.'
      });
    }

    const invoiceNo = `INV-${randomUUID()}`;
    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_no, student_id, session, term, title, amount_due, amount_paid, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'Unpaid', ?)
    `);

    const result = stmt.run(invoiceNo, student_id, session, term, title, parseFloat(amount_due), due_date || null);

    logAudit(req.user.id, 'CREATE_INVOICE', 'FINANCE', `Created invoice ${invoiceNo} for student ${student_id}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      invoice: {
        id: result.lastInsertRowid,
        invoice_no: invoiceNo,
        amount_due: parseFloat(amount_due)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/finance/payments
 * Record fee payment and update invoice balance
 */
router.post('/payments', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { invoice_id, amount, payment_method = 'Bank Transfer', reference } = req.body;

    if (!invoice_id || !positiveMoney(amount)) {
      return res.status(400).json({
        success: false,
        message: 'invoice_id and a positive payment amount are required.'
      });
    }

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const payAmount = parseFloat(amount);
    if (payAmount > invoice.amount_due - invoice.amount_paid) {
      return res.status(400).json({ success: false, message: 'Payment exceeds the outstanding invoice balance.' });
    }
    if (reference && db.prepare('SELECT id FROM payments WHERE reference = ?').get(reference)) {
      return res.status(409).json({ success: false, message: 'Payment reference has already been recorded.' });
    }
    const newPaid = invoice.amount_paid + payAmount;
    const newStatus = newPaid >= invoice.amount_due ? 'Paid' : 'Partial';
    const receiptNo = `RCT-${randomUUID()}`;

    // Wrap financial update in an atomic transaction to prevent partial execution
    const processPayment = db.transaction(() => {
      // 1. Update invoice balance and status
      db.prepare(`
        UPDATE invoices
        SET amount_paid = ?, status = ?
        WHERE id = ?
      `).run(newPaid, newStatus, invoice_id);

      // 2. Record payment receipt ledger
      db.prepare(`
        INSERT INTO payments (invoice_id, receipt_no, amount, payment_method, reference, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        invoice_id,
        receiptNo,
        payAmount,
        payment_method,
        reference || `MANUAL-${Date.now()}`,
        req.user.full_name || 'Bursar'
      );
    });

    processPayment();

    logAudit(req.user.id, 'RECORD_PAYMENT', 'FINANCE', `Recorded payment ${receiptNo} of ₦${payAmount} on invoice ${invoice.invoice_no}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      receipt_no: receiptNo,
      updated_invoice: {
        id: invoice_id,
        amount_paid: newPaid,
        status: newStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/finance/invoices/batch
 * Batch billing for class cohorts or all active students
 */
router.post('/invoices/batch', authenticate, requireRoles('bursar', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const {
      class_id,
      session = '2026/2027',
      term = 'First Term',
      title,
      due_date,
      breakdown,
      amount_due
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Invoice title is required for batch billing.' });
    }

    let calculatedAmount = parseFloat(amount_due) || 0;
    let breakdownJson = null;

    if (breakdown && typeof breakdown === 'object') {
      const tuition = parseFloat(breakdown.tuition) || 0;
      const books = parseFloat(breakdown.books) || 0;
      const uniform = parseFloat(breakdown.uniform) || 0;
      const development_levy = parseFloat(breakdown.development_levy) || 0;
      const other = parseFloat(breakdown.other) || 0;
      const sum = tuition + books + uniform + development_levy + other;
      if (sum > 0) {
        calculatedAmount = sum;
      }
      breakdownJson = JSON.stringify({
        tuition,
        books,
        uniform,
        development_levy,
        other
      });
    }

    if (!positiveMoney(calculatedAmount) || (breakdown && Object.values(JSON.parse(breakdownJson)).some(value => !Number.isFinite(value) || value < 0))) {
      return res.status(400).json({ success: false, message: 'Total amount due must be greater than zero.' });
    }

    // Fetch target students
    let students = [];
    if (class_id && class_id !== 'ALL') {
      students = db.prepare('SELECT id, admission_no, first_name, last_name FROM students WHERE class_id = ? AND is_active = 1').all(class_id);
    } else {
      students = db.prepare('SELECT id, admission_no, first_name, last_name FROM students WHERE is_active = 1').all();
    }

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No active students found for selected criteria.' });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const createdInvoices = [];

    const insertBatch = db.transaction(() => {
      const checkStmt = db.prepare('SELECT id FROM invoices WHERE student_id = ? AND session = ? AND term = ? AND title = ?');
      const insertStmt = db.prepare(`
        INSERT INTO invoices (invoice_no, student_id, session, term, title, amount_due, amount_paid, status, due_date, breakdown_json)
        VALUES (?, ?, ?, ?, ?, ?, 0, 'Unpaid', ?, ?)
      `);

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const existing = checkStmt.get(student.id, session, term, title);
        if (existing) {
          skippedCount++;
          continue;
        }

        const invoiceNo = `INV-${randomUUID()}`;
        const result = insertStmt.run(
          invoiceNo,
          student.id,
          session,
          term,
          title,
          calculatedAmount,
          due_date || null,
          breakdownJson
        );

        createdCount++;
        createdInvoices.push({
          id: result.lastInsertRowid,
          invoice_no: invoiceNo,
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          amount_due: calculatedAmount
        });
      }
    });

    insertBatch();

    logAudit(req.user.id, 'BATCH_INVOICE', 'FINANCE', `Generated ${createdCount} batch invoices for '${title}' (${session} - ${term}). Skipped: ${skippedCount}`, req.ip);

    res.status(201).json({
      success: true,
      message: `Batch invoicing completed. Created ${createdCount} invoices (${skippedCount} duplicates skipped).`,
      count_created: createdCount,
      count_skipped: skippedCount,
      total_amount_billed: createdCount * calculatedAmount,
      invoices: createdInvoices
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/finance/checkout/initialize
 * Start Paystack fee payment transaction for an invoice
 */
router.post('/checkout/initialize', authenticate, async (req, res, next) => {
  try {
    const { invoice_id, amount, email, callback_url } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ success: false, message: 'invoice_id is required.' });
    }

    const invoice = db.prepare(`
      SELECT i.*, s.admission_no, s.first_name, s.last_name, s.guardian_name, s.guardian_email, s.guardian_phone
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.id = ?
    `).get(invoice_id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (!canAccessInvoice(req.user, invoice)) {
      return res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'This invoice has already been fully paid.' });
    }

    // Role-based access validation for parents & students
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student || student.id !== invoice.student_id) {
        return res.status(403).json({ success: false, message: 'Access denied to this student invoice.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 10 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase() || '___no_guardian_email___';
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const child = db.prepare(`
        SELECT id FROM students 
        WHERE id = ? AND (
          (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
          OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
          OR UPPER(admission_no) = ?
        )
      `).get(invoice.student_id, `%${last10}%`, cleanEmail, cleanRef);

      if (!child) {
        return res.status(403).json({ success: false, message: 'Access denied to this student invoice.' });
      }
    }

    const remainingBalance = invoice.amount_due - invoice.amount_paid;
    const paymentAmount = amount === undefined ? remainingBalance : Math.min(Number(amount), remainingBalance);

    if (!positiveMoney(paymentAmount)) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const customerEmail = email || invoice.guardian_email || req.user.email || 'billing@eaglepowerschools.com.ng';
    const reference = `PSTK-${randomUUID()}`;

    const paystackResult = await initializeFeePayment({
      email: customerEmail,
      amount: paymentAmount,
      reference,
      callback_url: callback_url || `${req.headers.origin || ''}/portal`,
      metadata: {
        invoice_id: invoice.id,
        invoice_no: invoice.invoice_no,
        student_id: invoice.student_id,
        student_name: `${invoice.first_name} ${invoice.last_name}`,
        user_id: req.user.id
      }
    });

    // Save reference and access code on invoice
    db.prepare(`
      UPDATE invoices
      SET paystack_reference = ?, paystack_access_code = ?
      WHERE id = ?
    `).run(reference, paystackResult.access_code || null, invoice.id);

    res.json({
      success: true,
      data: {
        authorization_url: paystackResult.authorization_url,
        access_code: paystackResult.access_code,
        reference,
        amount: paymentAmount,
        invoice_id: invoice.id,
        is_simulated: paystackResult.is_simulated || false
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/checkout/verify/:reference
 * Verify Paystack transaction and credit student invoice
 */
router.get('/checkout/verify/:reference', authenticate, async (req, res, next) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required.' });
    }

    // 1. Check if payment was already processed
    const existingPayment = db.prepare('SELECT * FROM payments WHERE reference = ?').get(reference);
    if (existingPayment) {
      const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(existingPayment.invoice_id);
      if (!invoice || !canAccessInvoice(req.user, invoice)) {
        return res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
      }
      return res.json({
        success: true,
        already_processed: true,
        receipt_no: existingPayment.receipt_no,
        invoice
      });
    }

    // 2. Locate matching invoice
    let invoice = db.prepare('SELECT * FROM invoices WHERE paystack_reference = ?').get(reference);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice corresponding to this reference could not be found.' });
    }

    if (!canAccessInvoice(req.user, invoice)) {
      return res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
    }

    // 3. Verify with Paystack service
    const verifyResult = await verifyFeePayment(reference);
    if (!verifyResult.success || (verifyResult.status && verifyResult.status !== 'success')) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed or payment was not completed on Paystack.'
      });
    }

    if (!positiveMoney(verifyResult.amount) || verifyResult.reference !== reference ||
        (verifyResult.metadata?.invoice_id != null && Number(verifyResult.metadata.invoice_id) !== invoice.id) ||
        (verifyResult.raw?.currency && verifyResult.raw.currency !== 'NGN')) {
      return res.status(400).json({ success: false, message: 'Verified payment does not match this invoice or has an invalid amount.' });
    }
    const verifiedAmount = Number(verifyResult.amount);
    let receiptNo = `RCT-${randomUUID()}`;
    let alreadyProcessed = false;

    // 4. Record payment atomically
    const processPayment = db.transaction(() => {
      const recorded = db.prepare('SELECT receipt_no FROM payments WHERE reference = ?').get(reference);
      if (recorded) {
        receiptNo = recorded.receipt_no;
        alreadyProcessed = true;
        return;
      }
      const currentInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);
      const newPaid = Math.round((currentInvoice.amount_paid + verifiedAmount) * 100) / 100;
      const newStatus = newPaid >= currentInvoice.amount_due ? 'Paid' : 'Partial';
      db.prepare(`
        UPDATE invoices
        SET amount_paid = ?, status = ?
        WHERE id = ?
      `).run(newPaid, newStatus, invoice.id);

      db.prepare(`
        INSERT INTO payments (invoice_id, receipt_no, amount, payment_method, reference, recorded_by)
        VALUES (?, ?, ?, 'Paystack Online', ?, ?)
      `).run(
        invoice.id,
        receiptNo,
        verifiedAmount,
        reference,
        req.user.full_name || 'Paystack Online Gateway'
      );
    });

    processPayment();

    logAudit(req.user.id, 'PAYSTACK_PAYMENT_VERIFIED', 'FINANCE', `Verified Paystack payment ${receiptNo} of ₦${verifiedAmount} for invoice ${invoice.invoice_no} (Ref: ${reference})`, req.ip);

    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);

    res.json({
      success: true,
      verified: true,
      already_processed: alreadyProcessed,
      receipt_no: receiptNo,
      amount: verifiedAmount,
      invoice: updatedInvoice
    });
  } catch (err) {
    next(err);
  }
});

export default router;
