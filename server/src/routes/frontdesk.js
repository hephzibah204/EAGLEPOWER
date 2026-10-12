import express from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// ==========================================
// 1. FRONT DESK OVERVIEW & STATS
// ==========================================
router.get('/stats', (req, res, next) => {
  try {
    const visitorsInCampus = db.prepare("SELECT COUNT(*) as c FROM frontdesk_visitors WHERE status = 'In Campus'").get().c;
    const totalVisitors = db.prepare("SELECT COUNT(*) as c FROM frontdesk_visitors").get().c;
    const activeEnquiries = db.prepare("SELECT COUNT(*) as c FROM frontdesk_enquiries WHERE status = 'Active'").get().c;
    const pendingComplaints = db.prepare("SELECT COUNT(*) as c FROM frontdesk_complaints WHERE status = 'Pending'").get().c;
    const totalCalls = db.prepare("SELECT COUNT(*) as c FROM frontdesk_calls").get().c;
    const totalDispatches = db.prepare("SELECT COUNT(*) as c FROM frontdesk_dispatch").get().c;

    res.json({
      success: true,
      stats: {
        visitors_in_campus: visitorsInCampus,
        total_visitors: totalVisitors,
        active_enquiries: activeEnquiries,
        pending_complaints: pendingComplaints,
        total_calls: totalCalls,
        total_dispatches: totalDispatches
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. VISITORS BOOK / SECURITY PASSES
// ==========================================
router.get('/visitors', (req, res, next) => {
  try {
    const { status, q } = req.query;
    let conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (q) {
      conditions.push('(visitor_name LIKE ? OR phone LIKE ? OR pass_no LIKE ? OR person_to_see LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const visitors = db.prepare(`SELECT * FROM frontdesk_visitors ${where} ORDER BY id DESC`).all(...params);

    res.json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (err) {
    next(err);
  }
});

router.post('/visitors', (req, res, next) => {
  try {
    const { visitor_name, phone, purpose, person_to_see, id_card_type, badge_no, remarks } = req.body;

    if (!visitor_name || !phone || !purpose || !person_to_see) {
      return res.status(400).json({
        success: false,
        message: 'visitor_name, phone, purpose, and person_to_see are required.'
      });
    }

    const passNo = `VIS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const stmt = db.prepare(`
      INSERT INTO frontdesk_visitors (pass_no, visitor_name, phone, purpose, person_to_see, id_card_type, status, badge_no, remarks)
      VALUES (?, ?, ?, ?, ?, ?, 'In Campus', ?, ?)
    `);

    const result = stmt.run(
      passNo,
      visitor_name.trim(),
      phone.trim(),
      purpose.trim(),
      person_to_see.trim(),
      id_card_type || 'National ID (NIN)',
      badge_no || `BADGE-${Math.floor(1 + Math.random() * 20)}`,
      remarks || null
    );

    logAudit(null, 'VISITOR_CHECKIN', 'FRONTDESK', `Visitor ${visitor_name} checked in with pass ${passNo}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully.',
      visitor: {
        id: result.lastInsertRowid,
        pass_no: passNo,
        visitor_name,
        person_to_see,
        status: 'In Campus',
        badge_no: badge_no || 'Assigned'
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/visitors/:id/checkout', authenticate, requireRoles('admin', 'superadmin', 'bursar', 'teacher'), (req, res, next) => {
  try {
    const stmt = db.prepare(`
      UPDATE frontdesk_visitors
      SET status = 'Checked Out', check_out_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Visitor record not found.' });
    }

    logAudit(null, 'VISITOR_CHECKOUT', 'FRONTDESK', `Visitor ID ${req.params.id} checked out`, req.ip);

    res.json({
      success: true,
      message: 'Visitor checked out successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. ADMISSION ENQUIRIES / LEADS
// ==========================================
router.get('/enquiries', (req, res, next) => {
  try {
    const { status, class_interested } = req.query;
    let conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (class_interested) {
      conditions.push('class_interested = ?');
      params.push(class_interested);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const enquiries = db.prepare(`SELECT * FROM frontdesk_enquiries ${where} ORDER BY id DESC`).all(...params);

    res.json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (err) {
    next(err);
  }
});

router.post('/enquiries', (req, res, next) => {
  try {
    const { name, phone, email, class_interested, source = 'Walk-in', follow_up_date, notes } = req.body;

    if (!name || !phone || !class_interested) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, and class_interested are required.'
      });
    }

    const enquiryNo = `ENQ-2025-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO frontdesk_enquiries (enquiry_no, name, phone, email, class_interested, source, enquiry_date, follow_up_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `);

    const result = stmt.run(
      enquiryNo,
      name.trim(),
      phone.trim(),
      email || null,
      class_interested.trim(),
      source,
      today,
      follow_up_date || null,
      notes || null
    );

    logAudit(null, 'NEW_ENQUIRY', 'FRONTDESK', `Enquiry ${enquiryNo} logged for ${name}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Admission enquiry logged successfully.',
      enquiry: {
        id: result.lastInsertRowid,
        enquiry_no: enquiryNo,
        name,
        class_interested,
        status: 'Active'
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/enquiries/:id/status', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const valid = ['Active', 'Followed Up', 'Converted/Admitted', 'Closed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });
    }

    let query = 'UPDATE frontdesk_enquiries SET status = ?';
    const params = [status];
    if (notes) {
      query += ', notes = notes || " | " || ?';
      params.push(notes);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);

    db.prepare(query).run(...params);

    res.json({
      success: true,
      message: `Enquiry status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. PHONE CALL LOGS
// ==========================================
router.get('/calls', (req, res, next) => {
  try {
    const calls = db.prepare('SELECT * FROM frontdesk_calls ORDER BY id DESC').all();
    res.json({
      success: true,
      count: calls.length,
      data: calls
    });
  } catch (err) {
    next(err);
  }
});

router.post('/calls', (req, res, next) => {
  try {
    const { caller_name, phone, call_type = 'Incoming', duration, purpose, follow_up_needed = 0, message } = req.body;

    if (!caller_name || !phone || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'caller_name, phone, and purpose are required.'
      });
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const stmt = db.prepare(`
      INSERT INTO frontdesk_calls (caller_name, phone, call_type, call_date, duration, purpose, follow_up_needed, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(caller_name.trim(), phone.trim(), call_type, now, duration || '3 mins', purpose.trim(), follow_up_needed ? 1 : 0, message || null);

    res.status(201).json({
      success: true,
      message: 'Call logged successfully.',
      call_id: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. POSTAL / COURIER DISPATCH & RECEIVE
// ==========================================
router.get('/dispatch', (req, res, next) => {
  try {
    const records = db.prepare('SELECT * FROM frontdesk_dispatch ORDER BY id DESC').all();
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
});

router.post('/dispatch', (req, res, next) => {
  try {
    const { dispatch_type = 'Received', to_title, from_title, document_title, handled_by } = req.body;

    if (!to_title || !from_title || !document_title) {
      return res.status(400).json({
        success: false,
        message: 'to_title, from_title, and document_title are required.'
      });
    }

    const prefix = dispatch_type === 'Received' ? 'REC' : 'DIS';
    const refNo = `${prefix}-2025-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO frontdesk_dispatch (dispatch_type, reference_no, to_title, from_title, document_title, date, handled_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(dispatch_type, refNo, to_title.trim(), from_title.trim(), document_title.trim(), today, handled_by || 'Frontdesk Secretary');

    res.status(201).json({
      success: true,
      message: `${dispatch_type} parcel/document recorded successfully.`,
      reference_no: refNo
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. COMPLAINTS & FEEDBACK MANAGEMENT
// ==========================================
router.get('/complaints', (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? 'WHERE status = ?' : '';
    const params = status ? [status] : [];
    const complaints = db.prepare(`SELECT * FROM frontdesk_complaints ${where} ORDER BY id DESC`).all(...params);

    res.json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (err) {
    next(err);
  }
});

router.post('/complaints', (req, res, next) => {
  try {
    const { complainant_name, complainant_phone, complaint_type = 'Academics', description, assigned_to } = req.body;

    if (!complainant_name || !description) {
      return res.status(400).json({
        success: false,
        message: 'complainant_name and description are required.'
      });
    }

    const complaintNo = `CMP-2025-${Math.floor(10 + Math.random() * 90)}`;
    const stmt = db.prepare(`
      INSERT INTO frontdesk_complaints (complaint_no, complainant_name, complainant_phone, complaint_type, description, assigned_to, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `);

    const result = stmt.run(complaintNo, complainant_name.trim(), complainant_phone || null, complaint_type, description.trim(), assigned_to || 'Administrative Officer');

    logAudit(null, 'NEW_COMPLAINT', 'FRONTDESK', `Complaint ${complaintNo} submitted by ${complainant_name}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Complaint/Feedback logged successfully. Management will review promptly.',
      complaint_no: complaintNo
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/complaints/:id/resolve', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { resolution_notes } = req.body;
    if (!resolution_notes) {
      return res.status(400).json({ success: false, message: 'resolution_notes is required.' });
    }

    const stmt = db.prepare(`
      UPDATE frontdesk_complaints
      SET status = 'Resolved', resolution_notes = ?
      WHERE id = ?
    `);

    stmt.run(resolution_notes.trim(), req.params.id);

    res.json({
      success: true,
      message: 'Complaint marked as resolved.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
