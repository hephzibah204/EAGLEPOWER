import express from 'express';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = express.Router();

/**
 * 1. GET /api/reports/executive-summary
 * High-level Cockpit KPIs for School Head
 */
router.get('/executive-summary', (req, res, next) => {
  try {
    const { session = '2024/2025', term = 'Second Term' } = req.query;

    // 1. Enrollment & Students Count
    const studentStats = db.prepare(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female_count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM students
    `).get() || {};

    const staffCount = db.prepare(`SELECT COUNT(*) as count FROM staff WHERE is_active = 1`).get()?.count || 0;
    const classCount = db.prepare(`SELECT COUNT(*) as count FROM classes`).get()?.count || 0;

    // 2. Financial KPIs
    const finStats = db.prepare(`
      SELECT 
        COALESCE(SUM(amount_due), 0) as total_invoiced,
        COALESCE(SUM(amount_paid), 0) as total_collected,
        COALESCE(SUM(amount_due - amount_paid), 0) as outstanding_debt,
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN status = 'Partial' THEN 1 ELSE 0 END) as partial_invoices,
        SUM(CASE WHEN status = 'Unpaid' THEN 1 ELSE 0 END) as unpaid_invoices
      FROM invoices
      WHERE session = ? AND term = ?
    `).get(session, term) || {};

    // Fallback if no invoices match exact term/session
    let totalInvoiced = finStats.total_invoiced || 0;
    let totalCollected = finStats.total_collected || 0;
    let outstandingDebt = finStats.outstanding_debt || 0;

    if (totalInvoiced === 0) {
      const allFin = db.prepare(`
        SELECT 
          COALESCE(SUM(amount_due), 0) as total_invoiced,
          COALESCE(SUM(amount_paid), 0) as total_collected,
          COALESCE(SUM(amount_due - amount_paid), 0) as outstanding_debt,
          COUNT(*) as total_invoices
        FROM invoices
      `).get() || {};
      totalInvoiced = allFin.total_invoiced || 0;
      totalCollected = allFin.total_collected || 0;
      outstandingDebt = allFin.outstanding_debt || 0;
    }

    const collectionRate = totalInvoiced > 0 
      ? Math.round((totalCollected / totalInvoiced) * 100) 
      : 0;

    // 3. Academic Health Index (AHI)
    const marksAgg = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        COALESCE(AVG(total_score), 0) as school_average,
        SUM(CASE WHEN total_score >= 70 THEN 1 ELSE 0 END) as distinctions,
        SUM(CASE WHEN total_score >= 50 AND total_score < 70 THEN 1 ELSE 0 END) as credits,
        SUM(CASE WHEN total_score < 50 THEN 1 ELSE 0 END) as failures
      FROM marks
      WHERE session = ? AND term = ?
    `).get(session, term) || {};

    let totalMarksCount = marksAgg.total_records || 0;
    let schoolAverage = Math.round((marksAgg.school_average || 0) * 10) / 10;
    let distinctions = marksAgg.distinctions || 0;
    let credits = marksAgg.credits || 0;
    let failures = marksAgg.failures || 0;

    // Fallback to all marks if session/term query has zero records
    if (totalMarksCount === 0) {
      const allMarks = db.prepare(`
        SELECT 
          COUNT(*) as total_records,
          COALESCE(AVG(total_score), 0) as school_average,
          SUM(CASE WHEN total_score >= 70 THEN 1 ELSE 0 END) as distinctions,
          SUM(CASE WHEN total_score >= 50 AND total_score < 70 THEN 1 ELSE 0 END) as credits,
          SUM(CASE WHEN total_score < 50 THEN 1 ELSE 0 END) as failures
        FROM marks
      `).get() || {};
      totalMarksCount = allMarks.total_records || 0;
      schoolAverage = Math.round((allMarks.school_average || 0) * 10) / 10;
      distinctions = allMarks.distinctions || 0;
      credits = allMarks.credits || 0;
      failures = allMarks.failures || 0;
    }

    const distinctionRate = totalMarksCount > 0 ? Math.round((distinctions / totalMarksCount) * 100) : 0;
    const passRate = totalMarksCount > 0 ? Math.round(((distinctions + credits) / totalMarksCount) * 100) : 0;
    const failureRate = totalMarksCount > 0 ? Math.round((failures / totalMarksCount) * 100) : 0;

    // 4. Front Desk & Safety Health
    const visitorsInCampus = db.prepare(`
      SELECT COUNT(*) as count FROM frontdesk_visitors WHERE status = 'In Campus'
    `).get()?.count || 0;

    const pendingComplaints = db.prepare(`
      SELECT COUNT(*) as count FROM frontdesk_complaints WHERE status IN ('Pending', 'Investigating')
    `).get()?.count || 0;

    const pendingAdmissions = db.prepare(`
      SELECT COUNT(*) as count FROM admissions WHERE status = 'Under Review'
    `).get()?.count || 0;

    // 5. Automated Early Warning Action Radar
    const alerts = [];

    if (collectionRate < 75) {
      alerts.push({
        id: 'rev-defaulters',
        level: 'critical',
        category: 'Finance',
        title: `Low Tuition Recovery Rate (${collectionRate}%)`,
        description: `Outstanding debt stands at ₦${outstandingDebt.toLocaleString()}. Bursary collection reminders needed.`
      });
    }

    if (failureRate > 20) {
      alerts.push({
        id: 'academic-risk',
        level: 'warning',
        category: 'Academics',
        title: `Academic Failure Threshold Exceeded (${failureRate}%)`,
        description: `${failures} test entries scored below 50%. Review remedial classes with Head of Academics.`
      });
    }

    if (visitorsInCampus > 0) {
      alerts.push({
        id: 'security-visitors',
        level: 'info',
        category: 'Campus Security',
        title: `${visitorsInCampus} Visitors Currently In-Campus`,
        description: `Check visitor log passes to ensure badges are surrendered upon checkout.`
      });
    }

    if (pendingComplaints > 0) {
      alerts.push({
        id: 'complaints-pending',
        level: 'warning',
        category: 'Parent Relations',
        title: `${pendingComplaints} Unresolved Parent Complaint(s)`,
        description: `Urgent parent grievances are pending review. Avoid parent dissatisfaction escalations.`
      });
    }

    if (pendingAdmissions > 0) {
      alerts.push({
        id: 'admissions-pipeline',
        level: 'info',
        category: 'Admissions',
        title: `${pendingAdmissions} New Student Applications Pending Review`,
        description: `Schedule entrance screenings promptly to maintain enrollment conversion velocity.`
      });
    }

    res.json({
      success: true,
      data: {
        session,
        term,
        enrollment: {
          total: studentStats.total_students || 0,
          active: studentStats.active_count || 0,
          male: studentStats.male_count || 0,
          female: studentStats.female_count || 0,
          staff_count: staffCount,
          class_count: classCount,
          teacher_student_ratio: staffCount > 0 ? `1:${Math.round(studentStats.total_students / staffCount)}` : 'N/A'
        },
        financial: {
          total_invoiced: totalInvoiced,
          total_collected: totalCollected,
          outstanding_debt: outstandingDebt,
          collection_rate: collectionRate
        },
        academic: {
          school_average: schoolAverage,
          total_marks_recorded: totalMarksCount,
          distinction_rate: distinctionRate,
          pass_rate: passRate,
          failure_rate: failureRate,
          distinctions,
          credits,
          failures
        },
        operations: {
          visitors_in_campus: visitorsInCampus,
          pending_complaints: pendingComplaints,
          pending_admissions: pendingAdmissions
        },
        alerts
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. GET /api/reports/academic-analytics
 * Deep Academic Intelligence: Class Ranking, Subject Benchmarks, CA Drift
 */
router.get('/academic-analytics', (req, res, next) => {
  try {
    const { session = '2024/2025', term = 'Second Term' } = req.query;

    // A. Class Academic Rankings
    const classPerformance = db.prepare(`
      SELECT 
        c.id as class_id,
        c.name as class_name,
        c.division,
        COUNT(DISTINCT s.id) as enrolled_students,
        COUNT(m.id) as marks_count,
        COALESCE(AVG(m.total_score), 0) as average_score,
        COALESCE(AVG(m.ca_score), 0) as average_ca,
        COALESCE(AVG(m.exam_score), 0) as average_exam,
        SUM(CASE WHEN m.total_score >= 70 THEN 1 ELSE 0 END) as distinction_count,
        SUM(CASE WHEN m.total_score < 50 THEN 1 ELSE 0 END) as failure_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1
      LEFT JOIN marks m ON m.student_id = s.id
      GROUP BY c.id, c.name, c.division
      ORDER BY average_score DESC
    `).all();

    const formattedClasses = classPerformance.map(cls => {
      const avg = Math.round(cls.average_score * 10) / 10;
      const passPct = cls.marks_count > 0 
        ? Math.round(((cls.marks_count - cls.failure_count) / cls.marks_count) * 100) 
        : 100;
      const distPct = cls.marks_count > 0 
        ? Math.round((cls.distinction_count / cls.marks_count) * 100) 
        : 0;

      return {
        class_id: cls.class_id,
        class_name: cls.class_name,
        division: cls.division,
        enrolled_students: cls.enrolled_students,
        marks_recorded: cls.marks_count,
        average_score: avg,
        average_ca: Math.round(cls.average_ca * 10) / 10,
        average_exam: Math.round(cls.average_exam * 10) / 10,
        pass_rate: passPct,
        distinction_rate: distPct,
        health_status: avg >= 70 ? 'Distinction' : avg >= 55 ? 'Good' : avg >= 45 ? 'Fair' : 'At-Risk'
      };
    });

    // B. Subject Performance Leaderboard & Failure Risk
    const subjectPerformance = db.prepare(`
      SELECT 
        sub.id as subject_id,
        sub.name as subject_name,
        sub.code as subject_code,
        sub.division,
        COUNT(m.id) as submissions,
        COALESCE(AVG(m.total_score), 0) as average_score,
        COALESCE(MIN(m.total_score), 0) as min_score,
        COALESCE(MAX(m.total_score), 0) as max_score,
        SUM(CASE WHEN m.total_score >= 70 THEN 1 ELSE 0 END) as distinctions,
        SUM(CASE WHEN m.total_score < 50 THEN 1 ELSE 0 END) as failures
      FROM subjects sub
      LEFT JOIN marks m ON m.subject_id = sub.id
      GROUP BY sub.id, sub.name, sub.code, sub.division
      ORDER BY average_score DESC
    `).all();

    const formattedSubjects = subjectPerformance.map(sb => {
      const avg = Math.round(sb.average_score * 10) / 10;
      const failRate = sb.submissions > 0 ? Math.round((sb.failures / sb.submissions) * 100) : 0;
      return {
        id: sb.subject_id,
        name: sb.subject_name,
        code: sb.subject_code,
        division: sb.division,
        submissions: sb.submissions,
        average_score: avg,
        min_score: sb.min_score,
        max_score: sb.max_score,
        distinctions: sb.distinctions,
        failures: sb.failures,
        failure_rate: failRate,
        risk_level: failRate >= 25 ? 'High Risk' : failRate >= 10 ? 'Moderate' : 'Stable'
      };
    });

    // C. Top 10 Scholars vs Students Requiring Academic Intervention
    const topScholars = db.prepare(`
      SELECT 
        s.id,
        s.admission_no,
        s.first_name || ' ' || s.last_name as student_name,
        c.name as class_name,
        COUNT(m.id) as subjects_taken,
        ROUND(AVG(m.total_score), 1) as gpa_average
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN marks m ON m.student_id = s.id
      GROUP BY s.id, s.admission_no, s.first_name, s.last_name, c.name
      HAVING COUNT(m.id) >= 2
      ORDER BY gpa_average DESC
      LIMIT 10
    `).all();

    const interventionNeeded = db.prepare(`
      SELECT 
        s.id,
        s.admission_no,
        s.first_name || ' ' || s.last_name as student_name,
        c.name as class_name,
        s.guardian_phone,
        COUNT(m.id) as subjects_taken,
        ROUND(AVG(m.total_score), 1) as gpa_average,
        SUM(CASE WHEN m.total_score < 50 THEN 1 ELSE 0 END) as failed_subjects
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN marks m ON m.student_id = s.id
      GROUP BY s.id, s.admission_no, s.first_name, s.last_name, c.name, s.guardian_phone
      HAVING failed_subjects > 0 OR gpa_average < 50
      ORDER BY failed_subjects DESC, gpa_average ASC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      data: {
        classes: formattedClasses,
        subjects: formattedSubjects,
        top_scholars: topScholars,
        intervention_needed: interventionNeeded
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. GET /api/reports/financial-analytics
 * Deep Bursary Intelligence: Debt Aging, Defaulters, Division Contributions
 */
router.get('/financial-analytics', (req, res, next) => {
  try {
    // A. Revenue & Debt by Division
    const divisionRevenue = db.prepare(`
      SELECT 
        c.division,
        COUNT(DISTINCT s.id) as student_count,
        COALESCE(SUM(i.amount_due), 0) as total_invoiced,
        COALESCE(SUM(i.amount_paid), 0) as total_collected,
        COALESCE(SUM(i.amount_due - i.amount_paid), 0) as total_debt
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN invoices i ON i.student_id = s.id
      GROUP BY c.division
    `).all();

    const formattedDivisions = divisionRevenue.map(d => ({
      division: d.division,
      students: d.student_count,
      invoiced: d.total_invoiced,
      collected: d.total_collected,
      debt: d.total_debt,
      collection_rate: d.total_invoiced > 0 
        ? Math.round((d.total_collected / d.total_invoiced) * 100) 
        : 0
    }));

    // B. Defaulters Ledger (Top 15 Unpaid)
    const topDebtors = db.prepare(`
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name || ' ' || s.last_name as student_name,
        c.name as class_name,
        s.guardian_name,
        s.guardian_phone,
        i.invoice_no,
        i.amount_due,
        i.amount_paid,
        (i.amount_due - i.amount_paid) as balance_due,
        i.status
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE (i.amount_due - i.amount_paid) > 0
      ORDER BY balance_due DESC
      LIMIT 15
    `).all();

    // C. Payment Channel Breakdown
    const paymentMethods = db.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `).all();

    res.json({
      success: true,
      data: {
        divisions: formattedDivisions,
        top_debtors: topDebtors,
        payment_methods: paymentMethods
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/reports/operations-safety
 * Campus Safety, Front Desk, Grievances & Audit Trail
 */
router.get('/operations-safety', (req, res, next) => {
  try {
    // A. Visitor Summary
    const visitorStats = db.prepare(`
      SELECT 
        COUNT(*) as total_visitors,
        SUM(CASE WHEN status = 'In Campus' THEN 1 ELSE 0 END) as in_campus,
        SUM(CASE WHEN status = 'Checked Out' THEN 1 ELSE 0 END) as checked_out
      FROM frontdesk_visitors
    `).get() || {};

    const purposeBreakdown = db.prepare(`
      SELECT 
        purpose, 
        COUNT(*) as count 
      FROM frontdesk_visitors 
      GROUP BY purpose 
      ORDER BY count DESC 
      LIMIT 5
    `).all();

    // B. Complaints Summary
    const complaintStats = db.prepare(`
      SELECT 
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Investigating' THEN 1 ELSE 0 END) as investigating,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
      FROM frontdesk_complaints
    `).get() || {};

    const complaintsList = db.prepare(`
      SELECT 
        complaint_no,
        complainant_name,
        complaint_type,
        description,
        status,
        created_at
      FROM frontdesk_complaints
      ORDER BY id DESC
      LIMIT 10
    `).all();

    // C. Recent System Audit Trail Logs
    const recentAudit = db.prepare(`
      SELECT 
        id,
        user_id,
        action,
        entity,
        details,
        timestamp
      FROM audit_logs
      ORDER BY id DESC
      LIMIT 10
    `).all();

    // D. Staff Distribution & Ratios
    const staffList = db.prepare(`
      SELECT 
        staff_no,
        name,
        role,
        qualification,
        assigned_class
      FROM staff
      WHERE is_active = 1
      ORDER BY name ASC
    `).all();

    res.json({
      success: true,
      data: {
        visitors: {
          total: visitorStats.total_visitors || 0,
          in_campus: visitorStats.in_campus || 0,
          checked_out: visitorStats.checked_out || 0,
          purposes: purposeBreakdown
        },
        complaints: {
          total: complaintStats.total_complaints || 0,
          pending: complaintStats.pending || 0,
          investigating: complaintStats.investigating || 0,
          resolved: complaintStats.resolved || 0,
          recent: complaintsList
        },
        audit_trail: recentAudit,
        staff: staffList
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. POST /api/reports/template
 * Set default or student-specific active report card template
 */
router.post('/template', authenticate, (req, res, next) => {
  try {
    const { template, student_id, session = '2024/2025', term = 'Second Term' } = req.body;
    if (!template) {
      return res.status(400).json({ success: false, message: 'Template name is required.' });
    }

    if (student_id) {
      db.prepare(`
        INSERT INTO report_extras (student_id, session, term, template, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, session, term) DO UPDATE SET
          template = excluded.template,
          updated_at = CURRENT_TIMESTAMP
      `).run(student_id, session, term, template);
    } else {
      // Update across all students for the session and term
      db.prepare(`
        UPDATE report_extras 
        SET template = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE session = ? AND term = ?
      `).run(template, session, term);
    }

    res.json({
      success: true,
      message: `Active report card template successfully set to '${template}'.`,
      template
    });
  } catch (err) {
    next(err);
  }
});

export default router;
