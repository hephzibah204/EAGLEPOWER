// Server-side Academic Permissions & Access Control for Eagle Power Schools
// Enforces:
// 1. Class / Form Teachers have access to ALL subjects in their class.
// 2. Subject Teachers ONLY have access to the subjects they teach in the classes they teach.
// 3. SuperAdmin / Admin / Principal have unrestricted access.

import db from '../config/db.js';

export function normalizeClass(name) {
  if (!name) return '';
  const s = String(name).toUpperCase().trim();
  const clean = s.replace(/\s+/g, '');

  if (clean.includes('SSS1') || clean === 'SS1' || clean === 'SS-1' || clean === 'SSS-1') return 'SS1';
  if (clean.includes('SSS2') || clean === 'SS2' || clean === 'SS-2' || clean === 'SSS-2') return 'SS2';
  if (clean.includes('SSS3') || clean === 'SS3' || clean === 'SS-3' || clean === 'SSS-3') return 'SS3';

  if (clean.includes('JSS1') || clean === 'JSS-1') return 'JSS1';
  if (clean.includes('JSS2') || clean === 'JSS-2') return 'JSS2';
  if (clean.includes('JSS3') || clean === 'JSS-3') return 'JSS3';

  for (let i = 1; i <= 6; i++) {
    if (clean.includes('BASIC' + i) || clean.includes('PRIMARY' + i) || clean.includes('PRI' + i)) {
      return 'PRIMARY' + i;
    }
  }

  for (let i = 1; i <= 3; i++) {
    if (clean.includes('NURSERY' + i) || clean.includes('NUR' + i)) {
      return 'NURSERY' + i;
    }
  }

  if (clean.includes('PRE-NURSERY') || clean.includes('PRENURSERY') || clean.includes('DAYCARE')) return 'PRENURSERY';
  if (clean.includes('CRECHE')) return 'CRECHE';

  return clean;
}

export function isUnrestrictedStaff(user) {
  return ['admin', 'superadmin'].includes(user?.role);
}

