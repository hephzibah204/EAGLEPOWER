import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/finance/stats
 * Bursary financial analytics
 */
router.get('/stats', (req, res, next) => {
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
 * List invoices with filters
 */
router.get('/invoices', (req, res, next) => {
  try {
    const { status, student_id, session, limit = 50 } = req.query;
    let conditions = [];
    const params = [];

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }
    if (student_id) {
      conditions.push('i.student_id = ?');
      params.push(parseInt(student_id));
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
    `).all(...params, parseInt(limit));

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
 * Single invoice details with payments
 */
router.get('/invoices/:id', (req, res, next) => {
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

    // Update invoice
    db.prepare(`
      UPDATE invoices
      SET amount_paid = ?, status = ?
      WHERE id = ?
    `).run(newPaid, newStatus, invoice_id);

    // Record payment receipt
    const receiptNo = `RCT-${Date.now().toString().slice(-6)}`;
    const payStmt = db.prepare(`
      INSERT INTO payments (invoice_id, receipt_no, amount, payment_method, reference, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    payStmt.run(
      invoice_id,
      receiptNo,
      payAmount,
      payment_method,
      reference || `MANUAL-${Date.now()}`,
      req.user.full_name || 'Bursar'
    );

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
