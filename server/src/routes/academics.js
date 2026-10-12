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
      SELECT 
        c.*, 
        COUNT(DISTINCT s.id) as student_count,
        COALESCE(st.name, fallback_st.name) as teacher_name,
        COALESCE(st.staff_no, fallback_st.staff_no) as teacher_staff_no,
        COALESCE(st.id, fallback_st.id) as teacher_id
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN staff st ON st.id = c.class_teacher_id
      LEFT JOIN staff fallback_st ON (fallback_st.assigned_class = c.name OR fallback_st.assigned_class LIKE '%' || c.name || '%') AND fallback_st.role LIKE '%Teacher%'
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

/**
 * PUT /api/academics/classes/:id/assign-teacher
 * Assign a teacher to a class (Admin & SuperAdmin)
 */
router.put('/classes/:id/assign-teacher', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { teacher_id } = req.body;
    const classId = req.params.id;

    const classRecord = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!classRecord) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (teacher_id) {
      const teacher = db.prepare('SELECT * FROM staff WHERE id = ?').get(teacher_id);
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found.' });
      }

      // Update class with teacher ID
      db.prepare('UPDATE classes SET class_teacher_id = ? WHERE id = ?').run(teacher_id, classId);

      // Also update teacher's assigned_class
      db.prepare('UPDATE staff SET assigned_class = ? WHERE id = ?').run(classRecord.name, teacher_id);

      return res.json({
        success: true,
        message: `Assigned ${teacher.name} as class teacher for ${classRecord.name}.`,
        class: {
          id: classRecord.id,
          name: classRecord.name,
          teacher_id: teacher.id,
          teacher_name: teacher.name
        }
      });
    } else {
      // Unassign teacher
      db.prepare('UPDATE classes SET class_teacher_id = NULL WHERE id = ?').run(classId);
      return res.json({
        success: true,
        message: `Unassigned teacher from ${classRecord.name}.`
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
