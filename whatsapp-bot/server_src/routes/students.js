import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/students
 * List or search students
 */
router.get('/', (req, res, next) => {
  try {
    const { q, class_id, section_id, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['s.is_active = 1'];
    const params = [];

    if (q) {
      conditions.push('(s.admission_no LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (class_id) {
      conditions.push('s.class_id = ?');
      params.push(parseInt(class_id));
    }

    if (section_id) {
      conditions.push('s.section_id = ?');
      params.push(parseInt(section_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM students s ${whereClause}`);
    const total = countStmt.get(...params).total;

    const dataStmt = db.prepare(`
      SELECT 
        s.id, s.admission_no, s.first_name, s.last_name, s.gender, s.dob,
        s.guardian_name, s.guardian_phone, s.guardian_email, s.address,
        c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      ${whereClause}
      ORDER BY s.admission_no ASC
      LIMIT ? OFFSET ?
    `);

    const students = dataStmt.all(...params, parseInt(limit), offset);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: students
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students/lookup/:admissionNo
 * Student Portal quick lookup by admission number
 */
router.get('/lookup/:admissionNo', (req, res, next) => {
  try {
    const { admissionNo } = req.params;
    const cleanNo = admissionNo.trim().toUpperCase();

    const student = db.prepare(`
      SELECT 
        s.*, c.name as class_name, c.division, c.termly_tuition, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE UPPER(s.admission_no) = ?
    `).get(cleanNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No active student found with Admission Number: ${cleanNo}`
      });
    }

    // Retrieve recent marks
    const marks = db.prepare(`
      SELECT m.*, sub.name as subject_name, sub.code as subject_code
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.student_id = ?
      ORDER BY sub.name ASC
    `).all(student.id);

    // Retrieve invoices
    const invoices = db.prepare(`
      SELECT * FROM invoices WHERE student_id = ? ORDER BY id DESC
    `).all(student.id);

    res.json({
      success: true,
      data: {
        ...student,
        marks,
        invoices
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students/:id
 * Retrieve detailed student record
 */
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const student = db.prepare(`
      SELECT 
        s.*, c.name as class_name, c.division, c.termly_tuition, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const marks = db.prepare(`
      SELECT m.*, sub.name as subject_name, sub.code as subject_code
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.student_id = ?
    `).all(student.id);

    const invoices = db.prepare(`
      SELECT * FROM invoices WHERE student_id = ? ORDER BY id DESC
    `).all(student.id);

    res.json({
      success: true,
      data: {
        ...student,
        marks,
        invoices
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students
 * Enroll new student (Admin only)
 */
router.post('/', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const {
      admission_no, first_name, last_name, gender, dob,
      class_id, section_id, guardian_name, guardian_phone,
      guardian_email, address
    } = req.body;

    if (!admission_no || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Admission number, first name, and last name are required.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO students (
        admission_no, first_name, last_name, gender, dob,
        class_id, section_id, guardian_name, guardian_phone,
        guardian_email, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      admission_no.trim().toUpperCase(),
      first_name.trim(),
      last_name.trim(),
      gender || 'Male',
      dob || null,
      class_id || null,
      section_id || null,
      guardian_name || null,
      guardian_phone || null,
      guardian_email || null,
      address || null
    );

    logAudit(req.user.id, 'ENROLL_STUDENT', 'STUDENTS', `Enrolled student ${admission_no}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully.',
      student_id: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
});

export default router;
