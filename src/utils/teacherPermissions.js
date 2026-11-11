// Comprehensive Role & Access Control for Teachers and Academic Staff
// Rule: Class/Form Teachers have access to ALL subjects in their class.
// Subject Teachers only have access to the specific subjects they teach.

import { facultyRoster } from '../data/facultyRoster.js';

/**
 * Standardize class name to a canonical identifier
 */
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

/**
 * Check if the user is an admin or executive with unrestricted academic grading access
 */
export function isUnrestrictedStaff(user) {
  return ['admin', 'superadmin'].includes(user?.role);
}

/**
 * Look up faculty roster record matching this user or staff object
 */
export function getFacultyRecord(userOrStaff) {
  if (!userOrStaff) return null;
  const ref = (userOrStaff.reference_id || userOrStaff.staff_no || userOrStaff.staff?.staff_no || '').trim().toUpperCase();
  const name = (userOrStaff.full_name || userOrStaff.name || userOrStaff.staff?.name || '').trim().toLowerCase();

  return facultyRoster.find(f => {
    if (ref && f.staffNo && f.staffNo.toUpperCase() === ref) return true;
    if (name && f.name && f.name.toLowerCase() === name) return true;
    if (name && f.name) {
      const cleanF = f.name.toLowerCase().replace(/^(mr|mrs|miss|dr)\.?\s+/i, '');
      const cleanN = name.replace(/^(mr|mrs|miss|dr)\.?\s+/i, '');
      if (cleanF.includes(cleanN) || cleanN.includes(cleanF)) return true;
    }
    return false;
  }) || null;
}

/**
 * Expand a classes string (e.g. 'SSS1 – SSS3', 'JSS1 – JSS3 & SSS3') into a set of canonical class keys
 */
