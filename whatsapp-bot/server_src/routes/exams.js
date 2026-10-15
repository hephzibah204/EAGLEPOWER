import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles, requireStudentAccess } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { generateReportCardComments } from '../services/inHouseAi.js';

const router = express.Router();

function calculateGrade(total) {
  if (total >= 75) return { grade: 'A1', remark: 'Distinction / Excellent' };
  if (total >= 70) return { grade: 'B2', remark: 'Very Good' };
  if (total >= 65) return { grade: 'B3', remark: 'Good' };
  if (total >= 60) return { grade: 'C4', remark: 'Credit' };
  if (total >= 55) return { grade: 'C5', remark: 'Credit' };
  if (total >= 50) return { grade: 'C6', remark: 'Pass' };
  if (total >= 45) return { grade: 'D7', remark: 'Fair Pass' };
  if (total >= 40) return { grade: 'E8', remark: 'Weak Pass' };
  return { grade: 'F9', remark: 'Fail' };
}

/**
 * GET /api/exams/marks/:studentId
 * Marks by student ID (Authenticated & ownership checked)
 */
router.get('/marks/:studentId', authenticate, (req, res, next) => {
  try {
    const { session = '2024/2025', term = 'Second Term' } = req.query;
    const targetStudentId = parseInt(req.params.studentId);

    // Ownership check for student and parent
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM students WHERE UPPER(admission_no) = ?').get((req.user.reference_id || req.user.username).toUpperCase());
      if (!student || student.id !== targetStudentId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own marks.' });
      }
    } else if (req.user.role === 'parent') {
      const cleanUser = (req.user.username || '').replace(/\D/g, '');
      const last10 = cleanUser.length >= 7 ? cleanUser.slice(-10) : '___none___';
      const cleanEmail = (req.user.email || '').trim().toLowerCase();
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

    res.json({
      success: true,
      count: marks.length,
      data: marks
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/class-sheet
 * Teacher Gradebook Class Marks Sheet (Teacher/Admin only)
 */
router.get('/class-sheet', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { class_id, subject_id, session = '2024/2025', term = 'Second Term' } = req.query;

    if (!class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id and subject_id query parameters are required.'
      });
    }

    const rows = db.prepare(`
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        COALESCE(m.ca_score, 0) as ca_score,
        COALESCE(m.exam_score, 0) as exam_score,
        COALESCE(m.total_score, 0) as total_score,
        COALESCE(m.grade, '-') as grade,
        COALESCE(m.remark, 'Pending') as remark
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
router.get('/report-card/:admissionNo', authenticate, (req, res, next) => {
  try {
    const { admissionNo } = req.params;
    const { session = '2024/2025', term = 'Second Term' } = req.query;
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
      const cleanEmail = (req.user.email || '').trim().toLowerCase();
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

    // Compute class ranking
    // Calculate averages of all students in the same class
    const classAverages = db.prepare(`
      SELECT 
        m.student_id,
        AVG(m.total_score) as avg_score
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND m.session = ? AND m.term = ?
      GROUP BY m.student_id
      ORDER BY avg_score DESC
    `).all(student.class_id, session, term);

    const classSize = classAverages.length || 1;
    const studentRankIndex = classAverages.findIndex(row => row.student_id === student.id);
    const position = studentRankIndex !== -1 ? studentRankIndex + 1 : 1;

    // Helper for position suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Retrieve report_extras if any exists
    const extraRow = db.prepare(`
      SELECT * FROM report_extras WHERE student_id = ? AND session = ? AND term = ?
    `).get(student.id, session, term);

    let parsedAttendance = { opened: 120, present: 116, absent: 4 };
    let parsedTraits = { politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 };
    let parsedPsychomotor = { handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 };
    let nextTermResumption = '2025-04-28';
    let chosenTemplate = 'ELITE';

    if (extraRow) {
      try { parsedAttendance = JSON.parse(extraRow.attendance); } catch {}
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
      position,
      classSize,
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

    // Build standard_report format (compatible with edureport-ng report sheet design templates)
    const scoresMap = {};
    marks.forEach(m => {
      const ca1 = Math.round(m.ca_score / 2);
      const ca2 = Math.round(m.ca_score - ca1);
      scoresMap[m.subject_name] = {
        ca1,
        ca2,
        exam: m.exam_score,
        total: m.total_score,
        grade: m.grade,
        remark: m.remark,
        position: getOrdinal(position)
      };
    });

    const standard_report = {
      school: {
        name: 'Eagle Power Schools',
        motto: 'Love, Truth & Service',
        address: '2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State',
        session,
        term,
        principal: 'Dr. (Mrs) N. Okoye',
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
        classSize
      },
      scores: scoresMap,
      extras: {
        attendance: parsedAttendance,
        traits: parsedTraits,
        psychomotor: parsedPsychomotor,
        comments: {
          teacher: customTeacherComment,
          principal: customPrincipalComment
        },
        promotion: promotionStatus,
        nextTermBegins: nextTermResumption
      },
      template: chosenTemplate,
      grades: [
        { grade: 'A1', min: 75, max: 100, remark: 'Distinction' },
        { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
        { grade: 'B3', min: 65, max: 69, remark: 'Good' },
        { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
        { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
        { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
        { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
        { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
        { grade: 'F9', min: 0, max: 39, remark: 'Fail' }
      ]
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
          class_size: classSize,
          distinctions: marks.filter(m => m.grade === 'A1').length,
          credits: marks.filter(m => ['B2', 'B3', 'C4', 'C5', 'C6'].includes(m.grade)).length,
          passes: marks.filter(m => ['D7', 'E8'].includes(m.grade)).length,
          fails: marks.filter(m => m.grade === 'F9').length
        },
        subjects: marks.map(m => ({
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
 */
router.post('/marks', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { student_id, subject_id, session = '2024/2025', term = 'Second Term', ca_score, exam_score } = req.body;

    if (!student_id || !subject_id || ca_score === undefined || exam_score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'student_id, subject_id, ca_score (max 30), and exam_score (max 70) are required.'
      });
    }

    const ca = Math.min(30, Math.max(0, parseFloat(ca_score)));
    const ex = Math.min(70, Math.max(0, parseFloat(exam_score)));
    const total = ca + ex;
    const { grade, remark } = calculateGrade(total);

    const stmt = db.prepare(`
      INSERT INTO marks (student_id, subject_id, session, term, ca_score, exam_score, total_score, grade, remark, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_id, session, term) DO UPDATE SET
        ca_score = excluded.ca_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        grade = excluded.grade,
        remark = excluded.remark,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(student_id, subject_id, session, term, ca, ex, total, grade, remark);

    logAudit(req.user.id, 'RECORD_MARK', 'MARKS', `Recorded mark for student ${student_id}, subject ${subject_id}: ${total}`, req.ip);

    res.json({
      success: true,
      message: 'Mark recorded successfully.',
      result: {
        student_id,
        subject_id,
        ca_score: ca,
        exam_score: ex,
        total_score: total,
        grade,
        remark
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/exams/marks/batch
 * Batch score upload for a class subject
 */
router.post('/marks/batch', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { subject_id, session = '2024/2025', term = 'Second Term', entries } = req.body;

    if (!subject_id || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'subject_id and non-empty entries array are required.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO marks (student_id, subject_id, session, term, ca_score, exam_score, total_score, grade, remark, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_id, session, term) DO UPDATE SET
        ca_score = excluded.ca_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        grade = excluded.grade,
        remark = excluded.remark,
        updated_at = CURRENT_TIMESTAMP
    `);

    let processed = 0;
    const processBatch = db.transaction(() => {
      for (const item of entries) {
        const ca = Math.min(30, Math.max(0, parseFloat(item.ca_score || 0)));
        const ex = Math.min(70, Math.max(0, parseFloat(item.exam_score || 0)));
        const total = ca + ex;
        const { grade, remark } = calculateGrade(total);

        stmt.run(item.student_id, subject_id, session, term, ca, ex, total, grade, remark);
        processed++;
      }
    });
    processBatch();

    logAudit(req.user.id, 'BATCH_MARKS', 'MARKS', `Batch uploaded ${processed} marks for subject ${subject_id}`, req.ip);

    res.json({
      success: true,
      message: `Batch recorded ${processed} marks successfully.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/class-broadsheet
 * Complete Master Broadsheet Matrix for an entire class (Teacher/Admin only)
 */
router.get('/class-broadsheet', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { class_id, session = '2024/2025', term = 'Second Term' } = req.query;

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
      WHERE s.class_id = ? AND m.session = ? AND m.term = ?
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
      WHERE s.class_id = ? AND m.session = ? AND m.term = ?
    `).all(parseInt(class_id), session, term);

    // Group marks by student_id
    const studentMarksMap = {};
    allMarks.forEach(m => {
      if (!studentMarksMap[m.student_id]) studentMarksMap[m.student_id] = {};
      studentMarksMap[m.student_id][m.subject_name] = {
        ca1: Math.round(m.ca_score / 2),
        ca2: Math.round(m.ca_score - Math.round(m.ca_score / 2)),
        ca: m.ca_score,
        exam: m.exam_score,
        total: m.total_score,
        grade: m.grade,
        remark: m.remark
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
      const { grade, remark } = calculateGrade(average);

      return {
        student_id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admission_no: student.admission_no,
        gender: student.gender === 'Female' ? 'F' : 'M',
        subject_totals: subjectTotals,
        scores_detail: studentScores,
        total_score: totalScore,
        average,
        grade,
        remark
      };
    });

    // Calculate rank
    const sorted = [...rows].sort((a, b) => b.average - a.average);
    const rankedRows = rows.map(r => {
      const rank = sorted.findIndex(s => s.average === r.average) + 1;
      const sfx = ['th', 'st', 'nd', 'rd'];
      const v = rank % 100;
      const position = rank + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
      return { ...r, rank, position };
    });

    // Calculate Class Statistics
    const allAverages = rankedRows.filter(r => r.total_score > 0).map(r => r.average);
    const classAvg = allAverages.length > 0 ? parseFloat((allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1)) : 0;
    const highestAvg = allAverages.length > 0 ? Math.max(...allAverages) : 0;
    const lowestAvg = allAverages.length > 0 ? Math.min(...allAverages) : 0;
    const topStudent = rankedRows.find(r => r.average === highestAvg);

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
    const gradeDistribution = { A1: 0, B2: 0, B3: 0, C4: 0, C5: 0, C6: 0, D7: 0, E8: 0, F9: 0 };
    rankedRows.forEach(r => {
      if (gradeDistribution[r.grade] !== undefined) {
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
        graded_count: rankedRows.filter(r => r.total_score > 0).length,
        class_average: classAvg,
        highest_average: highestAvg,
        top_student_name: topStudent ? topStudent.name : 'N/A',
        lowest_average: lowestAvg,
        at_risk_count: rankedRows.filter(r => r.average > 0 && r.average < 50).length,
        distinction_count: rankedRows.filter(r => r.average >= 75).length,
        subject_averages: subjectAverages,
        grade_distribution: gradeDistribution
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/class-reports/:classId
 * Bulk compiled report cards for an entire class (Teacher/Admin only)
 */
router.get('/class-reports/:classId', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { classId } = req.params;
    const { session = '2024/2025', term = 'Second Term' } = req.query;

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
    const classAverages = db.prepare(`
      SELECT m.student_id, AVG(m.total_score) as avg_score
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND m.session = ? AND m.term = ?
      GROUP BY m.student_id
      ORDER BY avg_score DESC
    `).all(parseInt(classId), session, term);

    const getOrdinal = (n) => {
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

      const totalObtained = marks.reduce((sum, m) => sum + (m.total_score || 0), 0);
      const average = marks.length > 0 ? parseFloat((totalObtained / marks.length).toFixed(1)) : 0;
      const rankIndex = classAverages.findIndex(row => row.student_id === student.id);
      const position = rankIndex !== -1 ? rankIndex + 1 : 1;

      const extraRow = db.prepare(`
        SELECT * FROM report_extras WHERE student_id = ? AND session = ? AND term = ?
      `).get(student.id, session, term);

      let parsedAttendance = { opened: 120, present: 116, absent: 4 };
      let parsedTraits = { politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 };
      let parsedPsychomotor = { handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 };
      let nextTermResumption = '2025-04-28';
      let template = 'ELITE';

      if (extraRow) {
        try { parsedAttendance = JSON.parse(extraRow.attendance); } catch {}
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
        classSize: classAverages.length || 1,
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
        const ca1 = Math.round(m.ca_score / 2);
        const ca2 = Math.round(m.ca_score - ca1);
        scoresMap[m.subject_name] = {
          ca1,
          ca2,
          exam: m.exam_score,
          total: m.total_score,
          grade: m.grade,
          remark: m.remark,
          position: getOrdinal(position)
        };
      });

      return {
        school: {
          name: 'Eagle Power Schools',
          motto: 'Love, Truth & Service',
          address: '2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State',
          session,
          term,
          principal: 'Dr. (Mrs) N. Okoye',
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
          classSize: students.length
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
        grades: [
          { grade: 'A1', min: 75, max: 100, remark: 'Distinction' },
          { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
          { grade: 'B3', min: 65, max: 69, remark: 'Good' },
          { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
          { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
          { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
          { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
          { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
          { grade: 'F9', min: 0, max: 39, remark: 'Fail' }
        ]
      };
    });

    res.json({
      success: true,
      class_info: classInfo,
      count: reports.length,
      data: reports
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
      session = '2024/2025',
      term = 'Second Term',
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

    const attStr = typeof attendance === 'object' ? JSON.stringify(attendance) : (attendance || '{"opened":120,"present":116,"absent":4}');
    const traitsStr = typeof traits === 'object' ? JSON.stringify(traits) : (traits || '{}');
    const psychStr = typeof psychomotor === 'object' ? JSON.stringify(psychomotor) : (psychomotor || '{}');

    const stmt = db.prepare(`
      INSERT INTO report_extras (
        student_id, session, term, attendance, traits, psychomotor,
        teacher_comment, principal_comment, next_term_resumption,
        promotion_status, template, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, session, term) DO UPDATE SET
        attendance = excluded.attendance,
        traits = excluded.traits,
        psychomotor = excluded.psychomotor,
        teacher_comment = excluded.teacher_comment,
        principal_comment = excluded.principal_comment,
        next_term_resumption = excluded.next_term_resumption,
        promotion_status = excluded.promotion_status,
        template = excluded.template,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      student_id,
      session,
      term,
      attStr,
      traitsStr,
      psychStr,
      teacher_comment || '',
      principal_comment || '',
      next_term_resumption || '2025-04-28',
      promotion_status || 'PROMOTED TO NEXT CLASS',
      template || 'ELITE'
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
router.post('/generate-ai-comments', authenticate, requireRoles('teacher', 'admin', 'superadmin'), (req, res, next) => {
  try {
    const { student_id, admission_no, session = '2024/2025', term = 'Second Term' } = req.body;
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
    const classAverages = db.prepare(`
      SELECT m.student_id, AVG(m.total_score) as avg_score
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND m.session = ? AND m.term = ?
      GROUP BY m.student_id
      ORDER BY avg_score DESC
    `).all(student.class_id, session, term);

    const rankIndex = classAverages.findIndex(row => row.student_id === student.id);
    const position = rankIndex !== -1 ? rankIndex + 1 : 1;

    // Fetch existing extras if any
    const extraRow = db.prepare(`
      SELECT * FROM report_extras WHERE student_id = ? AND session = ? AND term = ?
    `).get(targetStudentId, session, term);

    let parsedAttendance = { opened: 120, present: 116, absent: 4 };
    let parsedTraits = { politeness: 5, neatness: 5, punctuality: 4, attentiveness: 5, honesty: 5, initiative: 4, selfControl: 5, cooperation: 4 };
    let parsedPsychomotor = { handwriting: 4, fluency: 5, sports: 4, drawing: 4, tools: 4, club: 5 };

    if (extraRow) {
      try { parsedAttendance = JSON.parse(extraRow.attendance); } catch {}
      try { parsedTraits = JSON.parse(extraRow.traits); } catch {}
      try { parsedPsychomotor = JSON.parse(extraRow.psychomotor); } catch {}
    }

    const aiComments = generateReportCardComments({
      student,
      marks,
      average,
      position,
      classSize: classAverages.length || 1,
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
    const { class_id, session = '2024/2025', term = 'Second Term', overwrite = false } = req.body;
    if (!class_id) {
      return res.status(400).json({ success: false, message: 'class_id is required' });
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

    const classAverages = db.prepare(`
      SELECT m.student_id, AVG(m.total_score) as avg_score
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? AND m.session = ? AND m.term = ?
      GROUP BY m.student_id
      ORDER BY avg_score DESC
    `).all(parseInt(class_id), session, term);

    const upsertStmt = db.prepare(`
      INSERT INTO report_extras (
        student_id, session, term, attendance, traits, psychomotor,
        teacher_comment, principal_comment, next_term_resumption,
        promotion_status, template, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2025-04-28', ?, 'ELITE', CURRENT_TIMESTAMP)
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
      const rankIndex = classAverages.findIndex(row => row.student_id === s.id);
      const position = rankIndex !== -1 ? rankIndex + 1 : 1;

      const aiComments = generateReportCardComments({
        student: s,
        marks,
        average,
        position,
        classSize: classAverages.length || 1,
        division: s.division,
        session,
        term
      });

      const defaultAtt = JSON.stringify({ opened: 120, present: 116, absent: 4 });
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
