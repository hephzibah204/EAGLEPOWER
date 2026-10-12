import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { 
  analyzeStudentProgress, 
  generateParentRecommendations 
} from '../services/inHouseAi.js';

const router = express.Router();

/**
 * 1. GET /api/progress/student/:id
 * Full academic trajectory, learning gap radar, and attendance correlations
 */
router.get('/student/:id', (req, res, next) => {
  try {
    const analysis = analyzeStudentProgress(req.params.id);
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
 * Personalized, pedagogical parent coaching recommendations
 */
router.get('/student/:id/recommendations', (req, res, next) => {
  try {
    // Generate or fetch fresh in-house AI recommendations
    const recommendations = generateParentRecommendations(req.params.id);

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
router.get('/class/:classId/summary', (req, res, next) => {
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

export default router;
