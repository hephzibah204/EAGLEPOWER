import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/academics/classes
 * List classes with student counts (Authenticated)
 */
router.get('/classes', authenticate, (req, res, next) => {
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
router.get('/sections', authenticate, (req, res, next) => {
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
router.get('/subjects', authenticate, (req, res, next) => {
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

/**
 * PUT /api/academics/classes/:id
 * Update class details (Admin & SuperAdmin)
 */
router.put('/classes/:id', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const classId = req.params.id;
    const { name, division, termly_tuition, class_teacher_id } = req.body;

    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (!name || !division) {
      return res.status(400).json({ success: false, message: 'Class name and division are required.' });
    }

    db.prepare(`
      UPDATE classes 
      SET name = ?, division = ?, termly_tuition = ?, class_teacher_id = ?
      WHERE id = ?
    `).run(
      name,
      division,
      Number(termly_tuition) || existing.termly_tuition,
      class_teacher_id !== undefined ? class_teacher_id : existing.class_teacher_id,
      classId
    );

    logAudit(
      req.user.id,
      'UPDATE_CLASS',
      'ACADEMICS',
      `Updated class ${existing.name} -> ${name} (Tuition: ₦${termly_tuition || existing.termly_tuition})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Class '${name}' updated successfully.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/academics/subjects
 * Create a new subject (Admin & SuperAdmin)
 */
router.post('/subjects', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const { name, code, division = 'All', category = 'Core' } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Subject name and code are required.' });
    }

    const existing = db.prepare('SELECT id FROM subjects WHERE code = ?').get(code.toUpperCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: `Subject code '${code}' is already registered.` });
    }

    const stmt = db.prepare('INSERT INTO subjects (name, code, division, category) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name.trim(), code.toUpperCase().trim(), division, category);

    logAudit(
      req.user.id,
      'CREATE_SUBJECT',
      'ACADEMICS',
      `Created subject: ${name.trim()} (${code.toUpperCase().trim()})`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: `Subject '${name}' created successfully.`,
      subject_id: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/academics/subjects/:id
 * Update subject details (Admin & SuperAdmin)
 */
router.put('/subjects/:id', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const subjectId = req.params.id;
    const { name, code, division, category } = req.body;

    const existing = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Subject name and code are required.' });
    }

    // Check code collision if code changed
    if (code.toUpperCase().trim() !== existing.code) {
      const codeCheck = db.prepare('SELECT id FROM subjects WHERE code = ? AND id != ?').get(code.toUpperCase().trim(), subjectId);
      if (codeCheck) {
        return res.status(409).json({ success: false, message: `Subject code '${code}' already exists.` });
      }
    }

    db.prepare(`
      UPDATE subjects
      SET name = ?, code = ?, division = ?, category = ?
      WHERE id = ?
    `).run(
      name.trim(),
      code.toUpperCase().trim(),
      division || existing.division,
      category || existing.category,
      subjectId
    );

    logAudit(
      req.user.id,
      'UPDATE_SUBJECT',
      'ACADEMICS',
      `Updated subject ${existing.name} (${existing.code}) -> ${name.trim()} (${code.toUpperCase().trim()})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Subject '${name}' updated successfully.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/academics/subjects/:id
 * Delete a subject if no recorded exam scores or homework exist (Admin & SuperAdmin)
 */
router.delete('/subjects/:id', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const subjectId = req.params.id;
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // Check exam marks referencing subject
    const scoreCheck = db.prepare('SELECT COUNT(*) as count FROM marks WHERE subject_id = ?').get(subjectId);
    if (scoreCheck?.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject '${subject.name}' because ${scoreCheck.count} exam scores reference it. Consider editing instead.`
      });
    }

    db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);

    logAudit(
      req.user.id,
      'DELETE_SUBJECT',
      'ACADEMICS',
      `Deleted subject: ${subject.name} (${subject.code})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Subject '${subject.name}' deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
