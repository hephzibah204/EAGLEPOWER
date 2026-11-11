import { canTeacherAccessWholeClass, requireTeacherClassAccess } from '../middleware/academicAccess.js';
import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles, requireStudentAccess } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { generateReportCardComments } from '../services/inHouseAi.js';
import { generateReportCommentsWithPuterOrInHouse } from '../services/puterAi.js';
import {
  calculateGradeAndRemark,
  calculateMultiComponentScore,
  getScaleForDivision,
  getPromotionDecision,
  DIVISION_GRADING_SCALES,
  DIVISION_ASSESSMENT_CONFIG,
  getAssessmentConfig,
  isPrimaryDivision
} from '../services/gradingScale.js';
import { assertTeacherCanGrade } from '../utils/teacherPermissions.js';

const router = express.Router();

function calculateGrade(total, division = 'Senior College') {
  return calculateGradeAndRemark(total, division);
}

function validateScoreEntry(entry = {}, division = 'Senior College') {
  const config = getAssessmentConfig(division);
  const detailed = ['ca1_score', 'ca2_score', 'project_score'].some(key => entry[key] !== null && entry[key] !== undefined && entry[key] !== '');
  const fields = detailed
    ? [['ca1_score', config.ca1_max], ['ca2_score', config.ca2_max]]
    : [['ca_score', config.ca_max]];

  if (detailed && entry.project_score !== null && entry.project_score !== undefined && entry.project_score !== '') {
    fields.push(['project_score', config.project_max || 15]);
  }

  fields.push(['exam_score', config.exam_max]);

  for (const [field, max] of fields) {
    const value = entry[field];
    if ((field.endsWith('_score') && ['ca1_score', 'ca2_score', 'project_score'].includes(field) && (value === null || value === undefined || value === ''))) continue;
    const score = Number(value ?? 0);
    if (!Number.isFinite(score) || score < 0 || score > max) return `${field.replaceAll('_', ' ')} must be between 0 and ${max}.`;
  }
  return null;
}

function getClassRanking(classId, session, term) {
  const classSize = db.prepare('SELECT COUNT(*) AS count FROM students WHERE class_id = ? AND is_active = 1').get(classId)?.count || 0;
  const subjectCount = db.prepare(`
    SELECT COUNT(DISTINCT m.subject_id) AS count
    FROM marks m JOIN students s ON s.id = m.student_id
    WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ? AND m.term = ?
  `).get(classId, session, term)?.count || 0;
  const completeRows = subjectCount ? db.prepare(`
    SELECT m.student_id, AVG(m.total_score) AS average, COUNT(DISTINCT m.subject_id) AS subjects_recorded
    FROM marks m JOIN students s ON s.id = m.student_id
    WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ? AND m.term = ?
    GROUP BY m.student_id
    HAVING COUNT(DISTINCT m.subject_id) = ?
    ORDER BY average DESC, m.student_id ASC
  `).all(classId, session, term, subjectCount) : [];
  const ranks = new Map();
  let previousAverage = null;
  let previousRank = 0;
  completeRows.forEach((row, index) => {
    const rank = row.average === previousAverage ? previousRank : index + 1;
    ranks.set(row.student_id, rank);
    previousAverage = row.average;
    previousRank = rank;
  });
  return { ranks, classSize, rankableCount: completeRows.length, subjectCount };
}

function getSubjectRanks(classId, session, term, subjectId) {
  const rows = db.prepare(`
    SELECT m.student_id, m.total_score
    FROM marks m JOIN students s ON s.id = m.student_id
    WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ? AND m.term = ? AND m.subject_id = ?
    ORDER BY m.total_score DESC, m.student_id ASC
  `).all(classId, session, term, subjectId);
  const ranks = new Map();
  let previousScore = null;
  let previousRank = 0;
  rows.forEach((row, index) => {
    const rank = row.total_score === previousScore ? previousRank : index + 1;
    ranks.set(row.student_id, rank);
    previousScore = row.total_score;
    previousRank = rank;
  });
  return ranks;
}

function assertTeacherCanAccessStudentClass(user, student) {
  if (user?.role === 'teacher' && (!student?.class_id || !canTeacherAccessWholeClass(user, student.class_id))) {
    const error = new Error('Access denied: report cards and whole-class report actions are limited to your assigned class.');
    error.status = 403;
    throw error;
  }
}

function emptyAttendance() {
  return { opened: 0, present: 0, absent: 0 };
}

/**
 * GET /api/exams/grading-scales
 * Returns active division grading scales (Public/Authenticated)
 */
router.get('/grading-scales', (_req, res) => {
  res.json({
    success: true,
    scales: DIVISION_GRADING_SCALES,
    assessment_configs: DIVISION_ASSESSMENT_CONFIG,
    data: DIVISION_GRADING_SCALES
  });
});

/**
 * GET /api/exams/marks/:studentId
 * Marks by student ID (Authenticated & ownership checked)
 */
