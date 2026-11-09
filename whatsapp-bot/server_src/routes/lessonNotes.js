import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * Helper to check if a user is an HOD, Principal, or Administrator
 */
function isUserReviewer(user) {
  if (['superadmin', 'admin'].includes(user.role)) return true;
  if (user.role === 'teacher' && user.reference_id) {
    const staff = db.prepare('SELECT role FROM staff WHERE UPPER(staff_no) = ?').get(user.reference_id.toUpperCase());
    if (staff && /HOD|Head of Department|Principal|Vice Principal/i.test(staff.role)) {
      return true;
    }
  }
  return false;
}

/**
 * GET /api/lesson-notes
 * List curriculum lesson notes with filtering and role scoping
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const { class_id, subject_id, teacher_id, status, term, session, week_number, limit = 50 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    const conditions = [];
    const params = [];

    // Role-based visibility scoping
    if (req.user.role === 'teacher') {
      const isReviewer = isUserReviewer(req.user);
      if (!isReviewer) {
        // Regular teachers see their own notes OR approved notes
        conditions.push('(ln.teacher_id = ? OR ln.teacher_name = ? OR ln.status = "Approved")');
        params.push(req.user.id, req.user.full_name || req.user.username);
      }
    } else if (!['admin', 'superadmin', 'bursar'].includes(req.user.role)) {
      // Students/parents can only see Approved lesson notes if granted access
      conditions.push('ln.status = "Approved"');
    }

    if (class_id) {
      conditions.push('ln.class_id = ?');
      params.push(parseInt(class_id));
    }
    if (subject_id) {
      conditions.push('ln.subject_id = ?');
      params.push(parseInt(subject_id));
    }
    if (teacher_id) {
      conditions.push('ln.teacher_id = ?');
      params.push(parseInt(teacher_id));
    }
    if (status) {
      conditions.push('ln.status = ?');
      params.push(status);
    }
    if (term) {
      conditions.push('ln.term = ?');
      params.push(term);
    }
    if (session) {
      conditions.push('ln.session = ?');
      params.push(session);
    }
    if (week_number) {
      conditions.push('ln.week_number = ?');
      params.push(week_number);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const notes = db.prepare(`
      SELECT 
        ln.*,
        c.name as class_name,
        sub.name as subject_name,
        sub.code as subject_code
      FROM lesson_notes ln
      LEFT JOIN classes c ON ln.class_id = c.id
      LEFT JOIN subjects sub ON ln.subject_id = sub.id
      ${whereClause}
      ORDER BY ln.id DESC
      LIMIT ?
    `).all(...params, safeLimit);

    res.json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/lesson-notes/:id
 * Retrieve single lesson note details
 */
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const note = db.prepare(`
      SELECT 
        ln.*,
        c.name as class_name,
        sub.name as subject_name,
        sub.code as subject_code
      FROM lesson_notes ln
      LEFT JOIN classes c ON ln.class_id = c.id
      LEFT JOIN subjects sub ON ln.subject_id = sub.id
      WHERE ln.id = ?
    `).get(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Lesson note not found.' });
    }

    // Role-based visibility check
    const isPrivileged = ['superadmin', 'admin', 'bursar'].includes(req.user.role);
    const isAuthor = note.teacher_id === req.user.id || note.teacher_name === (req.user.full_name || req.user.username);
    const isReviewer = isUserReviewer(req.user);

    if (!isPrivileged && !isAuthor && !isReviewer && note.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message: 'Access Restricted: Unapproved lesson notes are private drafts visible only to the author and faculty reviewers.'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/lesson-notes
 * Create a new lesson note / scheme of work entry
 */
router.post('/', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const {
      class_id,
      subject_id,
      session = '2026/2027',
      term = 'Second Term',
      week_number,
      topic,
      subtopic,
      behavioral_objectives,
      instructional_materials,
      previous_knowledge,
      introduction,
      presentation_steps,
      evaluation,
      conclusion,
      assignment,
      status = 'Under Review'
    } = req.body;

    if (!class_id || !subject_id || !week_number || !topic) {
      return res.status(400).json({
        success: false,
        message: 'class_id, subject_id, week_number, and topic are required.'
      });
    }

    const teacherName = req.user.full_name || req.user.username;
    const initialStatus = ['Draft', 'Under Review'].includes(status) ? status : 'Under Review';

    // Safely resolve staff.id from reference_id or user.id
    let staffId = null;
    if (req.user.reference_id) {
      const staffMember = db.prepare('SELECT id FROM staff WHERE UPPER(staff_no) = ?').get(req.user.reference_id.toUpperCase());
      if (staffMember) staffId = staffMember.id;
    }
    if (!staffId) {
      const staffMember = db.prepare('SELECT id FROM staff WHERE id = ?').get(req.user.id);
      if (staffMember) staffId = staffMember.id;
    }

    const stmt = db.prepare(`
      INSERT INTO lesson_notes (
        teacher_id, teacher_name, class_id, subject_id, session, term,
        week_number, topic, subtopic, behavioral_objectives,
        instructional_materials, previous_knowledge, introduction,
        presentation_steps, evaluation, conclusion, assignment, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      staffId,
      teacherName,
      parseInt(class_id),
      parseInt(subject_id),
      session,
      term,
      week_number.toString(),
      topic,
      subtopic || null,
      behavioral_objectives || null,
      instructional_materials || null,
      previous_knowledge || null,
      introduction || null,
      presentation_steps || null,
      evaluation || null,
      conclusion || null,
      assignment || null,
      initialStatus
    );

    logAudit(req.user.id, 'CREATE_LESSON_NOTE', 'ACADEMICS', `Created lesson note for Week ${week_number}: '${topic}' (${initialStatus})`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Lesson note created successfully.',
      data: {
        id: result.lastInsertRowid,
        topic,
        week_number,
        status: initialStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/lesson-notes/:id
 * Edit existing lesson note
 */
router.put('/:id', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const noteId = req.params.id;
    const existing = db.prepare('SELECT * FROM lesson_notes WHERE id = ?').get(noteId);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lesson note not found.' });
    }

    // Teachers can only edit their own note if not approved (or if setting to Under Review)
    if (req.user.role === 'teacher' && !isUserReviewer(req.user)) {
      if (existing.teacher_id !== req.user.id && existing.teacher_name !== (req.user.full_name || req.user.username)) {
        return res.status(403).json({ success: false, message: 'You can only edit your own lesson notes.' });
      }
      if (existing.status === 'Approved') {
        return res.status(403).json({ success: false, message: 'Approved lesson notes cannot be modified without HOD reset.' });
      }
    }

    const {
      class_id = existing.class_id,
      subject_id = existing.subject_id,
      session = existing.session,
      term = existing.term,
      week_number = existing.week_number,
      topic = existing.topic,
      subtopic = existing.subtopic,
      behavioral_objectives = existing.behavioral_objectives,
      instructional_materials = existing.instructional_materials,
      previous_knowledge = existing.previous_knowledge,
      introduction = existing.introduction,
      presentation_steps = existing.presentation_steps,
      evaluation = existing.evaluation,
      conclusion = existing.conclusion,
      assignment = existing.assignment,
      status = existing.status
    } = req.body;

    // Resubmission moves status to 'Under Review'
    const newStatus = status === 'Resubmit' ? 'Under Review' : status;

    db.prepare(`
      UPDATE lesson_notes
      SET
        class_id = ?,
        subject_id = ?,
        session = ?,
        term = ?,
        week_number = ?,
        topic = ?,
        subtopic = ?,
        behavioral_objectives = ?,
        instructional_materials = ?,
        previous_knowledge = ?,
        introduction = ?,
        presentation_steps = ?,
        evaluation = ?,
        conclusion = ?,
        assignment = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      parseInt(class_id),
      parseInt(subject_id),
      session,
      term,
      week_number.toString(),
      topic,
      subtopic || null,
      behavioral_objectives || null,
      instructional_materials || null,
      previous_knowledge || null,
      introduction || null,
      presentation_steps || null,
      evaluation || null,
      conclusion || null,
      assignment || null,
      newStatus,
      noteId
    );

    logAudit(req.user.id, 'UPDATE_LESSON_NOTE', 'ACADEMICS', `Updated lesson note #${noteId} (${topic})`, req.ip);

    res.json({
      success: true,
      message: 'Lesson note updated successfully.',
      data: { id: noteId, topic, status: newStatus }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/lesson-notes/:id/review
 * HOD / Principal Pedagogical Review & Feedback Workflow
 */
router.patch('/:id/review', authenticate, (req, res, next) => {
  try {
    const isReviewer = isUserReviewer(req.user);
    if (!isReviewer) {
      return res.status(403).json({
        success: false,
        message: 'Only Head of Department (HOD), Principal, or Administrators can review lesson notes.'
      });
    }

    const noteId = req.params.id;
    const note = db.prepare('SELECT * FROM lesson_notes WHERE id = ?').get(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Lesson note not found.' });
    }

    const { status, hod_feedback } = req.body;

    if (!['Approved', 'Needs Revision', 'Under Review'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Approved', 'Needs Revision', or 'Under Review'."
      });
    }

    if (status === 'Needs Revision' && (!hod_feedback || !hod_feedback.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Pedagogical feedback is required when requesting revisions.'
      });
    }

    const reviewerName = req.user.full_name || req.user.username;

    db.prepare(`
      UPDATE lesson_notes
      SET
        status = ?,
        hod_feedback = ?,
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, hod_feedback || note.hod_feedback, reviewerName, noteId);

    logAudit(req.user.id, 'REVIEW_LESSON_NOTE', 'ACADEMICS', `HOD review for lesson note #${noteId}: marked '${status}' by ${reviewerName}`, req.ip);

    const updated = db.prepare('SELECT * FROM lesson_notes WHERE id = ?').get(noteId);

    res.json({
      success: true,
      message: `Lesson note successfully marked as '${status}'.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/lesson-notes/:id
 * Delete a lesson note (Only author if Draft, or SuperAdmin/Admin)
 */
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const noteId = req.params.id;
    const note = db.prepare('SELECT * FROM lesson_notes WHERE id = ?').get(noteId);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Lesson note not found.' });
    }

    if (['admin', 'superadmin'].includes(req.user.role)) {
      db.prepare('DELETE FROM lesson_notes WHERE id = ?').run(noteId);
    } else if (req.user.role === 'teacher') {
      if (note.teacher_id !== req.user.id && note.teacher_name !== (req.user.full_name || req.user.username)) {
        return res.status(403).json({ success: false, message: 'Access denied: not your lesson note.' });
      }
      if (note.status === 'Approved') {
        return res.status(403).json({ success: false, message: 'Approved lesson notes cannot be deleted by teachers.' });
      }
      db.prepare('DELETE FROM lesson_notes WHERE id = ?').run(noteId);
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete lesson notes.' });
    }

    logAudit(req.user.id, 'DELETE_LESSON_NOTE', 'ACADEMICS', `Deleted lesson note #${noteId}`, req.ip);

    res.json({
      success: true,
      message: 'Lesson note deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