export function expandClassRange(text) {
  const t = (text || '').toUpperCase();
  const classes = new Set();

  if (t.includes('ALL CLASSES') || t.includes('ALL')) {
    ['CRECHE', 'PRENURSERY', 'NURSERY1', 'NURSERY2', 'NURSERY3', 'PRIMARY1', 'PRIMARY2', 'PRIMARY3', 'PRIMARY4', 'PRIMARY5', 'PRIMARY6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].forEach(c => classes.add(c));
    return classes;
  }

  if (t.includes('SSS1–SSS3') || t.includes('SSS1-SSS3') || t.includes('SSS1 – SSS3') || t.includes('SS1 - SS3') || t.includes('SS1–SS3') || t.includes('SS 1 - SS 3') || t.includes('SENIOR SECONDARY') || t.includes('SENIOR COLLEGE')) {
    classes.add('SS1'); classes.add('SS2'); classes.add('SS3');
  }

  if (t.includes('JSS1–JSS3') || t.includes('JSS1-JSS3') || t.includes('JSS1 – JSS3') || t.includes('JSS 1 - JSS 3') || t.includes('JUNIOR SECONDARY') || t.includes('JUNIOR COLLEGE')) {
    classes.add('JSS1'); classes.add('JSS2'); classes.add('JSS3');
  }

  if (t.includes('BASIC 1–BASIC 6') || t.includes('BASIC 1 - BASIC 6') || t.includes('PRIMARY 1 - PRIMARY 6') || t.includes('ALL PRIMARY')) {
    ['PRIMARY1', 'PRIMARY2', 'PRIMARY3', 'PRIMARY4', 'PRIMARY5', 'PRIMARY6'].forEach(c => classes.add(c));
  }

  if (t.includes('NURSERY 1–NURSERY 3') || t.includes('ALL EARLY YEARS')) {
    ['NURSERY1', 'NURSERY2', 'NURSERY3'].forEach(c => classes.add(c));
  }

  if (/\bSSS?\s*1\b/i.test(t)) classes.add('SS1');
  if (/\bSSS?\s*2\b/i.test(t)) classes.add('SS2');
  if (/\bSSS?\s*3\b/i.test(t)) classes.add('SS3');
  if (/\bJSS?\s*1\b/i.test(t)) classes.add('JSS1');
  if (/\bJSS?\s*2\b/i.test(t)) classes.add('JSS2');
  if (/\bJSS?\s*3\b/i.test(t)) classes.add('JSS3');

  for (let i = 1; i <= 6; i++) {
    const reg = new RegExp('\\b(BASIC|PRIMARY|PRI)\\s*' + i + '\\b', 'i');
    if (reg.test(t)) classes.add('PRIMARY' + i);
  }

  for (let i = 1; i <= 3; i++) {
    const reg = new RegExp('\\b(NURSERY|NUR)\\s*' + i + '\\b', 'i');
    if (reg.test(t)) classes.add('NURSERY' + i);
  }

  if (t.includes('PRE-NURSERY') || t.includes('PRENURSERY') || t.includes('DAYCARE')) classes.add('PRENURSERY');
  if (t.includes('CRECHE')) classes.add('CRECHE');

  return classes;
}

export function matchesSubjectForTeacher(teacherSubjectText, sub) {
  if (!teacherSubjectText || !sub) return false;
  const t = teacherSubjectText.toLowerCase();
  const sName = (sub.name || '').toLowerCase();
  const sCode = (sub.code || '').toLowerCase();

  if (t.includes('all subjects') || t.includes('all primary') || t.includes('all early years')) return true;

  if (sCode === 'phy' && /\bphysics\b/.test(t)) return true;
  if (sCode === 'chm' && /\bchemistry\b/.test(t)) return true;
  if (sCode === 'bio' && /\bbiology\b/.test(t)) return true;
  if (sCode === 'agr' && (t.includes('agric') || t.includes('agricultural'))) return true;
  if (sCode === 'mth' && /\bmath(ematics)?\b/.test(t)) return true;
  if (sCode === 'fmth' && (t.includes('further math') || t.includes('further mathematics'))) return true;
  if (sCode === 'eng' && (t.includes('english language') || (t.includes('english') && !t.includes('literature-in-english')))) return true;
  if (sCode === 'lit' && t.includes('literature')) return true;
  if (sCode === 'com' && /\bcommerce\b/.test(t)) return true;
  if (sCode === 'gov' && /\bgovernment\b/.test(t)) return true;
  if (sCode === 'ecn' && /\beconomics\b/.test(t)) return true;
  if (sCode === 'geo' && /\bgeography\b/.test(t)) return true;
  if (sCode === 'mkt' && /\bmarketing\b/.test(t)) return true;
  if (sCode === 'bus' && /\bbusiness\b/.test(t)) return true;
  if (sCode === 'crs' && (t.includes('crs') || t.includes('christian') || t.includes('religious'))) return true;
  if ((sCode === 'dtech' || sCode === 'ict') && (t.includes('digital tech') || t.includes('computer') || t.includes('ict') || t.includes('technology'))) return true;
  if (sCode === 'phe' && (t.includes('phe') || t.includes('physical & health') || t.includes('physical and health'))) return true;
  if (sCode === 'cve' && (t.includes('civic') || t.includes('citizenship'))) return true;
  if (sCode === 'sos' && (t.includes('social studies') || t.includes('social & citizenship') || t.includes('social and citizenship'))) return true;
  if (sCode === 'cca' && (t.includes('cultural & creative') || t.includes('creative arts') || t.includes('cca'))) return true;
  if (sCode === 'vart' && (t.includes('visual art') || t.includes('art'))) return true;
  if (sCode === 'pvs' && (t.includes('pvs') || t.includes('pre-vocational') || t.includes('vocational'))) return true;
  if ((sCode === 'isc' || sCode === 'bst') && (t.includes('intermediate science') || t.includes('basic science') || t.includes('science'))) return true;
  if ((sCode === 'aigb' || sCode === 'igb') && t.includes('igbo')) return true;
  if (sCode === 'frn' && t.includes('french')) return true;
  if (sCode === 'hec' && t.includes('home economics')) return true;
  if (sCode === 'dic' && (t.includes('diction') || t.includes('phonetics'))) return true;
  if ((sCode === 'qr' || sCode === 'vr') && (t.includes('reasoning') || t.includes('primary'))) return true;

  return false;
}

/**
 * Validates whether the authenticated user is authorized to enter/edit scores for classId and subjectId.
 * Throws an Error with explanation if unauthorized.
 */
export function assertTeacherCanGrade(user, classId, subjectId) {
  if (isUnrestrictedStaff(user)) return true;

  // Retrieve staff record
  let staff = null;
  if (user.reference_id) {
    staff = db.prepare('SELECT * FROM staff WHERE UPPER(staff_no) = UPPER(?)').get(user.reference_id);
  }
  if (!staff && user.full_name) {
    staff = db.prepare('SELECT * FROM staff WHERE LOWER(name) = LOWER(?)').get(user.full_name);
  }
  if (!staff) {
    // If user is a teacher without linked staff, deny
    throw new Error('Access denied: No active staff profile linked to your user account.');
  }

  // Retrieve class and subject
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(parseInt(classId));
  if (!cls) throw new Error(`Invalid Class ID: ${classId}`);

  const sub = db.prepare('SELECT * FROM subjects WHERE id = ?').get(parseInt(subjectId));
  if (!sub) throw new Error(`Invalid Subject ID: ${subjectId}`);

  // RULE 1: Form / Class Teacher has access to ALL subjects in their class!
  if (cls.class_teacher_id && String(staff.id) === String(cls.class_teacher_id)) {
    return true;
  }

  const targetNorm = normalizeClass(cls.name);
  const resp = (staff.form_responsibility || '').toUpperCase();
  if (expandClassRange(resp).has(targetNorm)) return true;

  // RULE 2: Subject Teacher check
  const assigned = staff.assigned_class || '';
  const taughtClassKeys = expandClassRange(assigned);

  if (!taughtClassKeys.has(targetNorm)) {
    throw new Error(`Access denied: You are not assigned to teach or manage class '${cls.name}'.`);
  }

  if (!matchesSubjectForTeacher(assigned, sub)) {
    throw new Error(`Access denied: As a subject teacher in '${cls.name}', you are only permitted to enter scores for your assigned subjects, not '${sub.name}'.`);
  }

  return true;
}
