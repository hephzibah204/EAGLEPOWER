import db from '../config/db.js';
import { assertTeacherCanGrade, expandClassRange, normalizeClass } from '../utils/teacherPermissions.js';

export function canTeacherAccessClass(user, classId) {
  if (['admin', 'superadmin'].includes(user?.role)) return true;
  if (user?.role !== 'teacher') return false;
  const staff = db.prepare(`SELECT id FROM staff WHERE is_active = 1
    AND (UPPER(staff_no) = UPPER(?) OR LOWER(name) = LOWER(?)) LIMIT 1`)
    .get(user.reference_id || '', user.full_name || '');
  if (!staff) return false;
  const cls = db.prepare('SELECT class_teacher_id FROM classes WHERE id = ?').get(Number(classId));
  if (cls?.class_teacher_id === staff.id) return true;
  return db.prepare('SELECT id FROM subjects').all().some(subject => {
    try { assertTeacherCanGrade(user, classId, subject.id); return true; }
    catch { return false; }
  });
}

export function canTeacherAccessWholeClass(user, classId) {
  if (['admin', 'superadmin'].includes(user?.role)) return true;
  if (user?.role !== 'teacher') return false;
  const staff = db.prepare(`SELECT id, staff_no, name, form_responsibility FROM staff
    WHERE is_active = 1 AND (UPPER(staff_no) = UPPER(?) OR LOWER(name) = LOWER(?)) LIMIT 1`)
    .get(user.reference_id || '', user.full_name || '');
  const cls = db.prepare('SELECT id, name, class_teacher_id FROM classes WHERE id = ?').get(Number(classId));
  if (!staff || !cls) return false;
  if (String(cls.class_teacher_id || '') === String(staff.id)) return true;
  return expandClassRange(staff.form_responsibility || '').has(normalizeClass(cls.name));
}

export function requireTeacherClassAccess(req, res, next) {
  if (req.user.role !== 'teacher') return next();
  const classId = req.params.classId || req.query.class_id || req.body?.class_id;
  const subjectId = req.query.subject_id || req.body?.subject_id;
  if (subjectId) {
    if (!canTeacherAccessClass(req.user, classId)) {
      return res.status(403).json({ success: false, message: 'Access denied: this class is not assigned to you.' });
    }
    try { assertTeacherCanGrade(req.user, classId, subjectId); }
    catch { return res.status(403).json({ success: false, message: 'Access denied: this subject is not assigned to you.' }); }
  } else if (!canTeacherAccessWholeClass(req.user, classId)) {
    return res.status(403).json({ success: false, message: 'Access denied: whole-class records are limited to the class teacher.' });
  }
  next();
}
