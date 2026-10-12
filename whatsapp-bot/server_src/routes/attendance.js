import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/attendance/students
 * Query student attendance by date and class_id
 */
router.get('/students', authenticate, (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0], class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    // Get all students in the class along with any existing attendance record for this date
    const stmt = db.prepare(`
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.guardian_phone,
        sa.id as attendance_id,
        COALESCE(sa.status, 'Unrecorded') as status,
        sa.remarks,
        sa.recorded_by
      FROM students s
      LEFT JOIN student_attendance sa 
        ON s.id = sa.student_id AND sa.date = ?
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.admission_no ASC
    `);

    const records = stmt.all(date, parseInt(class_id));

    res.json({
      success: true,
      date,
      class_id: parseInt(class_id),
      total_students: records.length,
      records
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/attendance/students/batch
 * Record or update batch student attendance
 */
router.post('/students/batch', authenticate, requireRoles('superadmin', 'admin', 'teacher'), (req, res, next) => {
  try {
    const { class_id, date = new Date().toISOString().split('T')[0], records } = req.body;

    if (!class_id || !Array.isArray(records)) {
      return res.status(400).json({ error: 'class_id and records array are required' });
    }

    const recorded_by = req.user?.username || 'admin';

    const upsertStmt = db.prepare(`
      INSERT INTO student_attendance (student_id, class_id, date, status, remarks, recorded_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, date) DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        recorded_by = excluded.recorded_by,
        updated_at = CURRENT_TIMESTAMP
    `);

    let updatedCount = 0;
    for (const item of records) {
      if (!item.student_id || !item.status) continue;
      upsertStmt.run(
        item.student_id,
        parseInt(class_id),
        date,
        item.status,
        item.remarks || null,
        recorded_by
      );
      updatedCount++;
    }

    logAudit(req.user?.id || 'system', 'RECORD_STUDENT_ATTENDANCE', 'student_attendance', {
      class_id,
      date,
      count: updatedCount
    }, req.ip);

    res.json({
      success: true,
      message: `Successfully recorded attendance for ${updatedCount} students`,
      date,
      class_id
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/attendance/staff
 * Query staff attendance by date
 */
router.get('/staff', authenticate, requireRoles('superadmin', 'admin'), (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const stmt = db.prepare(`
      SELECT 
        st.id as staff_id,
        st.staff_no,
        st.name,
        st.role,
        st.phone,
        sa.id as attendance_id,
        COALESCE(sa.status, 'Unrecorded') as status,
        sa.clock_in,
        sa.clock_out,
        sa.remarks
      FROM staff st
      LEFT JOIN staff_attendance sa 
        ON st.id = sa.staff_id AND sa.date = ?
      WHERE st.is_active = 1
      ORDER BY st.name ASC
    `);

    const records = stmt.all(date);

    res.json({
      success: true,
      date,
      total_staff: records.length,
      records
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/attendance/staff/clockin
 * Clock-in for staff
 */
router.post('/staff/clockin', authenticate, (req, res, next) => {
  try {
    const { staff_id, date = new Date().toISOString().split('T')[0], remarks } = req.body;
    const targetStaffId = staff_id || req.user?.reference_id;

    if (!targetStaffId) {
      return res.status(400).json({ error: 'staff_id is required' });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO staff_attendance (staff_id, date, status, clock_in, remarks, recorded_by)
      VALUES (?, ?, 'Present', ?, ?, ?)
      ON CONFLICT(staff_id, date) DO UPDATE SET
        clock_in = COALESCE(clock_in, excluded.clock_in),
        status = 'Present',
        remarks = COALESCE(excluded.remarks, remarks),
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(targetStaffId, date, now, remarks || null, req.user?.username || 'self');

    res.json({
      success: true,
      message: 'Clock-in recorded successfully',
      staff_id: targetStaffId,
      date,
      clock_in: now
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/attendance/staff/clockout
 * Clock-out for staff
 */
router.post('/staff/clockout', authenticate, (req, res, next) => {
  try {
    const { staff_id, date = new Date().toISOString().split('T')[0] } = req.body;
    const targetStaffId = staff_id || req.user?.reference_id;

    if (!targetStaffId) {
      return res.status(400).json({ error: 'staff_id is required' });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE staff_attendance
      SET clock_out = ?, updated_at = CURRENT_TIMESTAMP
      WHERE staff_id = ? AND date = ?
    `);

    stmt.run(now, targetStaffId, date);

    res.json({
      success: true,
      message: 'Clock-out recorded successfully',
      staff_id: targetStaffId,
      date,
      clock_out: now
    });
  } catch (err) {
    next(err);
  }
});

export default router;