export function expandClassRange(text) {
  const t = (text || '').toUpperCase();
  const classes = new Set();

  if (t.includes('ALL CLASSES') || t.includes('ALL')) {
    ['CRECHE', 'PRENURSERY', 'NURSERY1', 'NURSERY2', 'NURSERY3', 'PRIMARY1', 'PRIMARY2', 'PRIMARY3', 'PRIMARY4', 'PRIMARY5', 'PRIMARY6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].forEach(c => classes.add(c));
    return classes;
  }

  // Senior Secondary range
  if (t.includes('SSS1–SSS3') || t.includes('SSS1-SSS3') || t.includes('SSS1 – SSS3') || t.includes('SS1 - SS3') || t.includes('SS1–SS3') || t.includes('SS 1 - SS 3') || t.includes('SENIOR SECONDARY') || t.includes('SENIOR COLLEGE')) {
    classes.add('SS1');
    classes.add('SS2');
    classes.add('SS3');
  }

  // Junior Secondary range
  if (t.includes('JSS1–JSS3') || t.includes('JSS1-JSS3') || t.includes('JSS1 – JSS3') || t.includes('JSS 1 - JSS 3') || t.includes('JUNIOR SECONDARY') || t.includes('JUNIOR COLLEGE')) {
    classes.add('JSS1');
    classes.add('JSS2');
    classes.add('JSS3');
  }

  // Primary range
  if (t.includes('BASIC 1–BASIC 6') || t.includes('BASIC 1 - BASIC 6') || t.includes('PRIMARY 1 - PRIMARY 6') || t.includes('ALL PRIMARY')) {
    ['PRIMARY1', 'PRIMARY2', 'PRIMARY3', 'PRIMARY4', 'PRIMARY5', 'PRIMARY6'].forEach(c => classes.add(c));
  }

  // Nursery range
  if (t.includes('NURSERY 1–NURSERY 3') || t.includes('ALL EARLY YEARS')) {
    ['NURSERY1', 'NURSERY2', 'NURSERY3'].forEach(c => classes.add(c));
  }

  // Singles
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

/**
 * Returns whether user is the Form Teacher / Class Teacher for the given class
 */
export function isFormTeacherOfClass(userOrStaff, classObj) {
  if (!userOrStaff || !classObj) return false;
  if (isUnrestrictedStaff(userOrStaff)) return true;

  const staff = userOrStaff.staff || userOrStaff;
  const staffId = userOrStaff.staff?.id || (!userOrStaff.reference_id ? staff.id : null);

  // Direct SQLite class_teacher_id match
  if (staffId && classObj.class_teacher_id && String(staffId) === String(classObj.class_teacher_id)) {
    return true;
  }

  const targetNorm = normalizeClass(classObj.name);

  // Check form responsibility on staff record
  const resp = (staff.form_responsibility || '').toUpperCase();
  if (expandClassRange(resp).has(targetNorm)) return true;

  // Check structured faculty roster record
  const faculty = getFacultyRecord(userOrStaff);
  if (faculty) {
    if (expandClassRange(faculty.formResponsibility || '').has(targetNorm)) return true;

    // Lead Early Years / Primary educators who teach all subjects in a class
    if (faculty.subjects && faculty.subjects.toLowerCase().includes('all') && faculty.classes) {
      const fClassNorm = normalizeClass(faculty.classes);
      if (fClassNorm === targetNorm) return true;
    }
  }

  return false;
}

/**
 * Check if teacher subject string matches a subject record
 */
export function matchesSubjectForTeacher(teacherSubjectText, sub) {
  if (!teacherSubjectText || !sub) return false;
  const t = teacherSubjectText.toLowerCase();
  const sName = (sub.name || '').toLowerCase();
  const sCode = (sub.code || '').toLowerCase();

  // If teacher teaches all subjects (Primary/Nursery class teachers)
  if (t.includes('all subjects') || t.includes('all primary') || t.includes('all early years')) return true;

  // Specific subject checks with exact word boundaries
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
 * Returns allowed classes for a teacher:
 * 1. Their Form/Class Teacher class (always included)
 * 2. Classes where they teach at least 1 subject
 */
export function getAllowedClassesForTeacher(userOrStaff, allClasses = []) {
  if (!userOrStaff || !allClasses.length) return allClasses;
  if (isUnrestrictedStaff(userOrStaff)) return allClasses;

  const staff = userOrStaff.staff || userOrStaff;
  const faculty = getFacultyRecord(userOrStaff);

  const clsText = faculty ? faculty.classes : (staff.assigned_class || '');
  const taughtClassKeys = expandClassRange(clsText);

  return allClasses.filter(c => {
    // If form teacher for this class, always allow
    if (isFormTeacherOfClass(userOrStaff, c)) return true;

    // If teacher's taught class range includes this class
    const cNorm = normalizeClass(c.name);
    return taughtClassKeys.has(cNorm);
  });
}

/**
 * Returns allowed subjects for a teacher in a given class:
 * - If Form/Class Teacher for this class -> returns ALL subjects!
 * - If Subject Teacher -> returns ONLY the subjects they teach in this class!
 */
export function getAllowedSubjectsForClass(userOrStaff, classObj, allSubjects = []) {
  if (!userOrStaff || !allSubjects.length) return allSubjects;
  if (isUnrestrictedStaff(userOrStaff)) return allSubjects;

  // RULE 1: Form / Class Teacher has access to ALL subjects for their class!
  if (isFormTeacherOfClass(userOrStaff, classObj)) {
    return allSubjects;
  }

  // RULE 2: Subject Teacher only has access to subjects they teach in this class
  const staff = userOrStaff.staff || userOrStaff;
  const faculty = getFacultyRecord(userOrStaff);

  const clsText = faculty ? faculty.classes : (staff.assigned_class || '');
  const taughtClassKeys = expandClassRange(clsText);
  const cNorm = normalizeClass(classObj?.name);

  // If teacher doesn't teach this class at all
  if (!taughtClassKeys.has(cNorm)) {
    return [];
  }

  // Filter subjects to only what the teacher teaches
  const subText = faculty ? faculty.subjects : (staff.assigned_class || '');
  return allSubjects.filter(sub => matchesSubjectForTeacher(subText, sub));
}

/**
 * Boolean permission check: Can this teacher add/edit scores for (classObj, subjectObj)?
 */
export function canTeacherGradeSubject(userOrStaff, classObj, subjectObj, allSubjects = []) {
  if (!userOrStaff || !classObj || !subjectObj) return false;
  if (isUnrestrictedStaff(userOrStaff)) return true;

  // Form teachers have full access to all subjects in their class
  if (isFormTeacherOfClass(userOrStaff, classObj)) return true;

  // Subject teachers must match both class and subject
  const allowed = getAllowedSubjectsForClass(userOrStaff, classObj, allSubjects.length ? allSubjects : [subjectObj]);
  return allowed.some(s => String(s.id) === String(subjectObj.id) || (s.code && subjectObj.code && s.code === subjectObj.code));
}
