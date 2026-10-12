import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/academics/classes
 * List classes with student counts
 */
router.get('/classes', (req, res, next) => {
  try {
    const classes = db.prepare(`
      SELECT c.*, COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    res.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academics/sections
 */
router.get('/sections', (req, res, next) => {
  try {
    const sections = db.prepare('SELECT * FROM sections ORDER BY id ASC').all();
    res.json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/academics/subjects
 */
router.get('/subjects', (req, res, next) => {
  try {
    const { division } = req.query;
    let query = 'SELECT * FROM subjects';
    const params = [];

    if (division) {
      query += ' WHERE division = ? OR division = "All"';
      params.push(division);
    }
    query += ' ORDER BY name ASC';

    const subjects = db.prepare(query).all(...params);
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academics/classes
 * Add new class (Admin only)
 */
router.post('/classes', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { name, division, termly_tuition } = req.body;
    if (!name || !division) {
      return res.status(400).json({ success: false, message: 'Class name and division are required.' });
    }

    const stmt = db.prepare('INSERT INTO classes (name, division, termly_tuition) VALUES (?, ?, ?)');
    const result = stmt.run(name, division, termly_tuition || 40000);

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      class_id: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
});

export default router;
