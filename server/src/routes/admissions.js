import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

const admissionSchema = z.object({
  student_name: z.string().min(3, 'Full student name is required'),
  middle_name: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  dob: z.string().optional(),
  applying_class: z.string().min(1, 'Target class is required'),
  entry_mode: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  state_of_origin: z.string().optional(),
  lga_of_origin: z.string().optional(),
  blood_group: z.string().optional(),
  genotype: z.string().optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  special_needs: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  previous_school: z.string().optional(),
  last_class_passed: z.string().optional(),
  guardian_title: z.string().optional(),
  parent_name: z.string().min(3, 'Parent/Guardian name is required'),
  guardian_relationship: z.string().optional(),
  parent_phone: z.string().min(10, 'Valid phone number is required'),
  guardian_alt_phone: z.string().optional(),
  parent_email: z.string().email().optional().or(z.literal('')),
  guardian_occupation: z.string().optional(),
  guardian_office_address: z.string().optional(),
  address: z.string().optional(),
  mother_name: z.string().optional(),
  mother_phone: z.string().optional(),
  mother_email: z.string().optional(),
  mother_occupation: z.string().optional(),
  boarding_status: z.string().optional(),
  transport_mode: z.string().optional(),
  bus_route: z.string().optional()
});

/**
 * POST /api/admissions/apply
 * Public Online Admission Application Intake
 */
