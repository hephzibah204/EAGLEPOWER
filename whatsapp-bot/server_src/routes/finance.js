import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

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
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase();
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
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase();
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
    const { student_id, title, amount_due, session = '2024/2025', term = 'Second Term', due_date } = req.body;

    if (!student_id || !title || !amount_due) {
      return res.status(400).json({
        success: false,
        message: 'student_id, title, and amount_due are required.'
      });
    }

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
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

    if (!invoice_id || !amount || parseFloat(amount) <= 0) {
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
    const newPaid = invoice.amount_paid + payAmount;
    const newStatus = newPaid >= invoice.amount_due ? 'Paid' : 'Partial';
    const receiptNo = `RCT-${Date.now().toString().slice(-6)}`;

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

export default router;
