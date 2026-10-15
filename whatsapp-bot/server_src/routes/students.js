import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { authenticate, requireRoles, requireStudentAccess } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

try {
  db.exec('ALTER TABLE students ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;');
} catch {
  // Column already exists
}

/**
 * GET /api/students
 * List or search students (Restricted to Faculty and Admin)
 */
router.get('/', authenticate, requireRoles('superadmin', 'admin', 'teacher', 'bursar'), (req, res, next) => {
  try {
    const { q, class_id, section_id, limit = 50, page = 1 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

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
        s.*,
        c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      ${whereClause}
      ORDER BY s.admission_no ASC
      LIMIT ? OFFSET ?
    `);

    const students = dataStmt.all(...params, safeLimit, offset);

    res.json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: students
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students/lookup/:admissionNo
 * Student Portal quick lookup by admission number (Authenticated & ownership checked)
 */
router.get('/lookup/:admissionNo', authenticate, (req, res, next) => {
  try {
    const { admissionNo } = req.params;
    const cleanNo = admissionNo.trim().toUpperCase();

    // Authorization check
    if (req.user.role === 'student') {
      const selfAdm = (req.user.reference_id || req.user.username || '').toUpperCase();
      if (selfAdm !== cleanNo) {
        return res.status(403).json({ success: false, message: 'Students may only look up their own records.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase();
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const child = db.prepare(`
        SELECT id FROM students 
        WHERE UPPER(admission_no) = ? AND (
          (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
          OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
          OR UPPER(admission_no) = ?
        )
      `).get(cleanNo, `%${last10}%`, cleanEmail, cleanRef);

      if (!child) {
        return res.status(403).json({ success: false, message: 'Access denied: Not your registered ward.' });
      }
    }

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
 * Retrieve detailed student record (Protected by Object-Level Access)
 */
router.get('/:id', authenticate, requireStudentAccess('id', 'id'), (req, res, next) => {
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
      admission_no, first_name, middle_name, last_name, gender, dob,
      class_id, section_id, entry_mode, enrolled_session, enrolled_term, admission_date,
      religion, nationality, state_of_origin, lga_of_origin, mother_tongue,
      blood_group, genotype, allergies, medical_conditions, special_needs,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      previous_school, last_class_passed, reason_for_transfer,
      guardian_title, guardian_name, guardian_relationship, guardian_phone,
      guardian_alt_phone, guardian_email, guardian_occupation, guardian_office_address, address,
      mother_name, mother_phone, mother_email, mother_occupation,
      boarding_status, transport_mode, bus_route, passport_photo,
      student_password, parent_password
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
        admission_no, first_name, middle_name, last_name, gender, dob,
        class_id, section_id, entry_mode, enrolled_session, enrolled_term, admission_date,
        religion, nationality, state_of_origin, lga_of_origin, mother_tongue,
        blood_group, genotype, allergies, medical_conditions, special_needs,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        previous_school, last_class_passed, reason_for_transfer,
        guardian_title, guardian_name, guardian_relationship, guardian_phone,
        guardian_alt_phone, guardian_email, guardian_occupation, guardian_office_address, address,
        mother_name, mother_phone, mother_email, mother_occupation,
        boarding_status, transport_mode, bus_route, passport_photo
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const result = stmt.run(
      cleanAdmNo,
      first_name.trim(),
      middle_name ? middle_name.trim() : null,
      last_name.trim(),
      gender || 'Male',
      dob || null,
      class_id ? parseInt(class_id) : null,
      section_id ? parseInt(section_id) : null,
      entry_mode || 'Fresh Admission',
      enrolled_session || '2024/2025',
      enrolled_term || 'Second Term',
      admission_date || new Date().toISOString().split('T')[0],
      religion || 'Christianity',
      nationality || 'Nigerian',
      state_of_origin ? state_of_origin.trim() : 'Anambra State',
      lga_of_origin ? lga_of_origin.trim() : 'Awka South',
      mother_tongue || 'Igbo / English',
      blood_group || null,
      genotype || null,
      allergies ? allergies.trim() : 'None Reported',
      medical_conditions ? medical_conditions.trim() : 'None Reported',
      special_needs ? special_needs.trim() : 'None',
      emergency_contact_name ? emergency_contact_name.trim() : (guardian_name ? guardian_name.trim() : null),
      emergency_contact_phone ? emergency_contact_phone.trim() : (guardian_phone ? guardian_phone.trim() : null),
      emergency_contact_relationship ? emergency_contact_relationship.trim() : 'Parent/Guardian',
      previous_school ? previous_school.trim() : null,
      last_class_passed ? last_class_passed.trim() : null,
      reason_for_transfer ? reason_for_transfer.trim() : null,
      guardian_title ? guardian_title.trim() : 'Mr/Mrs',
      guardian_name ? guardian_name.trim() : null,
      guardian_relationship || 'Father',
      guardian_phone ? guardian_phone.trim() : null,
      guardian_alt_phone ? guardian_alt_phone.trim() : null,
      guardian_email ? guardian_email.trim().toLowerCase() : null,
      guardian_occupation ? guardian_occupation.trim() : null,
      guardian_office_address ? guardian_office_address.trim() : null,
      address ? address.trim() : 'Awka, Anambra State',
      mother_name ? mother_name.trim() : null,
      mother_phone ? mother_phone.trim() : null,
      mother_email ? mother_email.trim().toLowerCase() : null,
      mother_occupation ? mother_occupation.trim() : null,
      boarding_status || 'Day Student',
      transport_mode || 'Private Pick-up',
      bus_route ? bus_route.trim() : null,
      passport_photo ? passport_photo.trim() : null
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

/**
 * PUT /api/students/:id
 * Update student biodata, guardian contact, and active status (Admin / SuperAdmin)
 */
router.put('/:id', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const {
      first_name, middle_name, last_name, gender, dob, address,
      class_id, section_id, entry_mode, enrolled_session, enrolled_term, admission_date,
      religion, nationality, state_of_origin, lga_of_origin, mother_tongue,
      blood_group, genotype, allergies, medical_conditions, special_needs,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      previous_school, last_class_passed, reason_for_transfer,
      guardian_title, guardian_name, guardian_relationship, guardian_phone,
      guardian_alt_phone, guardian_email, guardian_occupation, guardian_office_address,
      mother_name, mother_phone, mother_email, mother_occupation,
      boarding_status, transport_mode, bus_route, passport_photo,
      is_active
    } = req.body;

    const val = (newVal, oldVal) => newVal !== undefined ? (typeof newVal === 'string' ? newVal.trim() : newVal) : oldVal;

    const newFirstName = val(first_name, existing.first_name);
    const newLastName = val(last_name, existing.last_name);
    const newClassId = class_id !== undefined ? (class_id ? parseInt(class_id) : null) : existing.class_id;
    const newIsActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE students SET
        first_name = ?, middle_name = ?, last_name = ?, gender = ?, dob = ?, address = ?,
        class_id = ?, section_id = ?, entry_mode = ?, enrolled_session = ?, enrolled_term = ?, admission_date = ?,
        religion = ?, nationality = ?, state_of_origin = ?, lga_of_origin = ?, mother_tongue = ?,
        blood_group = ?, genotype = ?, allergies = ?, medical_conditions = ?, special_needs = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relationship = ?,
        previous_school = ?, last_class_passed = ?, reason_for_transfer = ?,
        guardian_title = ?, guardian_name = ?, guardian_relationship = ?, guardian_phone = ?,
        guardian_alt_phone = ?, guardian_email = ?, guardian_occupation = ?, guardian_office_address = ?,
        mother_name = ?, mother_phone = ?, mother_email = ?, mother_occupation = ?,
        boarding_status = ?, transport_mode = ?, bus_route = ?, passport_photo = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newFirstName,
      val(middle_name, existing.middle_name),
      newLastName,
      val(gender, existing.gender),
      val(dob, existing.dob),
      val(address, existing.address),
      newClassId,
      section_id !== undefined ? (section_id ? parseInt(section_id) : null) : existing.section_id,
      val(entry_mode, existing.entry_mode),
      val(enrolled_session, existing.enrolled_session),
      val(enrolled_term, existing.enrolled_term),
      val(admission_date, existing.admission_date),
      val(religion, existing.religion),
      val(nationality, existing.nationality),
      val(state_of_origin, existing.state_of_origin),
      val(lga_of_origin, existing.lga_of_origin),
      val(mother_tongue, existing.mother_tongue),
      val(blood_group, existing.blood_group),
      val(genotype, existing.genotype),
      val(allergies, existing.allergies),
      val(medical_conditions, existing.medical_conditions),
      val(special_needs, existing.special_needs),
      val(emergency_contact_name, existing.emergency_contact_name),
      val(emergency_contact_phone, existing.emergency_contact_phone),
      val(emergency_contact_relationship, existing.emergency_contact_relationship),
      val(previous_school, existing.previous_school),
      val(last_class_passed, existing.last_class_passed),
      val(reason_for_transfer, existing.reason_for_transfer),
      val(guardian_title, existing.guardian_title),
      val(guardian_name, existing.guardian_name),
      val(guardian_relationship, existing.guardian_relationship),
      val(guardian_phone, existing.guardian_phone),
      val(guardian_alt_phone, existing.guardian_alt_phone),
      val(guardian_email, existing.guardian_email),
      val(guardian_occupation, existing.guardian_occupation),
      val(guardian_office_address, existing.guardian_office_address),
      val(mother_name, existing.mother_name),
      val(mother_phone, existing.mother_phone),
      val(mother_email, existing.mother_email),
      val(mother_occupation, existing.mother_occupation),
      val(boarding_status, existing.boarding_status),
      val(transport_mode, existing.transport_mode),
      val(bus_route, existing.bus_route),
      val(passport_photo, existing.passport_photo),
      newIsActive,
      studentId
    );

    // Sync student full name in users table if changed
    if (newFirstName !== existing.first_name || newLastName !== existing.last_name) {
      db.prepare(`
        UPDATE users SET full_name = ? WHERE reference_id = ? AND role = 'student'
      `).run(`${newFirstName} ${newLastName}`, existing.admission_no);
    }

    // Sync active status in users table
    if (newIsActive !== existing.is_active) {
      db.prepare(`
        UPDATE users SET is_active = ? WHERE reference_id = ? AND role = 'student'
      `).run(newIsActive, existing.admission_no);
    }

    logAudit(req.user.id, 'UPDATE_STUDENT', 'STUDENTS', `Updated record for student ${existing.admission_no} (${newFirstName} ${newLastName})`, req.ip);

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      student: {
        id: studentId,
        admission_no: existing.admission_no,
        first_name: newFirstName,
        last_name: newLastName,
        class_id: newClassId,
        is_active: newIsActive
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students/:id/transfer
 * Quick class transfer with audit log (Admin / SuperAdmin)
 */
router.post('/:id/transfer', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const { target_class_id, reason } = req.body;

    if (!target_class_id) {
      return res.status(400).json({ success: false, message: 'Target class ID is required.' });
    }

    const student = db.prepare(`
      SELECT s.*, c.name as current_class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const targetClass = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(parseInt(target_class_id));
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Target class not found.' });
    }

    db.prepare('UPDATE students SET class_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(targetClass.id, studentId);

    logAudit(
      req.user.id,
      'TRANSFER_STUDENT',
      'STUDENTS',
      `Transferred student ${student.admission_no} from ${student.current_class_name || 'Unassigned'} to ${targetClass.name}. Reason: ${reason || 'Administrative transfer'}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Student successfully transferred to ${targetClass.name}.`,
      student_id: studentId,
      previous_class: student.current_class_name,
      new_class: targetClass.name
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/students/bulk-promote
 * Batch promote students to target class (SuperAdmin only)
 */
router.post('/bulk-promote', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const { student_ids, target_class_id, academic_session } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !target_class_id) {
      return res.status(400).json({
        success: false,
        message: 'student_ids (array) and target_class_id are required.'
      });
    }

    const targetClass = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(parseInt(target_class_id));
    if (!targetClass) {
      return res.status(404).json({ success: false, message: 'Target class not found.' });
    }

    const updateStmt = db.prepare('UPDATE students SET class_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    let promotedCount = 0;

    for (const sid of student_ids) {
      const res = updateStmt.run(targetClass.id, parseInt(sid));
      if (res.changes > 0) promotedCount++;
    }

    logAudit(
      req.user.id,
      'BULK_PROMOTE_STUDENTS',
      'STUDENTS',
      `Bulk promoted ${promotedCount} students to ${targetClass.name} for session ${academic_session || '2025/2026'}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Successfully promoted ${promotedCount} students to ${targetClass.name}.`,
      promoted_count: promotedCount,
      target_class: targetClass.name
    });
  } catch (err) {
    next(err);
  }
});

export default router;