router.post('/apply', (req, res, next) => {
  try {
    const parseResult = admissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const data = parseResult.data;
    const applicationNo = `ADM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const stmt = db.prepare(`
      INSERT INTO admissions (
        application_no, student_name, middle_name, gender, dob, applying_class, entry_mode,
        religion, nationality, state_of_origin, lga_of_origin,
        blood_group, genotype, allergies, medical_conditions, special_needs,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        previous_school, last_class_passed,
        guardian_title, parent_name, guardian_relationship, parent_phone, guardian_alt_phone,
        parent_email, guardian_occupation, guardian_office_address, address,
        mother_name, mother_phone, mother_email, mother_occupation,
        boarding_status, transport_mode, bus_route, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, 'Under Review'
      )
    `);

    stmt.run(
      applicationNo,
      data.student_name,
      data.middle_name || null,
      data.gender,
      data.dob || null,
      data.applying_class,
      data.entry_mode || 'Fresh Admission',
      data.religion || 'Christianity',
      data.nationality || 'Nigerian',
      data.state_of_origin || 'Anambra State',
      data.lga_of_origin || 'Awka South',
      data.blood_group || null,
      data.genotype || null,
      data.allergies || 'None Reported',
      data.medical_conditions || 'None Reported',
      data.special_needs || 'None',
      data.emergency_contact_name || data.parent_name,
      data.emergency_contact_phone || data.parent_phone,
      data.emergency_contact_relationship || 'Parent/Guardian',
      data.previous_school || null,
      data.last_class_passed || null,
      data.guardian_title || 'Mr/Mrs',
      data.parent_name,
      data.guardian_relationship || 'Father',
      data.parent_phone,
      data.guardian_alt_phone || null,
      data.parent_email || null,
      data.guardian_occupation || null,
      data.guardian_office_address || null,
      data.address || 'Awka, Anambra State',
      data.mother_name || null,
      data.mother_phone || null,
      data.mother_email || null,
      data.mother_occupation || null,
      data.boarding_status || 'Day Student',
      data.transport_mode || 'Private Pick-up',
      data.bus_route || null
    );

    logAudit(null, 'NEW_ADMISSION_APPLICATION', 'ADMISSIONS', `New application submitted: ${applicationNo} for ${data.student_name}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Admission application received successfully.',
      application: {
        application_no: applicationNo,
        student_name: data.student_name,
        applying_class: data.applying_class,
        status: 'Under Review',
        instructions: 'Please bring your child for entrance screening at Eagle Power Schools, Amikwo Road, Awka on Saturdays by 9:00 AM.'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admissions/:appNo
 * Public Status Check for applicant
 */
router.get('/:appNo', (req, res, next) => {
  try {
    const app = db.prepare(`
      SELECT application_no, student_name, gender, applying_class, status, submitted_at
      FROM admissions
      WHERE UPPER(application_no) = ?
    `).get(req.params.appNo.trim().toUpperCase());

    if (!app) {
      return res.status(404).json({
        success: false,
        message: `No application found with ID: ${req.params.appNo}`
      });
    }

    res.json({
      success: true,
      data: app
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admissions
 * Admin View all applicants
 */
router.get('/', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { status, class_name } = req.query;
    let conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (class_name) {
      conditions.push('applying_class = ?');
      params.push(class_name);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const applications = db.prepare(`SELECT * FROM admissions ${whereClause} ORDER BY id DESC`).all(...params);

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admissions/:id/status
 * Update applicant admission status (Admin only)
 */
router.patch('/:id/status', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Under Review', 'Screening Scheduled', 'Admitted', 'Declined'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const stmt = db.prepare('UPDATE admissions SET status = ? WHERE id = ?');
    stmt.run(status, req.params.id);

    let enrolledStudent = null;
    let generatedInvoice = null;

    // Automated Enrollment Workflow: When an applicant is Admitted, register as student & create tuition invoice
    if (status === 'Admitted') {
      const app = db.prepare('SELECT * FROM admissions WHERE id = ?').get(req.params.id);
      if (app) {
        // Check if student is already enrolled
        const existing = db.prepare(`
          SELECT id, admission_no FROM students 
          WHERE guardian_phone = ? AND (first_name || ' ' || last_name = ?)
        `).get(app.parent_phone, app.student_name);

        if (!existing) {
          // Resolve matching target class
          const targetClass = db.prepare(`
            SELECT id, name, termly_tuition FROM classes 
            WHERE name LIKE ? OR name = ? 
            LIMIT 1
          `).get(`%${app.applying_class}%`, app.applying_class) 
          || db.prepare('SELECT id, name, termly_tuition FROM classes LIMIT 1').get();

          const nameParts = app.student_name.trim().split(' ');
          const firstName = nameParts[0] || 'Pupil';
          const lastName = nameParts.slice(1).join(' ') || 'Student';
          const newAdmNo = `EPS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

          const insStudent = db.prepare(`
            INSERT INTO students (
              admission_no, first_name, middle_name, last_name, gender, dob, 
              class_id, entry_mode, enrolled_session, enrolled_term, admission_date,
              religion, nationality, state_of_origin, lga_of_origin,
              blood_group, genotype, allergies, medical_conditions, special_needs,
              emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
              previous_school, last_class_passed,
              guardian_title, guardian_name, guardian_relationship, guardian_phone, guardian_alt_phone,
              guardian_email, guardian_occupation, guardian_office_address, address,
              mother_name, mother_phone, mother_email, mother_occupation,
              boarding_status, transport_mode, bus_route, is_active
            ) VALUES (
              ?, ?, ?, ?, ?, ?,
              ?, ?, '2024/2025', 'Second Term', ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, 1
            )
          `);

          const sRes = insStudent.run(
            newAdmNo,
            firstName,
            app.middle_name || null,
            lastName,
            app.gender,
            app.dob || null,
            targetClass ? targetClass.id : null,
            app.entry_mode || 'Fresh Admission',
            new Date().toISOString().split('T')[0],
            app.religion || 'Christianity',
            app.nationality || 'Nigerian',
            app.state_of_origin || 'Anambra State',
            app.lga_of_origin || 'Awka South',
            app.blood_group || null,
            app.genotype || null,
            app.allergies || 'None Reported',
            app.medical_conditions || 'None Reported',
            app.special_needs || 'None',
            app.emergency_contact_name || app.parent_name,
            app.emergency_contact_phone || app.parent_phone,
            app.emergency_contact_relationship || 'Parent/Guardian',
            app.previous_school || null,
            app.last_class_passed || null,
            app.guardian_title || 'Mr/Mrs',
            app.parent_name,
            app.guardian_relationship || 'Father',
            app.parent_phone,
            app.guardian_alt_phone || null,
            app.parent_email || null,
            app.guardian_occupation || null,
            app.guardian_office_address || null,
            app.address || 'Awka, Anambra State',
            app.mother_name || null,
            app.mother_phone || null,
            app.mother_email || null,
            app.mother_occupation || null,
            app.boarding_status || 'Day Student',
            app.transport_mode || 'Private Pick-up',
            app.bus_route || null
          );

          enrolledStudent = {
            id: sRes.lastInsertRowid,
            admission_no: newAdmNo,
            name: `${firstName} ${lastName}`,
            class_name: targetClass?.name || 'Class Assigned'
          };

          // Auto-provision Student Portal Account
          const salt = bcrypt.genSaltSync(10);
          const studentPassHash = bcrypt.hashSync('Eagle2025!', salt);
          db.prepare('DELETE FROM users WHERE username = ?').run(newAdmNo);
          db.prepare(`
            INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
            VALUES (?, ?, ?, 'student', ?, ?, 1)
          `).run(newAdmNo, null, studentPassHash, newAdmNo, `${firstName} ${lastName}`);

          // Auto-provision Parent Portal Account
          const cleanParentPhone = app.parent_phone ? app.parent_phone.replace(/\D/g, '') : null;
          const parentUsername = cleanParentPhone && cleanParentPhone.length >= 7
            ? cleanParentPhone
            : (app.parent_email ? app.parent_email.trim().toLowerCase() : `parent_${newAdmNo.toLowerCase()}`);
          const parentPassHash = bcrypt.hashSync('EagleParent2025!', salt);

          const existingParent = db.prepare('SELECT id, username FROM users WHERE username = ?').get(parentUsername);
          if (!existingParent) {
            db.prepare(`
              INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
              VALUES (?, ?, ?, 'parent', ?, ?, 1)
            `).run(
              parentUsername,
              app.parent_email ? app.parent_email.trim().toLowerCase() : null,
              parentPassHash,
              newAdmNo,
              app.parent_name ? app.parent_name.trim() : `Guardian of ${firstName}`
            );
          }

          // Generate initial tuition invoice
          if (targetClass && sRes.lastInsertRowid) {
            const tuitionAmt = targetClass.termly_tuition || 35000;
            const invNo = `INV-${Date.now().toString().slice(-6)}`;
            db.prepare(`
              INSERT INTO invoices (
                invoice_no, student_id, session, term, title, amount_due, amount_paid, status
              ) VALUES (?, ?, '2024/2025', 'Second Term', 'First Termly Tuition & Admission Registration', ?, 0, 'Unpaid')
            `).run(invNo, sRes.lastInsertRowid, tuitionAmt);

            generatedInvoice = {
              invoice_no: invNo,
              amount: tuitionAmt
            };
          }
        }
      }
    }

    logAudit(req.user.id, 'UPDATE_ADMISSION_STATUS', 'ADMISSIONS', `Updated admission ID ${req.params.id} to ${status}${enrolledStudent ? ` & auto-enrolled as ${enrolledStudent.admission_no}` : ''}`, req.ip);

    res.json({
      success: true,
      message: `Application status updated to ${status}.${enrolledStudent ? ` Student officially enrolled as ${enrolledStudent.admission_no} with invoice generated.` : ''}`,
      enrolled_student: enrolledStudent,
      invoice: generatedInvoice
    });
  } catch (err) {
    next(err);
  }
});

export default router;
