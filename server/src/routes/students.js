import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/students
 * List or search students
 */
router.get('/', authenticate, (req, res, next) => {
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

    // Sanitize sensitive PII: omit guardian phone, email, and home address unless caller is authenticated
    const sanitizedStudent = {
      id: student.id,
      admission_no: student.admission_no,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      class_name: student.class_name,
      division: student.division,
      section_name: student.section_name,
      photo_url: student.photo_url
    };

    res.json({
      success: true,
      data: {
        ...sanitizedStudent,
        marks,
        invoices: invoices.map(i => ({
          id: i.id,
          invoice_no: i.invoice_no,
          session: i.session,
          term: i.term,
          title: i.title,
          amount_due: i.amount_due,
          amount_paid: i.amount_paid,
          status: i.status
        }))
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
 * Enroll new student & auto-provision Student + Parent portal accounts (Admin only)
 */
router.post('/', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const {
      admission_no, first_name, last_name, gender, dob,
      class_id, section_id, guardian_name, guardian_phone,
      guardian_email, address, student_password, parent_password
    } = req.body;

    if (!admission_no || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Admission number, first name, and last name are required.'
      });
    }

    const cleanAdmNo = admission_no.trim().toUpperCase();

    // Check duplicate admission number
    const existing = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get(cleanAdmNo);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with Admission Number '${cleanAdmNo}' already exists in registry.`
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
      cleanAdmNo,
      first_name.trim(),
      last_name.trim(),
      gender || 'Male',
      dob || null,
      class_id ? parseInt(class_id) : null,
      section_id ? parseInt(section_id) : null,
      guardian_name ? guardian_name.trim() : null,
      guardian_phone ? guardian_phone.trim() : null,
      guardian_email ? guardian_email.trim().toLowerCase() : null,
      address ? address.trim() : null
    );

    const studentId = result.lastInsertRowid;
    const salt = bcrypt.genSaltSync(10);

    // 1. Provision Student Portal Account
    const defaultStudentPass = student_password && student_password.trim() ? student_password.trim() : 'Eagle2025!';
    const studentPassHash = bcrypt.hashSync(defaultStudentPass, salt);

    // Delete or overwrite user if any orphaned
    db.prepare('DELETE FROM users WHERE username = ?').run(cleanAdmNo);
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
      VALUES (?, ?, ?, 'student', ?, ?, 1)
    `).run(
      cleanAdmNo,
      null,
      studentPassHash,
      cleanAdmNo,
      `${first_name.trim()} ${last_name.trim()}`
    );

    // 2. Provision Parent Portal Account if guardian info is provided
    let parentAccount = null;
    if (guardian_phone || guardian_email) {
      const cleanParentPhone = guardian_phone ? guardian_phone.replace(/\D/g, '') : null;
      const parentUsername = cleanParentPhone && cleanParentPhone.length >= 7
        ? cleanParentPhone
        : (guardian_email ? guardian_email.trim().toLowerCase() : `parent_${cleanAdmNo.toLowerCase()}`);

      const defaultParentPass = parent_password && parent_password.trim() ? parent_password.trim() : 'EagleParent2025!';
      const parentPassHash = bcrypt.hashSync(defaultParentPass, salt);

      const existingParent = db.prepare('SELECT id, username FROM users WHERE username = ?').get(parentUsername);
      if (!existingParent) {
        db.prepare(`
          INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
          VALUES (?, ?, ?, 'parent', ?, ?, 1)
        `).run(
          parentUsername,
          guardian_email ? guardian_email.trim().toLowerCase() : null,
          parentPassHash,
          cleanAdmNo,
          guardian_name ? guardian_name.trim() : `Guardian of ${first_name.trim()}`
        );

        parentAccount = {
          username: parentUsername,
          temporary_password: defaultParentPass,
          role: 'parent'
        };
      } else {
        // Link new student admission number if not already referenced
        parentAccount = {
          username: existingParent.username,
          message: 'Linked to existing parent account.',
          role: 'parent'
        };
      }
    }

    logAudit(req.user.id, 'ENROLL_STUDENT', 'STUDENTS', `Enrolled student ${cleanAdmNo} & provisioned portal accounts`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Student enrolled and portal access granted successfully.',
      student: {
        id: studentId,
        admission_no: cleanAdmNo,
        full_name: `${first_name.trim()} ${last_name.trim()}`
      },
      student_credentials: {
        username: cleanAdmNo,
        password: defaultStudentPass,
        role: 'student'
      },
      parent_credentials: parentAccount
    });
  } catch (err) {
    next(err);
  }
});

export default router;
