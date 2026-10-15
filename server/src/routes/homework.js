import express from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { evaluateHomeworkSubmission } from '../services/inHouseAi.js';

const router = express.Router();

/**
 * 1. GET /api/homework
 * List homework assignments with optional class_id or subject_id filters
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const { class_id, subject_id, status = 'Active' } = req.query;
    let conditions = [];
    const params = [];

    if (class_id) {
      conditions.push('h.class_id = ?');
      params.push(class_id);
    }
    if (subject_id) {
      conditions.push('h.subject_id = ?');
      params.push(subject_id);
    }
    if (status && status !== 'All') {
      conditions.push('h.status = ?');
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const assignments = db.prepare(`
      SELECT 
        h.*,
        c.name as class_name,
        s.name as subject_name,
        st.name as teacher_name,
        (SELECT COUNT(*) FROM homework_submissions sub WHERE sub.assignment_id = h.id) as submission_count,
        (SELECT COUNT(*) FROM students stu WHERE stu.class_id = h.class_id AND stu.is_active = 1) as total_students
      FROM homework_assignments h
      JOIN classes c ON h.class_id = c.id
      JOIN subjects s ON h.subject_id = s.id
      JOIN staff st ON h.teacher_id = st.id
      ${where}
      ORDER BY h.id DESC
    `).all(...params);

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. GET /api/homework/:id
 * Retrieve a specific assignment with scoped student submissions
 */
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const assignment = db.prepare(`
      SELECT 
        h.*,
        c.name as class_name,
        s.name as subject_name,
        st.name as teacher_name
      FROM homework_assignments h
      JOIN classes c ON h.class_id = c.id
      JOIN subjects s ON h.subject_id = s.id
      JOIN staff st ON h.teacher_id = st.id
      WHERE h.id = ?
    `).get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Determine submissions visibility based on role
    let submissionsWhere = 'WHERE sub.assignment_id = ?';
    const subParams = [req.params.id];

    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      submissionsWhere += ' AND sub.student_id = ?';
      subParams.push(student ? student.id : -1);
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
        submissionsWhere += ' AND 1 = 0';
      } else {
        submissionsWhere += ` AND sub.student_id IN (${childIds.map(() => '?').join(',')})`;
        subParams.push(...childIds);
      }
    }

    const submissions = db.prepare(`
      SELECT 
        sub.*,
        stu.first_name,
        stu.last_name,
        stu.admission_no
      FROM homework_submissions sub
      JOIN students stu ON sub.student_id = stu.id
      ${submissionsWhere}
      ORDER BY sub.id DESC
    `).all(...subParams);

    res.json({
      success: true,
      data: {
        ...assignment,
        submissions
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/homework
 * Teachers assign homework to a class
 */
const createHomeworkSchema = z.object({
  class_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
  teacher_id: z.number().int().positive().optional(),
  title: z.string().min(3).max(150),
  description: z.string().min(5),
  key_concepts: z.union([z.string(), z.array(z.string())]).optional(),
  max_points: z.number().positive().default(10),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD')
});

router.post('/', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const validated = createHomeworkSchema.parse(req.body);
    
    // Resolve teacher_id from session if omitted
    let teacherId = validated.teacher_id;
    if (!teacherId) {
      const staffRecord = db.prepare('SELECT id FROM staff WHERE email = ? OR phone = ? OR id = ?').get(
        req.user.email || '',
        req.user.phone || '',
        req.user.id || 0
      );
      const fallbackStaff = db.prepare('SELECT id FROM staff LIMIT 1').get();
      teacherId = staffRecord ? staffRecord.id : (fallbackStaff ? fallbackStaff.id : 1);
    }

    const assignmentCode = `HW-${Date.now().toString().slice(-6)}`;
    const conceptsString = Array.isArray(validated.key_concepts)
      ? JSON.stringify(validated.key_concepts)
      : (validated.key_concepts || '');

    const stmt = db.prepare(`
      INSERT INTO homework_assignments 
      (assignment_code, class_id, subject_id, teacher_id, title, description, key_concepts, max_points, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `);

    const result = stmt.run(
      assignmentCode,
      validated.class_id,
      validated.subject_id,
      teacherId,
      validated.title.trim(),
      validated.description.trim(),
      conceptsString,
      validated.max_points,
      validated.due_date
    );

    logAudit(
      req.user.id,
      'CREATE_HOMEWORK',
      'ACADEMICS',
      `Created homework assignment ${assignmentCode} (${validated.title}) for class ${validated.class_id}`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Homework assigned successfully!',
      assignment: {
        id: result.lastInsertRowid,
        assignment_code: assignmentCode,
        title: validated.title,
        due_date: validated.due_date
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. POST /api/homework/:id/submit
 * Parents or students submit completed homework (evaluated by in-house AI)
 */
const submitHomeworkSchema = z.object({
  student_id: z.number().int().positive(),
  submitted_by_phone: z.string().min(5),
  submission_channel: z.enum(['WhatsApp', 'Portal', 'Classroom']).default('Portal'),
  submission_text: z.string().min(2),
  attachment_path: z.string().optional()
});

router.post('/:id/submit', authenticate, (req, res, next) => {
  try {
    const assignment = db.prepare(`
      SELECT h.*, c.name as class_name, s.name as subject_name 
      FROM homework_assignments h
      JOIN classes c ON h.class_id = c.id
      JOIN subjects s ON h.subject_id = s.id
      WHERE h.id = ?
    `).get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Homework assignment not found.' });
    }

    const validated = submitHomeworkSchema.parse(req.body);
    const student = db.prepare('SELECT id, first_name, last_name, admission_no FROM students WHERE id = ?').get(validated.student_id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Student can only submit for themselves
    if (req.user.role === 'student') {
      const selfStudent = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!selfStudent || selfStudent.id !== student.id) {
        return res.status(403).json({ success: false, message: 'Students can only submit their own homework.' });
      }
    }

    // In-House AI Evaluation
    const aiResult = evaluateHomeworkSubmission({
      assignment,
      submissionText: validated.submission_text,
      studentName: `${student.first_name} ${student.last_name}`
    });

    const submissionCode = `SUB-${Date.now().toString().slice(-6)}`;

    const stmt = db.prepare(`
      INSERT INTO homework_submissions
      (submission_code, assignment_id, student_id, submitted_by_phone, submission_channel, submission_text, attachment_path, ai_evaluated, ai_score, ai_feedback, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'AI_Reviewed')
    `);

    const result = stmt.run(
      submissionCode,
      assignment.id,
      student.id,
      validated.submitted_by_phone.trim(),
      validated.submission_channel,
      validated.submission_text.trim(),
      validated.attachment_path || null,
      aiResult.score,
      aiResult.feedback
    );

    res.status(201).json({
      success: true,
      message: 'Homework submitted and analyzed by In-House AI!',
      submission: {
        id: result.lastInsertRowid,
        submission_code: submissionCode,
        ai_score: aiResult.score,
        max_points: assignment.max_points,
        ai_feedback: aiResult.feedback,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. PATCH /api/homework/submissions/:id/grade
 * Teachers review, confirm, or adjust score and feedback
 */
router.patch('/submissions/:id/grade', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { teacher_score, teacher_feedback } = req.body;
    if (teacher_score === undefined || teacher_score === null) {
      return res.status(400).json({ success: false, message: 'teacher_score is required.' });
    }

    const stmt = db.prepare(`
      UPDATE homework_submissions
      SET teacher_score = ?, teacher_feedback = ?, status = 'Teacher_Approved'
      WHERE id = ?
    `);

    stmt.run(Number(teacher_score), teacher_feedback ? teacher_feedback.trim() : null, req.params.id);

    res.json({
      success: true,
      message: 'Teacher evaluation recorded and approved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
