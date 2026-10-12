import express from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

const admissionSchema = z.object({
  student_name: z.string().min(3, 'Full student name is required'),
  gender: z.enum(['Male', 'Female']),
  dob: z.string().optional(),
  applying_class: z.string().min(1, 'Target class is required'),
  parent_name: z.string().min(3, 'Parent/Guardian name is required'),
  parent_phone: z.string().min(10, 'Valid phone number is required'),
  parent_email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  previous_school: z.string().optional()
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
    const applicationNo = `ADM-2025-${Math.floor(1000 + Math.random() * 9000)}`;

    const stmt = db.prepare(`
      INSERT INTO admissions (
        application_no, student_name, gender, dob, applying_class,
        parent_name, parent_phone, parent_email, address, previous_school, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Under Review')
    `);

    stmt.run(
      applicationNo,
      data.student_name,
      data.gender,
      data.dob || null,
      data.applying_class,
      data.parent_name,
      data.parent_phone,
      data.parent_email || null,
      data.address || 'Awka, Anambra State',
      data.previous_school || null
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
              admission_no, first_name, last_name, gender, dob, 
              class_id, guardian_name, guardian_phone, guardian_email, address, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `);

          const sRes = insStudent.run(
            newAdmNo,
            firstName,
            lastName,
            app.gender,
            app.dob || null,
            targetClass ? targetClass.id : null,
            app.parent_name,
            app.parent_phone,
            app.parent_email || null,
            app.address || 'Awka, Anambra State'
          );

          enrolledStudent = {
            id: sRes.lastInsertRowid,
            admission_no: newAdmNo,
            name: `${firstName} ${lastName}`,
            class_name: targetClass?.name || 'Class Assigned'
          };

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