router.get('/marks/:studentId', authenticate, requireStudentAccess('studentId', 'id'), (req, res, next) => {
  try {
    const { session = '2026/2027', term = 'First Term' } = req.query;
    const targetStudentId = parseInt(req.params.studentId);
    const targetStudent = db.prepare('SELECT s.id, s.class_id, c.division FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?').get(targetStudentId);
    if (req.user.role === 'teacher') assertTeacherCanAccessStudentClass(req.user, targetStudent || { class_id: null });

    // Ownership check for student and parent
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student || student.id !== targetStudentId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own marks.' });
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

    const marks = db.prepare(`
      SELECT m.*, s.name as subject_name, s.code as subject_code, s.category
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ? AND m.session = ? AND m.term = ?
      ORDER BY s.name ASC
    `).all(targetStudentId, session, term);
    const division = targetStudent?.division || 'Senior College';
    const normalizedMarks = marks.map(mark => ({ ...mark, ...calculateGradeAndRemark(mark.total_score, division) }));

    res.json({
      success: true,
      count: normalizedMarks.length,
      data: normalizedMarks
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/class-sheet
 * Teacher Gradebook Class Marks Sheet (Teacher/Admin only)
 */
router.get('/class-sheet', authenticate, requireRoles('teacher', 'admin', 'superadmin'), requireTeacherClassAccess, (req, res, next) => {
  try {
    const { class_id, subject_id, session = '2026/2027', term = 'First Term' } = req.query;

    if (!class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id and subject_id query parameters are required.'
      });
    }

    const classInfo = db.prepare('SELECT * FROM classes WHERE id = ?').get(parseInt(class_id));
    const division = classInfo?.division || 'Senior College';
    const scale = getScaleForDivision(division);

    const rows = db.prepare(`
      SELECT
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        m.ca1_score,
        m.ca2_score,
        m.project_score,
        COALESCE(m.ca_score, 0) as ca_score,
        COALESCE(m.exam_score, 0) as exam_score,
        COALESCE(m.total_score, 0) as total_score,
        COALESCE(m.grade, '-') as grade,
        COALESCE(m.remark, 'Pending') as remark,
        m.division_grade
      FROM students s
      LEFT JOIN marks m ON m.student_id = s.id
        AND m.subject_id = ?
        AND m.session = ?
        AND m.term = ?
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.last_name ASC, s.first_name ASC
    `).all(parseInt(subject_id), session, term, parseInt(class_id));

    res.json({
      success: true,
      count: rows.length,
      class_info: {
        id: classInfo?.id,
        name: classInfo?.name,
        division,
        grading_scale: {
          name: scale.name,
          code: scale.code,
          grades: scale.grades
        }
      },
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/report-card/:admissionNo
 * Comprehensive Official E-Report Card with Auto Class Ranking (Authenticated & ownership checked)
 */
router.get('/report-card/:admissionNo', authenticate, requireStudentAccess('admissionNo', 'admission_no'), (req, res, next) => {
  try {
    const { admissionNo } = req.params;
    const { session = '2026/2027', term = 'First Term' } = req.query;
    const cleanAdmNo = admissionNo.trim().toUpperCase();

    // Check authorization:
    if (req.user.role === 'student') {
      const selfAdm = (req.user.reference_id || req.user.username || '').toUpperCase();
      if (selfAdm !== cleanAdmNo) {
        return res.status(403).json({ success: false, message: 'Students can only view their own report card.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase() || '___no_guardian_email___';
      const cleanRef = (req.user.reference_id || '').trim().toUpperCase();

      const child = db.prepare(`
        SELECT id FROM students
        WHERE UPPER(admission_no) = ? AND (
          (guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
          OR (guardian_email IS NOT NULL AND LOWER(guardian_email) = ?)
          OR UPPER(admission_no) = ?
        )
      `).get(cleanAdmNo, `%${last10}%`, cleanEmail, cleanRef);

      if (!child) {
        return res.status(403).json({ success: false, message: 'Access denied: Not your registered ward.' });
      }
    }

    const student = db.prepare(`
      SELECT s.*, c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE UPPER(s.admission_no) = ?
    `).get(cleanAdmNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with admission number ${admissionNo} not found.`
      });
    }
    assertTeacherCanAccessStudentClass(req.user, student);

    // Retrieve student's marks
    const marks = db.prepare(`
      SELECT m.*, s.name as subject_name, s.code as subject_code, s.category
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ? AND m.session = ? AND m.term = ?
      ORDER BY s.name ASC
    `).all(student.id, session, term);

    if (marks.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No examination results compiled yet for ${student.first_name} ${student.last_name} in ${session} (${term}).`
      });
    }

    // Compute totals and average
    const totalObtained = marks.reduce((sum, m) => sum + (m.total_score || 0), 0);
    const totalObtainable = marks.length * 100;
    const average = parseFloat((totalObtained / marks.length).toFixed(1));

    const classRanking = getClassRanking(student.class_id, session, term);
    const position = classRanking.ranks.get(student.id) ?? null;

    // Helper for position suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinal = (n) => {
      if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Retrieve report_extras if any exists
    const extraRow = db.prepare(`
      SELECT * FROM report_extras WHERE student_id = ? AND session = ? AND term = ?
    `).get(student.id, session, term);

    let parsedAttendance = emptyAttendance();
    let parsedTraits = { politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 };
    let parsedPsychomotor = { handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 };
    let nextTermResumption = null;
    let chosenTemplate = 'ELITE';

    if (extraRow) {
      try { if (extraRow.attendance) parsedAttendance = { ...emptyAttendance(), ...JSON.parse(extraRow.attendance) }; } catch {}
      try { parsedTraits = JSON.parse(extraRow.traits); } catch {}
      try { parsedPsychomotor = JSON.parse(extraRow.psychomotor); } catch {}
      if (extraRow.next_term_resumption) nextTermResumption = extraRow.next_term_resumption;
      if (extraRow.template) chosenTemplate = extraRow.template;
    }

    // Dynamic In-House AI Report Card Comment Generation
    const aiComments = generateReportCardComments({
      student,
      marks,
      average,
      position: position ?? 'unranked pending complete marks',
      classSize: classRanking.rankableCount,
      attendance: parsedAttendance,
      traits: parsedTraits,
      psychomotor: parsedPsychomotor,
      division: student.division,
      session,
      term
    });

    const customTeacherComment = extraRow?.teacher_comment || aiComments.teacher_comment;
    const customPrincipalComment = extraRow?.principal_comment || aiComments.principal_comment;
    const promotionStatus = extraRow?.promotion_status || aiComments.promotion_status;

    // Get division-specific scale for this student's class
    const scale = getScaleForDivision(student.division);
    const subjectGradeResults = marks.map(mark => ({ ...mark, ...calculateGradeAndRemark(mark.total_score, student.division) }));
    const topGrade = scale.grades[0];

    // Build standard_report format (compatible with edureport-ng report sheet design templates)
    const scoresMap = {};
    const subjectRanks = new Map(marks.map(mark => [mark.subject_id, getSubjectRanks(student.class_id, session, term, mark.subject_id)]));
    marks.forEach(m => {
      const ca1 = m.ca1_score !== null && m.ca1_score !== undefined ? m.ca1_score : Math.round(m.ca_score / 2);
      const ca2 = m.ca2_score !== null && m.ca2_score !== undefined ? m.ca2_score : Math.round(m.ca_score - ca1);
      const project = m.project_score !== null && m.project_score !== undefined ? m.project_score : 0;
      const { grade, remark } = calculateGradeAndRemark(m.total_score, student.division);

      scoresMap[m.subject_name] = {
        ca1,
        ca2,
        project,
        ca: m.ca_score,
        exam: m.exam_score,
        total: m.total_score,
        grade,
        remark,
        position: getOrdinal(subjectRanks.get(m.subject_id)?.get(student.id))
      };
    });

    // Compute 3-Term Annual Session Cumulative Progression
    const allStudentSessionMarks = db.prepare(`
      SELECT m.*, s.name as subject_name
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ? AND m.session = ?
      ORDER BY s.name ASC
    `).all(student.id, session);

    const annualSubjectGroup = {};
    allStudentSessionMarks.forEach(sm => {
      if (!annualSubjectGroup[sm.subject_name]) {
        annualSubjectGroup[sm.subject_name] = {};
      }
      annualSubjectGroup[sm.subject_name][sm.term] = sm.total_score;
    });

    const subjectsAnnualMatrix = Object.keys(annualSubjectGroup).map(subName => {
      const termsObj = annualSubjectGroup[subName];
      const t1 = termsObj['First Term'] !== undefined ? termsObj['First Term'] : null;
      const t2 = termsObj['Second Term'] !== undefined ? termsObj['Second Term'] : null;
      const t3 = termsObj['Third Term'] !== undefined ? termsObj['Third Term'] : null;
      const valids = [t1, t2, t3].filter(v => v !== null);
      const sum = valids.reduce((a, b) => a + b, 0);
      const annualAvg = valids.length > 0 ? parseFloat((sum / valids.length).toFixed(1)) : 0;
      const { grade: aGrade, remark: aRemark } = calculateGradeAndRemark(annualAvg, student.division);

      return {
        subject: subName,
        term1: t1,
        term2: t2,
        term3: t3,
        annual_average: annualAvg,
        annual_grade: aGrade,
        annual_remark: aRemark
      };
    });

    const expectedAnnualSubjects = db.prepare(`
      SELECT COUNT(DISTINCT m.subject_id) AS count
      FROM marks m JOIN students s ON s.id = m.student_id
      WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ?
    `).get(student.class_id, session)?.count || 0;
    const annualComplete = expectedAnnualSubjects > 0
      && subjectsAnnualMatrix.length === expectedAnnualSubjects
      && subjectsAnnualMatrix.every(item => item.term1 !== null && item.term2 !== null && item.term3 !== null);

    const annualCumulativeAverage = subjectsAnnualMatrix.length > 0
      ? parseFloat((subjectsAnnualMatrix.reduce((a, b) => a + b.annual_average, 0) / subjectsAnnualMatrix.length).toFixed(1))
      : average;

    const isFinalTerm = term === 'Third Term' || term === '3rd Term';
    const annualPromotion = isFinalTerm && !annualComplete
      ? {
          status: 'IN_PROGRESS',
          decision_label: 'PENDING COMPLETE ANNUAL RESULTS',
          recommendation: 'Promotion will be decided after all three terms are recorded for every subject.',
          color: 'blue'
        }
      : getPromotionDecision(annualCumulativeAverage, term);

    const standard_report = {
      school: {
        name: 'Eagle Power Schools',
        motto: 'Love, Truth & Service',
        address: '2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State',
        session,
        term,
        principal: 'Revd Nnamdi Nathaniel',
        contact: '+234 803 542 8910',
        email: 'info@eaglepowerschools.com.ng',
        logoUrl: '/assets/official-logo.jpg'
      },
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admissionNo: student.admission_no,
        className: student.class_name,
        division: student.division,
        gender: student.gender === 'Female' ? 'Female' : 'Male',
        photoUrl: student.photo_url || undefined,
        position: getOrdinal(position),
        classSize: classRanking.rankableCount,
        totalEnrolled: classRanking.classSize
      },
      scores: scoresMap,
      annual_progression: {
        session,
        subjects_matrix: subjectsAnnualMatrix,
        annual_cumulative_average: annualCumulativeAverage,
        annual_complete: annualComplete,
        annual_promotion_status: annualPromotion.status,
        annual_promotion_decision: annualPromotion.decision_label,
        annual_promotion_recommendation: annualPromotion.recommendation,
        annual_promotion_color: annualPromotion.color
      },
      extras: {
        attendance: parsedAttendance,
        traits: parsedTraits,
        psychomotor: parsedPsychomotor,
        comments: {
          teacher: customTeacherComment,
          principal: customPrincipalComment
        },
        promotion: term === 'Third Term' ? annualPromotion.decision_label : promotionStatus,
        nextTermBegins: nextTermResumption
      },
      template: chosenTemplate,
      grading_scale: {
        name: scale.name,
        code: scale.code
      },
      grades: scale.grades
    };

    res.json({
      success: true,
      report_card: {
        school_info: {
          name: 'Eagle Power Schools',
          motto: 'Love, Truth & Service',
          campus_address: '2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State',
          government_approval: 'Anambra State Ministry of Education Approved',
          contact_phone: '+234 803 542 8910',
          official_email: 'admissions@eaglepowerschools.com.ng',
          crest_url: '/assets/official-logo.jpg'
        },
        academic_period: {
          session,
          term,
          next_term_resumption: nextTermResumption
        },
        student: {
          id: student.id,
          admission_no: student.admission_no,
          full_name: `${student.first_name} ${student.last_name}`,
          gender: student.gender,
          class: student.class_name,
          division: student.division,
          section: student.section_name || 'A'
        },
        performance_summary: {
          total_subjects: marks.length,
          total_obtained: totalObtained,
          total_obtainable: totalObtainable,
          average_percentage: average,
          class_position: getOrdinal(position),
          class_size: classRanking.rankableCount,
          total_enrolled: classRanking.classSize,
          distinctions: subjectGradeResults.filter(m => m.grade === topGrade.grade).length,
          credits: subjectGradeResults.filter(m => m.gpa >= 2 && m.grade !== topGrade.grade).length,
          passes: subjectGradeResults.filter(m => m.isPass && m.gpa < 2).length,
          fails: subjectGradeResults.filter(m => !m.isPass).length
        },
        subjects: subjectGradeResults.map(m => ({
          subject_name: m.subject_name,
          subject_code: m.subject_code,
          category: m.category,
          ca_score: m.ca_score,
          exam_score: m.exam_score,
          total_score: m.total_score,
          grade: m.grade,
          remark: m.remark
        })),
        evaluations: {
          principal_remark: customPrincipalComment,
          teacher_remark: customTeacherComment,
          affective_traits: parsedTraits
        }
      },
      standard_report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/exams/marks
 * Record or update individual mark (Teacher / Admin)
 * Supports standard (CA 30 + Exam 70) or Multi-Component (CA1 + CA2 + Project + Exam)
 */
router.post('/marks', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const {
      student_id,
      subject_id,
      session = '2026/2027',
      term = 'First Term',
      ca_score,
      exam_score,
      ca1_score = null,
      ca2_score = null,
      project_score = null
    } = req.body;

    if (!student_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id and subject_id are required.'
      });
    }

    // Determine student's class division for division-specific grading scale
    const studentInfo = db.prepare(`
      SELECT c.division, s.class_id, s.is_active
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(student_id);
    if (!studentInfo || !studentInfo.is_active) {
      return res.status(404).json({ success: false, message: 'Active student not found.' });
    }
    if (!db.prepare('SELECT id FROM subjects WHERE id = ?').get(subject_id)) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
    if (req.user.role === 'teacher') {
      try { assertTeacherCanGrade(req.user, studentInfo.class_id, subject_id); }
      catch (permissionError) { return res.status(403).json({ success: false, message: permissionError.message }); }
    }
    const division = studentInfo?.division || 'Senior College';
    const scoreError = validateScoreEntry({ ca_score, exam_score, ca1_score, ca2_score, project_score }, division);
    if (scoreError) return res.status(400).json({ success: false, message: scoreError });

    const computed = calculateMultiComponentScore({
      ca1_score,
      ca2_score,
      project_score,
      ca_score,
      exam_score,
      division
    });

    const { grade, remark, scale_code } = calculateGradeAndRemark(computed.total_score, division);

    const stmt = db.prepare(`
      INSERT INTO marks (
        student_id, subject_id, session, term,
        ca_score, exam_score, total_score, grade, remark,
        ca1_score, ca2_score, project_score, division_grade, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_id, session, term) DO UPDATE SET
        ca_score = excluded.ca_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        grade = excluded.grade,
        remark = excluded.remark,
        ca1_score = excluded.ca1_score,
        ca2_score = excluded.ca2_score,
        project_score = excluded.project_score,
        division_grade = excluded.division_grade,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      student_id,
      subject_id,
      session,
      term,
      computed.ca_score,
      computed.exam_score,
      computed.total_score,
      grade,
      remark,
      computed.ca1_score,
      computed.ca2_score,
      computed.project_score,
      scale_code
    );

    logAudit(req.user.id, 'RECORD_MARK', 'MARKS', `Recorded mark for student ${student_id}, subject ${subject_id}: ${computed.total_score} (${grade})`, req.ip);

    res.json({
      success: true,
      message: 'Mark recorded successfully.',
      result: {
        student_id,
        subject_id,
        ca1_score: computed.ca1_score,
        ca2_score: computed.ca2_score,
        project_score: computed.project_score,
        ca_score: computed.ca_score,
        exam_score: computed.exam_score,
        total_score: computed.total_score,
        grade,
        remark,
        division,
        scale_code
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/exams/marks/batch
 * Batch score upload for a class subject with multi-component support
 */
router.post('/marks/batch', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { subject_id, class_id, session = '2026/2027', term = 'First Term', entries } = req.body;

    if (!subject_id || !class_id || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'class_id, subject_id, and a non-empty entries array are required.'
      });
    }

    const classId = Number(class_id);
    const subjectId = Number(subject_id);
    if (!Number.isInteger(classId) || !db.prepare('SELECT id FROM classes WHERE id = ?').get(classId)) {
      return res.status(400).json({ success: false, message: 'A valid class_id is required.' });
    }
    if (!Number.isInteger(subjectId) || !db.prepare('SELECT id FROM subjects WHERE id = ?').get(subjectId)) {
      return res.status(400).json({ success: false, message: 'A valid subject_id is required.' });
    }

    // Determine division from class_id or first student
    let division = 'Senior College';
    if (class_id) {
      const cls = db.prepare('SELECT division FROM classes WHERE id = ?').get(classId);
      if (cls?.division) division = cls.division;
    } else if (entries[0]?.student_id) {
      const st = db.prepare('SELECT c.division FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = ?').get(entries[0].student_id);
      if (st?.division) division = st.division;
    }

    const seenStudentIds = new Set();
    for (const item of entries) {
      const studentId = Number(item?.student_id);
      if (!Number.isInteger(studentId) || seenStudentIds.has(studentId)) {
        return res.status(400).json({ success: false, message: 'Each entry must contain a unique valid student_id.' });
      }
      seenStudentIds.add(studentId);
      const student = db.prepare('SELECT id, class_id, is_active FROM students WHERE id = ?').get(studentId);
      if (!student || !student.is_active || Number(student.class_id) !== classId) {
        return res.status(400).json({ success: false, message: `Student ${studentId} is not an active student in the selected class.` });
      }
      const scoreError = validateScoreEntry(item, division);
      if (scoreError) return res.status(400).json({ success: false, message: `Student ${studentId}: ${scoreError}` });
    }

    // Strict Access Control for Teachers:
    // - Class / Form Teachers have access to ALL subjects in their assigned class.
    // - Subject Teachers can ONLY enter scores for the subjects they teach.
    if (req.user?.role === 'teacher') {
      try {
        assertTeacherCanGrade(req.user, classId, subjectId);
      } catch (permErr) {
        return res.status(403).json({
          success: false,
          message: permErr.message
        });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO marks (
        student_id, subject_id, session, term,
        ca_score, exam_score, total_score, grade, remark,
        ca1_score, ca2_score, project_score, division_grade, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_id, session, term) DO UPDATE SET
        ca_score = excluded.ca_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        grade = excluded.grade,
        remark = excluded.remark,
        ca1_score = excluded.ca1_score,
        ca2_score = excluded.ca2_score,
        project_score = excluded.project_score,
        division_grade = excluded.division_grade,
        updated_at = CURRENT_TIMESTAMP
    `);

    let processed = 0;
    const processBatch = db.transaction(() => {
      for (const item of entries) {
        const computed = calculateMultiComponentScore({
          ca1_score: item.ca1_score,
          ca2_score: item.ca2_score,
          project_score: item.project_score,
          ca_score: item.ca_score,
          exam_score: item.exam_score,
          division
        });

        const { grade, remark, scale_code } = calculateGradeAndRemark(computed.total_score, division);

        stmt.run(
          item.student_id,
          subjectId,
          session,
          term,
          computed.ca_score,
          computed.exam_score,
          computed.total_score,
          grade,
          remark,
          computed.ca1_score,
          computed.ca2_score,
          computed.project_score,
          scale_code
        );
        processed++;
      }
    });
    processBatch();

    logAudit(req.user.id, 'BATCH_MARKS', 'MARKS', `Batch uploaded ${processed} marks for subject ${subject_id} (${division})`, req.ip);

    res.json({
      success: true,
      message: `Batch recorded ${processed} marks successfully under ${division} grading scale.`,
      processed,
      saved_count: processed,
      division
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/class-broadsheet
 * Complete Master Broadsheet Matrix for an entire class (Teacher/Admin only)
 */
router.get('/class-broadsheet', authenticate, requireRoles('teacher', 'admin', 'superadmin'), requireTeacherClassAccess, (req, res, next) => {
  try {
    const { class_id, session = '2026/2027', term = 'First Term' } = req.query;

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id query parameter is required.'
      });
    }

    const classInfo = db.prepare(`SELECT * FROM classes WHERE id = ?`).get(parseInt(class_id));
    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: `Class with id ${class_id} not found.`
      });
    }

    // Students in this class
    const students = db.prepare(`
      SELECT s.*, sec.name as section_name
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.last_name ASC, s.first_name ASC
    `).all(parseInt(class_id));

    // Subjects in this class
    let subjects = db.prepare(`
        SELECT DISTINCT sub.id, sub.name, sub.code, sub.category
      FROM subjects sub
      JOIN marks m ON m.subject_id = sub.id
      JOIN students s ON m.student_id = s.id
        WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ? AND m.term = ?
      ORDER BY sub.name ASC
    `).all(parseInt(class_id), session, term);

    if (subjects.length === 0) {
      // Fallback to all curriculum subjects
      subjects = db.prepare(`SELECT id, name, code, category FROM subjects ORDER BY name ASC`).all();
    }

    // All marks for students in this class
    const allMarks = db.prepare(`
      SELECT m.*, sub.name as subject_name
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ? AND m.term = ?
    `).all(parseInt(class_id), session, term);

    // Group marks by student_id
    const studentMarksMap = {};
    allMarks.forEach(m => {
      if (!studentMarksMap[m.student_id]) studentMarksMap[m.student_id] = {};
      studentMarksMap[m.student_id][m.subject_name] = {
        ca1: m.ca1_score ?? Math.round(m.ca_score / 2),
        ca2: m.ca2_score ?? Math.round(m.ca_score - (m.ca1_score ?? Math.round(m.ca_score / 2))),
        project: m.project_score ?? 0,
        ca: m.ca_score,
        exam: m.exam_score,
        total: m.total_score,
        ...calculateGradeAndRemark(m.total_score, classInfo.division)
      };
    });

    // Compute broadsheet rows
    const rows = students.map(student => {
      const studentScores = studentMarksMap[student.id] || {};
      let totalScore = 0;
      let subjectCount = 0;
      const subjectTotals = {};

      subjects.forEach(sub => {
        const sc = studentScores[sub.name];
        if (sc) {
          subjectTotals[sub.name] = sc.total;
          totalScore += sc.total;
          subjectCount++;
        }
      });

      const average = subjectCount > 0 ? parseFloat((totalScore / subjectCount).toFixed(1)) : 0;
      const { grade, remark } = calculateGrade(average, classInfo.division);
      const complete = subjects.length > 0 && subjectCount === subjects.length;

      return {
        student_id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no,
        gender: student.gender === 'Female' ? 'F' : 'M',
        subject_totals: subjectTotals,
        scores_detail: studentScores,
        total_score: totalScore,
        average,
        is_graded: subjectCount > 0,
        complete,
        grade,
        remark
      };
    });

    // Calculate rank
    const sorted = [...rows].filter(row => row.complete).sort((a, b) => b.average - a.average);
    const rankedRows = rows.map(r => {
      const rankIndex = r.complete ? sorted.findIndex(s => s.average === r.average) : -1;
      const rank = rankIndex >= 0 ? rankIndex + 1 : null;
      const sfx = ['th', 'st', 'nd', 'rd'];
      const v = rank % 100;
      const position = rank === null ? '—' : rank + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
      return { ...r, rank, position };
    });

    // Calculate Class Statistics
    const allAverages = rankedRows.filter(r => r.complete).map(r => r.average);
    const classScale = getScaleForDivision(classInfo.division);
    const passThreshold = Math.min(...classScale.grades.filter(item => item.isPass).map(item => item.min));
    const distinctionGrade = classScale.grades[0]?.grade;
    const classAvg = allAverages.length > 0 ? parseFloat((allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1)) : 0;
    const highestAvg = allAverages.length > 0 ? Math.max(...allAverages) : 0;
    const lowestAvg = allAverages.length > 0 ? Math.min(...allAverages) : 0;
    const topStudent = rankedRows.find(r => r.complete && r.average === highestAvg);

    // Subject Averages
    const subjectAverages = {};
    subjects.forEach(sub => {
      let sum = 0;
      let count = 0;
      rankedRows.forEach(r => {
        if (r.subject_totals[sub.name] !== undefined) {
          sum += r.subject_totals[sub.name];
          count++;
        }
      });
      subjectAverages[sub.name] = {
        average: count > 0 ? parseFloat((sum / count).toFixed(1)) : 0,
        count
      };
    });

    // WAEC Grade Distribution
    const gradeDistribution = Object.fromEntries(classScale.grades.map(item => [item.grade, 0]));
    rankedRows.forEach(r => {
      if (r.complete && gradeDistribution[r.grade] !== undefined) {
        gradeDistribution[r.grade]++;
      }
    });

    res.json({
      success: true,
      class_info: classInfo,
      session,
      term,
      subjects: subjects.map(s => s.name),
      students: rankedRows,
      statistics: {
        total_enrolled: students.length,
        graded_count: rankedRows.filter(r => r.is_graded).length,
        class_average: classAvg,
        highest_average: highestAvg,
        top_student_name: topStudent ? topStudent.name : 'N/A',
        lowest_average: lowestAvg,
        at_risk_count: rankedRows.filter(r => r.complete && r.average < passThreshold).length,
        distinction_count: rankedRows.filter(r => r.complete && r.grade === distinctionGrade).length,
        subject_averages: subjectAverages,
        grade_distribution: gradeDistribution
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/annual-broadsheet
 * Master 3-Term Annual Cumulative Academic Broadsheet & Promotion Roster
 */
router.get('/annual-broadsheet', authenticate, requireRoles('teacher', 'admin', 'superadmin'), requireTeacherClassAccess, (req, res, next) => {
  try {
    const { class_id, session = '2026/2027' } = req.query;

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id query parameter is required.'
      });
    }

    const classInfo = db.prepare('SELECT * FROM classes WHERE id = ?').get(parseInt(class_id));
    if (!classInfo) {
      return res.status(404).json({ success: false, message: `Class with id ${class_id} not found.` });
    }

    const division = classInfo.division || 'Senior College';
    const scale = getScaleForDivision(division);

    // Get all active students in class
    const students = db.prepare(`
      SELECT s.*, sec.name as section_name
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.last_name ASC, s.first_name ASC
    `).all(parseInt(class_id));

    // Get subjects offered in this class
    let subjects = db.prepare(`
      SELECT DISTINCT sub.id, sub.name, sub.code, sub.category
      FROM subjects sub
      JOIN marks m ON m.subject_id = sub.id
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ?
      ORDER BY sub.name ASC
    `).all(parseInt(class_id), session);

    if (subjects.length === 0) {
      subjects = db.prepare('SELECT id, name, code, category FROM subjects ORDER BY name ASC').all();
    }

    // Retrieve all marks for this class across all terms in this session
    const allSessionMarks = db.prepare(`
      SELECT m.*, sub.name as subject_name
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND s.is_active = 1 AND m.session = ?
    `).all(parseInt(class_id), session);

    // Group marks by student_id -> subject_name -> term
    const studentTermMarks = {};
    for (const m of allSessionMarks) {
      if (!studentTermMarks[m.student_id]) studentTermMarks[m.student_id] = {};
      if (!studentTermMarks[m.student_id][m.subject_name]) studentTermMarks[m.student_id][m.subject_name] = {};
      studentTermMarks[m.student_id][m.subject_name][m.term] = m;
    }

    // Compute student annual rows
    const studentRows = students.map(student => {
      const subjectScores = studentTermMarks[student.id] || {};
      const subjectAnnualMatrix = {};
      let totalAnnualMarks = 0;
      let evaluatedSubjectsCount = 0;

      const termsPresent = new Set();
      let term1Sum = 0, term1Count = 0;
      let term2Sum = 0, term2Count = 0;
      let term3Sum = 0, term3Count = 0;

      subjects.forEach(sub => {
        const subTerms = subjectScores[sub.name] || {};
        const t1 = subTerms['First Term'] ? subTerms['First Term'].total_score : null;
        const t2 = subTerms['Second Term'] ? subTerms['Second Term'].total_score : null;
        const t3 = subTerms['Third Term'] ? subTerms['Third Term'].total_score : null;

        if (t1 !== null) { termsPresent.add('First Term'); term1Sum += t1; term1Count++; }
        if (t2 !== null) { termsPresent.add('Second Term'); term2Sum += t2; term2Count++; }
        if (t3 !== null) { termsPresent.add('Third Term'); term3Sum += t3; term3Count++; }

        const validScores = [t1, t2, t3].filter(s => s !== null);
        if (validScores.length > 0) {
          const sum = validScores.reduce((a, b) => a + b, 0);
          const subAvg = parseFloat((sum / validScores.length).toFixed(1));
          const { grade, remark } = calculateGradeAndRemark(subAvg, division);

          subjectAnnualMatrix[sub.name] = {
            term1: t1,
            term2: t2,
            term3: t3,
            annual_total: sum,
            terms_count: validScores.length,
            annual_average: subAvg,
            annual_grade: grade,
            annual_remark: remark
          };

          totalAnnualMarks += subAvg;
          evaluatedSubjectsCount++;
        } else {
          subjectAnnualMatrix[sub.name] = {
            term1: null,
            term2: null,
            term3: null,
            annual_total: 0,
            terms_count: 0,
            annual_average: null,
            annual_grade: '-',
            annual_remark: 'No Marks'
          };
        }
      });

      const annualAverage = evaluatedSubjectsCount > 0
        ? parseFloat((totalAnnualMarks / evaluatedSubjectsCount).toFixed(1))
        : null;

      const term1Avg = term1Count > 0 ? parseFloat((term1Sum / term1Count).toFixed(1)) : null;
      const term2Avg = term2Count > 0 ? parseFloat((term2Sum / term2Count).toFixed(1)) : null;
      const term3Avg = term3Count > 0 ? parseFloat((term3Sum / term3Count).toFixed(1)) : null;

      const annualComplete = evaluatedSubjectsCount > 0 && subjects.length > 0 && subjects.every(sub => subjectAnnualMatrix[sub.name]?.terms_count === 3);
      const { grade, remark } = evaluatedSubjectsCount > 0
        ? calculateGradeAndRemark(annualAverage, division)
        : { grade: '-', remark: 'No Marks' };
      const promotion = annualComplete
        ? getPromotionDecision(annualAverage, 'Third Term', true)
        : {
            status: evaluatedSubjectsCount > 0 ? 'IN_PROGRESS' : 'NOT_EVALUATED',
            decision_label: evaluatedSubjectsCount > 0 ? 'PENDING COMPLETE ANNUAL RESULTS' : 'NOT EVALUATED',
            recommendation: evaluatedSubjectsCount > 0 ? 'Promotion will be decided after all three terms are recorded for every subject.' : 'No annual marks have been recorded.',
            color: 'blue'
          };

      return {
        student_id: student.id,
        admission_no: student.admission_no,
        name: `${student.first_name} ${student.last_name}`,
        gender: student.gender === 'Female' ? 'F' : 'M',
        terms_breakdown: {
          first_term_avg: term1Avg,
          second_term_avg: term2Avg,
          third_term_avg: term3Avg,
          terms_attended_count: termsPresent.size
        },
        subjects: subjectAnnualMatrix,
        total_annual_points: parseFloat(totalAnnualMarks.toFixed(1)),
        evaluated_subjects_count: evaluatedSubjectsCount,
        annual_average: annualAverage,
        annual_complete: annualComplete,
        annual_grade: grade,
        annual_remark: remark,
        promotion_status: promotion.status,
        promotion_decision: promotion.decision_label,
        promotion_recommendation: promotion.recommendation,
        promotion_color: promotion.color
      };
    });

    // Sort by annual_average descending to assign Annual Rank
    const sortedStudents = [...studentRows].filter(row => row.annual_complete).sort((a, b) => b.annual_average - a.annual_average);
    const rankedRows = studentRows.map(row => {
      const rankIndex = row.annual_complete ? sortedStudents.findIndex(s => s.annual_average === row.annual_average) : -1;
      const rank = rankIndex >= 0 ? rankIndex + 1 : null;
      const sfx = ['th', 'st', 'nd', 'rd'];
      const v = rank === null ? 0 : rank % 100;
      const position = rank === null ? '—' : rank + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
      return {
        ...row,
        rank,
        annual_position: position,
        position,
        cumulative_total: row.total_annual_points,
        cumulative_average: row.annual_average,
        division_grade: row.annual_grade,
        term_averages: {
          'First Term': row.terms_breakdown.first_term_avg,
          'Second Term': row.terms_breakdown.second_term_avg,
          'Third Term': row.terms_breakdown.third_term_avg
        },
        promotion: {
          status: row.promotion_status === 'PROMOTED_ON_TRIAL' ? 'TRIAL' : row.promotion_status,
          decision: row.promotion_decision,
          recommendation: row.promotion_recommendation,
          badge_color: row.promotion_color === 'amber' ? 'amber' : row.promotion_color === 'rose' ? 'rose' : row.promotion_color === 'blue' ? 'blue' : 'emerald'
        }
      };
    });

    // Ensure broadsheet rows are ordered by rank ASC (1st place at index 0)
    rankedRows.sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));

    // Summary Statistics
    const validAverages = rankedRows.filter(r => r.annual_complete).map(r => r.annual_average);
    const highestAnnual = validAverages.length > 0 ? Math.max(...validAverages) : 0;
    const lowestAnnual = validAverages.length > 0 ? Math.min(...validAverages) : 0;
    const classAnnualAvg = validAverages.length > 0
      ? parseFloat((validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(1))
      : 0;

    const promotionEligibleCount = rankedRows.filter(r => r.annual_complete).length;
    const promotedCount = rankedRows.filter(r => r.annual_complete && r.promotion_status === 'PROMOTED').length;
    const trialCount = rankedRows.filter(r => r.annual_complete && r.promotion_status === 'PROMOTED_ON_TRIAL').length;
    const repeatCount = rankedRows.filter(r => r.annual_complete && r.promotion_status === 'REPEAT').length;
    const promotionRate = promotionEligibleCount > 0
      ? Math.round(((promotedCount + trialCount) / promotionEligibleCount) * 100)
      : 0;

    res.json({
      success: true,
      session,
      class_info: {
        id: classInfo.id,
        name: classInfo.name,
        division: classInfo.division,
        grading_scale: {
          name: scale.name,
          code: scale.code,
          grades: scale.grades
        }
      },
      subjects: subjects.map(s => s.name),
      statistics: {
        total_enrolled: rankedRows.length,
        total_students: rankedRows.length,
        graded_count: validAverages.length,
        class_annual_average: classAnnualAvg,
        highest_annual_average: highestAnnual,
        lowest_annual_average: lowestAnnual,
        top_student_name: rankedRows.find(r => r.rank === 1)?.name || 'N/A',
        promotion_summary: {
          promoted: promotedCount,
          trial: trialCount,
          repeated: repeatCount
        },
        promotion_eligible_count: promotionEligibleCount,
        promotion_pending_count: rankedRows.length - promotionEligibleCount,
        promotion_rate_percent: promotionRate,
        promoted_count: promotedCount,
        promoted_on_trial_count: trialCount,
        repeat_count: repeatCount
      },
      students: rankedRows,
      data: rankedRows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/class-reports/:classId
 * Bulk compiled report cards for an entire class (Teacher/Admin only)
 */
router.get('/class-reports/:classId', authenticate, requireRoles('teacher', 'admin', 'superadmin'), requireTeacherClassAccess, (req, res, next) => {
  try {
    const { classId } = req.params;
    const { session = '2026/2027', term = 'First Term' } = req.query;

    const classInfo = db.prepare(`SELECT * FROM classes WHERE id = ?`).get(parseInt(classId));
    if (!classInfo) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const students = db.prepare(`
      SELECT s.*, c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.last_name ASC, s.first_name ASC
    `).all(parseInt(classId));

    // Calculate class averages for ranking
    const classRanking = getClassRanking(parseInt(classId), session, term);

    const getOrdinal = (n) => {
      if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const reports = students.map(student => {
      const marks = db.prepare(`
        SELECT m.*, s.name as subject_name, s.code as subject_code
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ? AND m.session = ? AND m.term = ?
        ORDER BY s.name ASC
      `).all(student.id, session, term);
      assertTeacherCanAccessStudentClass(req.user, student);
      if (marks.length === 0) return null;

      const totalObtained = marks.reduce((sum, m) => sum + (m.total_score || 0), 0);
      const average = marks.length > 0 ? parseFloat((totalObtained / marks.length).toFixed(1)) : 0;
      const position = classRanking.ranks.get(student.id) ?? null;

      const extraRow = db.prepare(`
        SELECT * FROM report_extras WHERE student_id = ? AND session = ? AND term = ?
      `).get(student.id, session, term);

      let parsedAttendance = emptyAttendance();
      let parsedTraits = { politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 };
      let parsedPsychomotor = { handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 };
      let nextTermResumption = null;
      let template = 'ELITE';

      if (extraRow) {
        try { if (extraRow.attendance) parsedAttendance = { ...emptyAttendance(), ...JSON.parse(extraRow.attendance) }; } catch {}
        try { parsedTraits = JSON.parse(extraRow.traits); } catch {}
        try { parsedPsychomotor = JSON.parse(extraRow.psychomotor); } catch {}
        if (extraRow.next_term_resumption) nextTermResumption = extraRow.next_term_resumption;
        if (extraRow.template) template = extraRow.template;
      }

      const aiComments = generateReportCardComments({
        student,
        marks,
        average,
        position,
        classSize: classRanking.rankableCount,
        totalEnrolled: classRanking.classSize,
        attendance: parsedAttendance,
        traits: parsedTraits,
        psychomotor: parsedPsychomotor,
        division: student.division,
        session,
        term
      });

      const teacherComment = extraRow?.teacher_comment || aiComments.teacher_comment;
      const principalComment = extraRow?.principal_comment || aiComments.principal_comment;
      const promotionStatus = extraRow?.promotion_status || aiComments.promotion_status;

      const scoresMap = {};
      marks.forEach(m => {
        const ca1 = m.ca1_score ?? Math.round(m.ca_score / 2);
        const ca2 = m.ca2_score ?? Math.round(m.ca_score - ca1);
        scoresMap[m.subject_name] = {
          ca1,
          ca2,
          project: m.project_score ?? 0,
          exam: m.exam_score,
          total: m.total_score,
          ...calculateGradeAndRemark(m.total_score, student.division),
          position: getOrdinal(getSubjectRanks(student.class_id, session, term, m.subject_id).get(student.id))
        };
      });

      return {
        school: {
          name: 'Eagle Power Schools',
          motto: 'Love, Truth & Service',
          address: '2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State',
          session,
          term,
          principal: 'Revd Nnamdi Nathaniel',
          contact: '+234 803 542 8910',
          email: 'info@eaglepowerschools.com.ng',
          logoUrl: '/assets/official-logo.jpg'
        },
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          admissionNo: student.admission_no,
          className: student.class_name,
          gender: student.gender === 'Female' ? 'Female' : 'Male',
          photoUrl: student.photo_url || undefined,
          position: getOrdinal(position),
          classSize: classRanking.rankableCount,
          totalEnrolled: classRanking.classSize
        },
        scores: scoresMap,
        extras: {
          attendance: parsedAttendance,
          traits: parsedTraits,
          psychomotor: parsedPsychomotor,
          comments: {
            teacher: teacherComment,
            principal: principalComment
          },
          promotion: promotionStatus,
          nextTermBegins: nextTermResumption
        },
        template,
        grades: getScaleForDivision(student.division).grades
      };
    });

    res.json({
      success: true,
      class_info: classInfo,
      count: reports.filter(Boolean).length,
      skipped_without_marks: reports.filter(report => !report).length,
      data: reports.filter(Boolean)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/exams/report-extras
 * Save / Update student comments, traits, psychomotor, attendance, and template
 */
router.post('/report-extras', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const {
      student_id,
      session = '2026/2027',
      term = 'First Term',
      attendance,
      traits,
      psychomotor,
      teacher_comment,
      principal_comment,
      next_term_resumption,
      promotion_status,
      template
    } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'student_id is required' });
    }

    const targetStudent = db.prepare('SELECT id, class_id FROM students WHERE id = ?').get(student_id);
    if (!targetStudent) return res.status(404).json({ success: false, message: 'Student not found.' });
    assertTeacherCanAccessStudentClass(req.user, targetStudent);

    const attStr = attendance === undefined ? null : (typeof attendance === 'object' && attendance !== null ? JSON.stringify(attendance) : attendance);
    const traitsStr = traits === undefined ? null : (typeof traits === 'object' && traits !== null ? JSON.stringify(traits) : traits);
    const psychStr = psychomotor === undefined ? null : (typeof psychomotor === 'object' && psychomotor !== null ? JSON.stringify(psychomotor) : psychomotor);

    const stmt = db.prepare(`
      INSERT INTO report_extras (
        student_id, session, term, attendance, traits, psychomotor,
        teacher_comment, principal_comment, next_term_resumption,
        promotion_status, template, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, session, term) DO UPDATE SET
        attendance = COALESCE(excluded.attendance, report_extras.attendance),
        traits = COALESCE(excluded.traits, report_extras.traits),
        psychomotor = COALESCE(excluded.psychomotor, report_extras.psychomotor),
        teacher_comment = COALESCE(excluded.teacher_comment, report_extras.teacher_comment),
        principal_comment = COALESCE(excluded.principal_comment, report_extras.principal_comment),
        next_term_resumption = COALESCE(excluded.next_term_resumption, report_extras.next_term_resumption),
        promotion_status = COALESCE(excluded.promotion_status, report_extras.promotion_status),
        template = COALESCE(excluded.template, report_extras.template),
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      student_id,
      session,
      term,
      attStr,
      traitsStr,
      psychStr,
      teacher_comment ?? null,
      principal_comment ?? null,
      next_term_resumption || null,
      promotion_status ?? null,
      template ?? null
    );

    logAudit(req.user.id, 'SAVE_REPORT_EXTRAS', 'REPORT_EXTRAS', `Updated report remarks/traits for student ${student_id}`, req.ip);

    res.json({
      success: true,
      message: 'Student report extras saved successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/exams/generate-ai-comments
 * On-demand AI Report Card Comment Generation for a single student (Teacher / Admin)
 */
router.post('/generate-ai-comments', authenticate, requireRoles('teacher', 'admin', 'superadmin'), async (req, res, next) => {
  try {
    const { student_id, admission_no, session = '2026/2027', term = 'First Term' } = req.body;
    let targetStudentId = student_id;
    if (!targetStudentId && admission_no) {
      const found = db.prepare(`SELECT id FROM students WHERE admission_no = ?`).get(admission_no);
      if (found) targetStudentId = found.id;
    }

    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'student_id or admission_no is required' });
    }

    const student = db.prepare(`
      SELECT s.*, c.name as class_name, c.division
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(targetStudentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    assertTeacherCanAccessStudentClass(req.user, student);

    const marks = db.prepare(`
      SELECT m.*, s.name as subject_name, s.code as subject_code
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ? AND m.session = ? AND m.term = ?
      ORDER BY s.name ASC
    `).all(targetStudentId, session, term);

    const totalObtained = marks.reduce((sum, m) => sum + (m.total_score || 0), 0);
    const average = marks.length > 0 ? parseFloat((totalObtained / marks.length).toFixed(1)) : 0;

    // Calculate position
    const classRanking = getClassRanking(student.class_id, session, term);
    const position = classRanking.ranks.get(student.id) ?? null;

    // Fetch existing extras if any
    const extraRow = db.prepare(`
      SELECT * FROM report_extras WHERE student_id = ? AND session = ? AND term = ?
    `).get(targetStudentId, session, term);

    let parsedAttendance = emptyAttendance();
    let parsedTraits = { politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 };
    let parsedPsychomotor = { handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 };

    if (extraRow) {
      try { if (extraRow.attendance) parsedAttendance = { ...emptyAttendance(), ...JSON.parse(extraRow.attendance) }; } catch {}
      try { parsedTraits = JSON.parse(extraRow.traits); } catch {}
      try { parsedPsychomotor = JSON.parse(extraRow.psychomotor); } catch {}
    }

    // Puter AI (Primary) -> In-House AI (Fallback)
    const aiComments = await generateReportCommentsWithPuterOrInHouse({
      student,
      marks,
      average,
      position: position ?? 'unranked pending complete marks',
      classSize: classRanking.rankableCount,
      attendance: parsedAttendance,
      traits: parsedTraits,
      psychomotor: parsedPsychomotor,
      division: student.division,
      session,
      term
    });

    res.json({
      success: true,
      comments: aiComments,
      data: aiComments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/exams/batch-generate-ai-comments
 * Auto-generate and persist In-House AI remarks for all students in a class (Teacher / Admin)
 */
router.post('/batch-generate-ai-comments', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { class_id, session = '2026/2027', term = 'First Term', overwrite = false } = req.body;
    if (!class_id) {
      return res.status(400).json({ success: false, message: 'class_id is required' });
    }
    if (!canTeacherAccessWholeClass(req.user, Number(class_id))) {
      return res.status(403).json({ success: false, message: 'Access denied: only the assigned class teacher may generate class-wide report comments.' });
    }

    const students = db.prepare(`
      SELECT s.*, c.name as class_name, c.division
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.class_id = ? AND s.is_active = 1
      ORDER BY s.last_name ASC, s.first_name ASC
    `).all(parseInt(class_id));

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No active students found in this class' });
    }

    const classRanking = getClassRanking(parseInt(class_id), session, term);

    const upsertStmt = db.prepare(`
      INSERT INTO report_extras (
        student_id, session, term, attendance, traits, psychomotor,
        teacher_comment, principal_comment, next_term_resumption,
        promotion_status, template, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'ELITE', CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, session, term) DO UPDATE SET
        teacher_comment = CASE WHEN ? = 1 OR teacher_comment IS NULL OR teacher_comment = '' THEN excluded.teacher_comment ELSE teacher_comment END,
        principal_comment = CASE WHEN ? = 1 OR principal_comment IS NULL OR principal_comment = '' THEN excluded.principal_comment ELSE principal_comment END,
        promotion_status = CASE WHEN ? = 1 OR promotion_status IS NULL OR promotion_status = '' THEN excluded.promotion_status ELSE promotion_status END,
        updated_at = CURRENT_TIMESTAMP
    `);

    let generatedCount = 0;
    const generatedList = [];

    students.forEach(s => {
      const marks = db.prepare(`
        SELECT m.*, sub.name as subject_name, sub.code as subject_code
        FROM marks m
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ? AND m.session = ? AND m.term = ?
      `).all(s.id, session, term);

      const totalObtained = marks.reduce((sum, m) => sum + (m.total_score || 0), 0);
      const average = marks.length > 0 ? parseFloat((totalObtained / marks.length).toFixed(1)) : 0;
      const position = classRanking.ranks.get(s.id) ?? null;

      const aiComments = generateReportCardComments({
        student: s,
        marks,
        average,
        position: position ?? 'unranked pending complete marks',
        classSize: classRanking.rankableCount,
        division: s.division,
        session,
        term
      });

      const defaultAtt = JSON.stringify(emptyAttendance());
      const defaultTraits = JSON.stringify({ politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 });
      const defaultPsych = JSON.stringify({ handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 });

      upsertStmt.run(
        s.id,
        session,
        term,
        defaultAtt,
        defaultTraits,
        defaultPsych,
        aiComments.teacher_comment,
        aiComments.principal_comment,
        aiComments.promotion_status,
        overwrite ? 1 : 0,
        overwrite ? 1 : 0,
        overwrite ? 1 : 0
      );

      generatedCount++;
      generatedList.push({
        student_id: s.id,
        admission_no: s.admission_no,
        name: `${s.first_name} ${s.last_name}`,
        average,
        position,
        teacher_comment: aiComments.teacher_comment,
        principal_comment: aiComments.principal_comment
      });
    });

    logAudit(req.user.id, 'BATCH_AI_REPORT_COMMENTS', 'REPORTS', `Auto-generated AI report card comments for class ID ${class_id} (${generatedCount} students)`, req.ip);

    res.json({
      success: true,
      message: `Successfully generated and saved AI report card remarks for ${generatedCount} students in ${students[0]?.class_name}.`,
      count: generatedCount,
      generated_count: generatedCount,
      skipped_count: 0,
      data: generatedList
    });
  } catch (err) {
    next(err);
  }
});

export default router;
