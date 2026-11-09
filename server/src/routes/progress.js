import { requireTeacherClassAccess } from '../middleware/academicAccess.js';
import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles, requireStudentAccess } from '../middleware/auth.js';
import { 
  analyzeStudentProgress, 
  generateParentRecommendations,
  askSchoolAi,
  generateAiReportComments
} from '../services/inHouseAi.js';
import { askPuterOrInHouseAi } from '../services/puterAi.js';

const router = express.Router();

/**
 * 0. GET /api/progress/ai-status
 * Status of AI engines: Puter AI (Primary) and In-House AI (Secondary/Fallback)
 */
router.get('/ai-status', (req, res) => {
  res.json({
    success: true,
    engines: {
      primary: {
        name: 'Puter AI',
        provider: 'OpenAI API Gateway (developer.puter.com)',
        tier: 'Free Unlimited Tier',
        default_model: process.env.PUTER_AI_MODEL || 'gpt-4o-mini',
        available_models: [
          'gpt-4o-mini',
          'gpt-4o',
          'gpt-5.4-nano',
          'gpt-6.1-sol',
          'gpt-6-luna',
          'gpt-6-astra'
        ],
        status: 'active'
      },
      secondary: {
        name: 'EaglePower In-House AI',
        provider: 'Autonomous On-Premise Deterministic NLP Kernel',
        subjects_covered: 27,
        status: 'active'
      }
    },
    routing_strategy: 'Puter AI (Primary) -> In-House AI (Automatic Resilient Fallback)'
  });
});

/**
 * 1. GET /api/progress/student/:id
 * Full academic trajectory, learning gap radar, and attendance correlations (Authenticated)
 */
router.get('/student/:id', authenticate, requireRoles('teacher', 'admin', 'superadmin', 'parent', 'student'), requireStudentAccess('id', 'id'), (req, res, next) => {
  try {
    const targetStudentId = parseInt(req.params.id);

    // Ownership check for student and parent
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student || student.id !== targetStudentId) {
        return res.status(403).json({ success: false, message: 'Access denied: You may only view your own progress.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase() || '___no_guardian_email___';
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const child = db.prepare(`
        SELECT id FROM students 
        WHERE id = ? AND (
          (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
          OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
          OR UPPER(admission_no) = ?
        )
      `).get(targetStudentId, `%${last10}%`, cleanEmail, cleanRef);

      if (!child) {
        return res.status(403).json({ success: false, message: 'Access denied: Not your registered ward.' });
      }
    }

    const analysis = analyzeStudentProgress(targetStudentId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. GET /api/progress/student/:id/recommendations
 * Personalized, pedagogical parent coaching recommendations (Authenticated)
 */
router.get('/student/:id/recommendations', authenticate, requireRoles('teacher', 'admin', 'superadmin', 'parent', 'student'), requireStudentAccess('id', 'id'), (req, res, next) => {
  try {
    const targetStudentId = parseInt(req.params.id);

    // Ownership check for student and parent
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student || student.id !== targetStudentId) {
        return res.status(403).json({ success: false, message: 'Access denied: You may only view your own recommendations.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase() || '___no_guardian_email___';
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const child = db.prepare(`
        SELECT id FROM students 
        WHERE id = ? AND (
          (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
          OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
          OR UPPER(admission_no) = ?
        )
      `).get(targetStudentId, `%${last10}%`, cleanEmail, cleanRef);

      if (!child) {
        return res.status(403).json({ success: false, message: 'Access denied: Not your registered ward.' });
      }
    }

    // Generate or fetch fresh in-house AI recommendations
    const recommendations = generateParentRecommendations(targetStudentId);

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. GET /api/progress/class/:classId/summary
 * Class-wide performance insights, learning gaps, and high-risk flags for teachers/admin
 */
router.get('/class/:classId/summary', authenticate, requireRoles('teacher', 'admin', 'superadmin'), requireTeacherClassAccess, (req, res, next) => {
  try {
    const students = db.prepare(`
      SELECT id, admission_no, first_name, last_name 
      FROM students 
      WHERE class_id = ? AND is_active = 1
    `).all(req.params.classId);

    if (students.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const summaries = students.map(s => {
      const p = analyzeStudentProgress(s.id);
      return {
        student_id: s.id,
        admission_no: s.admission_no,
        name: `${s.first_name} ${s.last_name}`,
        term_average: p?.metrics?.term_average || 0,
        readiness_tier: p?.metrics?.readiness_tier || 'N/A',
        critical_count: p?.critical_subjects?.length || 0,
        critical_subjects: p?.critical_subjects?.map(c => c.subject) || []
      };
    });

    // Sort by most in need of support
    summaries.sort((a, b) => b.critical_count - a.critical_count || a.term_average - b.term_average);

    res.json({
      success: true,
      class_id: req.params.classId,
      student_count: summaries.length,
      data: summaries
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. POST /api/progress/ask-ai
 * Puter AI (Primary) with In-House AI Fallback Academic Tutor & Universal School Inquiry Engine (Authenticated)
 */
router.post('/ask-ai', authenticate, async (req, res, next) => {
  try {
    const { question, student_id, model } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question prompt is required.'
      });
    }

    const aiResponse = await askPuterOrInHouseAi(question.trim(), { 
      user: req.user, 
      studentId: student_id,
      model: model || process.env.PUTER_AI_MODEL || 'gpt-4o-mini'
    });

    res.json({
      success: true,
      data: aiResponse
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. POST /api/progress/report-comments
 * Autonomous AI Report Card Comment Synthesis (Teacher/Admin/Superadmin)
 */
router.post('/report-comments', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { student_id, student: rawStudent, average, attendance, traits, psychomotor, position, class_size } = req.body;

    let student = rawStudent;
    if (!student && student_id) {
      student = db.prepare('SELECT id, first_name, last_name, admission_no, division FROM students WHERE id = ?').get(parseInt(student_id));
    }

    const comments = generateAiReportComments({
      student: student || { first_name: 'The student' },
      average,
      attendance,
      traits,
      psychomotor,
      position,
      classSize: class_size
    });

    res.json({
      success: true,
      data: comments
    });
  } catch (err) {
    next(err);
  }
});

export default router;
