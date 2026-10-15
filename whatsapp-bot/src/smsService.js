import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust db resolution relative to this source file
const localDbPath = path.resolve(__dirname, "../../server/src/config/db.js");
const bundledDbPath = path.resolve(__dirname, "../server_src/config/db.js");
const dbModule = fs.existsSync(localDbPath) ? localDbPath : bundledDbPath;
const { default: db } = await import(`file://${dbModule.replace(/\\/g, "/")}`);

function calculateGrade(total) {
  if (total >= 75) return { grade: "A1", remark: "Distinction" };
  if (total >= 70) return { grade: "B2", remark: "Very Good" };
  if (total >= 65) return { grade: "B3", remark: "Good" };
  if (total >= 60) return { grade: "C4", remark: "Credit" };
  if (total >= 55) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Pass" };
  if (total >= 45) return { grade: "D7", remark: "Fair Pass" };
  if (total >= 40) return { grade: "E8", remark: "Weak Pass" };
  return { grade: "F9", remark: "Fail" };
}

/**
 * Identify staff member by their phone number or staff number
 */
export function getStaffByPhoneOrNumber(identifier) {
  if (!identifier) return null;
  const clean = identifier.replace(/\D/g, "");
  
  // Try finding by phone or staff_no
  return db
    .prepare(
      `SELECT * FROM staff WHERE REPLACE(REPLACE(phone, '+', ''), ' ', '') LIKE ? OR UPPER(staff_no) = ?`
    )
    .get(`%${clean.slice(-10)}%`, identifier.toUpperCase());
}

/**
 * 1. Clock In / Out
 */
export function recordStaffClockIn(staffId, staffName) {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO staff_attendance (staff_id, date, status, clock_in, recorded_by)
    VALUES (?, ?, 'Present', ?, ?)
    ON CONFLICT(staff_id, date) DO UPDATE SET
      clock_in = COALESCE(clock_in, excluded.clock_in),
      status = 'Present',
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(staffId, today, now, `WhatsApp:${staffName}`);
  return { date: today, time: new Date().toLocaleTimeString() };
}

export function recordStaffClockOut(staffId) {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE staff_attendance
    SET clock_out = ?, updated_at = CURRENT_TIMESTAMP
    WHERE staff_id = ? AND date = ?
  `);

  const res = stmt.run(now, staffId, today);
  return { date: today, time: new Date().toLocaleTimeString(), updated: res.changes > 0 };
}

/**
 * 2. Mark Student Attendance
 */
export function markStudentAttendance(admissionNo, statusInput, recordedBy) {
  const student = db
    .prepare("SELECT * FROM students WHERE UPPER(admission_no) = ?")
    .get(admissionNo.trim().toUpperCase());

  if (!student) {
    return { error: `Student with admission number ${admissionNo} not found.` };
  }

  const statusMap = {
    P: "Present",
    A: "Absent",
    L: "Late",
    H: "Half Day",
    E: "Excused",
  };
  const status = statusMap[statusInput.toUpperCase()] || "Present";
  const today = new Date().toISOString().split("T")[0];

  const stmt = db.prepare(`
    INSERT INTO student_attendance (student_id, class_id, date, status, recorded_by, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, date) DO UPDATE SET
      status = excluded.status,
      recorded_by = excluded.recorded_by,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(student.id, student.class_id, today, status, recordedBy);

  return {
    studentName: `${student.first_name} ${student.last_name}`,
    admissionNo: student.admission_no,
    status,
    date: today,
    guardianPhone: student.guardian_phone,
    guardianName: student.guardian_name,
  };
}

/**
 * 2b. Mark Batch Student Attendance
 * Parses tokens like "001:P 002:A 003:L"
 */
export function markBatchAttendance(tokens, recordedBy) {
  const results = [];
  const errors = [];
  const absentees = [];

  for (const token of tokens) {
    const parts = token.split(":");
    if (parts.length < 2) continue;

    const adm = parts[0].trim();
    const st = parts[1].trim();

    const res = markStudentAttendance(adm, st, recordedBy);
    if (res.error) {
      errors.push(`${adm} (${res.error})`);
    } else {
      results.push(res);
      if (res.status === "Absent") {
        absentees.push(res);
      }
    }
  }

  return {
    total: results.length,
    results,
    errors,
    absentees,
  };
}

/**
 * 3. Record Student Exam/CA Score
 */
export function recordStudentScore(admissionNo, subjectCode, caScore, examScore, session = "2024/2025", term = "Second Term") {
  const student = db
    .prepare("SELECT * FROM students WHERE UPPER(admission_no) = ?")
    .get(admissionNo.trim().toUpperCase());

  if (!student) {
    return { error: `Student with admission number ${admissionNo} not found.` };
  }

  // Find subject by code or partial name
  const subject = db
    .prepare("SELECT * FROM subjects WHERE UPPER(code) = ? OR UPPER(name) LIKE ?")
    .get(subjectCode.trim().toUpperCase(), `%${subjectCode.trim().toUpperCase()}%`);

  if (!subject) {
    return { error: `Subject '${subjectCode}' not found. E.g. MTH, ENG, BIO, CHEM.` };
  }

  const ca = Math.min(30, Math.max(0, parseFloat(caScore) || 0));
  const exam = Math.min(70, Math.max(0, parseFloat(examScore) || 0));
  const total = ca + exam;
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

  stmt.run(student.id, subject.id, session, term, ca, exam, total, grade, remark);

  return {
    studentName: `${student.first_name} ${student.last_name}`,
    admissionNo: student.admission_no,
    subjectName: subject.name,
    ca,
    exam,
    total,
    grade,
    remark,
  };
}

/**
 * 3b. Batch Record Student Scores for a Subject
 * Parses multiple student score entries in one go:
 * Accepts array of tokens or multiline text:
 * Format 1: [ "001:25:55", "002:20:60" ]
 * Format 2: [ "001 25 55", "002 20 60" ]
 */
export function recordBatchScores(subjectCode, entries, session = "2024/2025", term = "Second Term") {
  // Find subject first
  const subject = db
    .prepare("SELECT * FROM subjects WHERE UPPER(code) = ? OR UPPER(name) LIKE ?")
    .get(subjectCode.trim().toUpperCase(), `%${subjectCode.trim().toUpperCase()}%`);

  if (!subject) {
    return { error: `Subject '${subjectCode}' not found. Examples: MTH, ENG, BIO, CHEM, PHY, CRS, LIT.` };
  }

  const results = [];
  const errors = [];

  for (const entry of entries) {
    if (!entry || !entry.trim()) continue;
    // Split by colon, comma, or whitespace: e.g. "EPS-2024-001:25:55" or "EPS-2024-001 25 55" or "001, 25, 55"
    const parts = entry.trim().split(/[:,\s]+/);
    if (parts.length < 3) {
      errors.push(`Invalid line '${entry}'. Expected: <ADM_NO> <CA> <EXAM> (e.g. 001 25 55)`);
      continue;
    }

    const adm = parts[0].trim();
    const ca = parts[1].trim();
    const exam = parts[2].trim();

    const res = recordStudentScore(adm, subject.code, ca, exam, session, term);
    if (res.error) {
      errors.push(`${adm} (${res.error})`);
    } else {
      results.push(res);
    }
  }

  return {
    subjectName: subject.name,
    subjectCode: subject.code,
    total: results.length,
    results,
    errors,
  };
}

/**
 * 4. Get Class Roster
 */
export function getClassRoster(className) {
  const classObj = db
    .prepare("SELECT * FROM classes WHERE UPPER(name) LIKE ?")
    .get(`%${className.trim().toUpperCase()}%`);

  if (!classObj) {
    return { error: `Class '${className}' not found.` };
  }

  const students = db
    .prepare("SELECT admission_no, first_name, last_name FROM students WHERE class_id = ? AND is_active = 1 ORDER BY admission_no ASC")
    .all(classObj.id);

  return { className: classObj.name, students };
}

/**
 * 5. Get Student Bio / Fee Status
 */
export function getStudentSummary(admissionNo) {
  const student = db
    .prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE UPPER(s.admission_no) = ?
    `)
    .get(admissionNo.trim().toUpperCase());

  if (!student) return { error: `Student with admission number ${admissionNo} not found.` };

  const invoices = db
    .prepare("SELECT SUM(amount_due) as total_due, SUM(amount_paid) as total_paid FROM invoices WHERE student_id = ?")
    .get(student.id);

  const due = invoices?.total_due || 0;
  const paid = invoices?.total_paid || 0;
  const balance = Math.max(0, due - paid);

  return {
    admissionNo: student.admission_no,
    name: `${student.first_name} ${student.last_name}`,
    class: student.class_name || "Unassigned",
    guardianName: student.guardian_name || "N/A",
    guardianPhone: student.guardian_phone || "N/A",
    tuitionDue: due,
    tuitionPaid: paid,
    balance: balance,
  };
}

/**
 * 6. User Account Identification via users Table
 */
export function getUserByPhoneOrUsername(identifier) {
  if (!identifier) return null;
  const clean = identifier.replace(/\D/g, "");
  const last10 = clean.slice(-10);

  // 1. Check direct match by username or reference_id
  const directUser = db
    .prepare(`
      SELECT * FROM users 
      WHERE (UPPER(username) = ? OR UPPER(reference_id) = ?) AND is_active = 1
    `)
    .get(identifier.trim().toUpperCase(), identifier.trim().toUpperCase());
  if (directUser) return directUser;

  // 2. If identifier has phone digits, resolve via staff table
  if (last10) {
    const staffMember = db
      .prepare(`
        SELECT * FROM staff 
        WHERE phone IS NOT NULL AND REPLACE(REPLACE(phone, '+', ''), ' ', '') LIKE ? AND is_active = 1
      `)
      .get(`%${last10}%`);

    if (staffMember) {
      const user = db
        .prepare(`
          SELECT * FROM users 
          WHERE (UPPER(username) = ? OR UPPER(reference_id) = ? OR UPPER(username) = ?) AND is_active = 1
        `)
        .get(staffMember.staff_no.toUpperCase(), staffMember.staff_no.toUpperCase(), (staffMember.role || '').toLowerCase());
      if (user) return user;
    }
  }

  return null;
}

/**
 * 7. Front Desk Operations
 */
export function issueVisitorPass({ visitorName, phone, purpose, personToSee, badgeNo }) {
  const passNo = `VP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const stmt = db.prepare(`
    INSERT INTO frontdesk_visitors (pass_no, visitor_name, phone, purpose, person_to_see, badge_no, status, check_in_time)
    VALUES (?, ?, ?, ?, ?, ?, 'In Campus', CURRENT_TIMESTAMP)
  `);
  stmt.run(passNo, visitorName, phone || 'Walk-in', purpose || 'Official Campus Visit', personToSee || 'Principal Desk', badgeNo || 'GATE-PASS');
  return {
    passNo,
    visitorName,
    personToSee: personToSee || 'Principal Desk',
    badgeNo: badgeNo || 'GATE-PASS',
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
}

export function checkoutVisitor(identifier) {
  const clean = (identifier || '').trim();
  const visitor = db.prepare(`
    SELECT * FROM frontdesk_visitors 
    WHERE (UPPER(pass_no) = ? OR UPPER(visitor_name) LIKE ? OR phone LIKE ?) AND status = 'In Campus'
    ORDER BY id DESC LIMIT 1
  `).get(clean.toUpperCase(), `%${clean.toUpperCase()}%`, `%${clean}%`);

  if (!visitor) {
    return { error: `No active campus visitor found matching "${identifier}".` };
  }

  db.prepare(`
    UPDATE frontdesk_visitors 
    SET status = 'Checked Out', check_out_time = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(visitor.id);

  return {
    passNo: visitor.pass_no,
    visitorName: visitor.visitor_name,
    checkInTime: visitor.check_in_time,
    checkOutTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
}

export function getActiveVisitors() {
  return db.prepare(`
    SELECT pass_no, visitor_name, phone, person_to_see, check_in_time, badge_no
    FROM frontdesk_visitors
    WHERE status = 'In Campus'
    ORDER BY id DESC
  `).all();
}

export function logAdmissionEnquiry({ name, phone, classInterested, notes }) {
  const enquiryNo = `ENQ-${Date.now().toString().slice(-5)}`;
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO frontdesk_enquiries (enquiry_no, name, phone, class_interested, enquiry_date, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `).run(enquiryNo, name, phone, classInterested || 'General', today, notes || 'Logged via WhatsApp');
  return { enquiryNo, name, phone, classInterested: classInterested || 'General' };
}

export function logComplaint({ complainantName, phone, complaintType, description }) {
  const complaintNo = `CMP-${Date.now().toString().slice(-5)}`;
  db.prepare(`
    INSERT INTO frontdesk_complaints (complaint_no, complainant_name, complainant_phone, complaint_type, description, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `).run(complaintNo, complainantName, phone || null, complaintType || 'General Feedback', description);
  return { complaintNo, complainantName, complaintType: complaintType || 'General Feedback' };
}

/**
 * 8. Bursary Financial Operations
 */
export function recordBursaryPayment({ invoiceNo, amount, method, reference, recordedBy }) {
  const inv = db.prepare(`
    SELECT i.*, s.first_name, s.last_name, s.admission_no, c.name as class_name 
    FROM invoices i
    JOIN students s ON i.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE UPPER(i.invoice_no) = ? OR UPPER(s.admission_no) = ?
    ORDER BY i.id DESC LIMIT 1
  `).get(invoiceNo.trim().toUpperCase(), invoiceNo.trim().toUpperCase());

  if (!inv) {
    return { error: `Invoice or student record matching "${invoiceNo}" was not found.` };
  }

  const payAmt = Math.min(Number(amount) || 0, Math.max(0, inv.amount_due - inv.amount_paid));
  if (payAmt <= 0) {
    return { error: `Invoice ${inv.invoice_no} is already fully cleared (Balance: ₦0).` };
  }

  const newTotalPaid = inv.amount_paid + payAmt;
  const newStatus = newTotalPaid >= inv.amount_due ? 'Paid' : 'Partial';
  const receiptNo = `RCT-${inv.invoice_no}-${Date.now().toString().slice(-4)}`;

  // Record payment row
  db.prepare(`
    INSERT INTO payments (invoice_id, receipt_no, amount, payment_method, reference, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(inv.id, receiptNo, payAmt, method || 'Bank Transfer', reference || 'WhatsApp Settlement', recordedBy || 'Bursar Bot');

  // Update invoice
  db.prepare(`
    UPDATE invoices 
    SET amount_paid = ?, status = ? 
    WHERE id = ?
  `).run(newTotalPaid, newStatus, inv.id);

  return {
    receiptNo,
    invoiceNo: inv.invoice_no,
    studentName: `${inv.first_name} ${inv.last_name}`,
    admissionNo: inv.admission_no,
    className: inv.class_name,
    amountPaid: payAmt,
    totalPaid: newTotalPaid,
    totalDue: inv.amount_due,
    balance: Math.max(0, inv.amount_due - newTotalPaid),
    status: newStatus
  };
}

export function getDebtorsByClass(className) {
  let query = `
    SELECT s.admission_no, s.first_name, s.last_name, c.name as class_name, 
           s.guardian_name, s.guardian_phone,
           (i.amount_due - i.amount_paid) as balance, i.invoice_no
    FROM invoices i
    JOIN students s ON i.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE i.status != 'Paid' AND (i.amount_due - i.amount_paid) > 0
  `;
  const params = [];
  if (className && className.toLowerCase() !== 'all') {
    query += ` AND UPPER(c.name) LIKE ?`;
    params.push(`%${className.trim().toUpperCase()}%`);
  }
  query += ` ORDER BY balance DESC LIMIT 25`;

  return db.prepare(query).all(...params);
}

export function getTodayCollections() {
  const today = new Date().toISOString().split('T')[0];
  const stats = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE date(payment_date) = date(?)
  `).get(today);

  return {
    date: today,
    count: stats?.count || 0,
    total: stats?.total || 0
  };
}

/**
 * 9. SuperAdmin & System Governance Operations
 */
export function getSystemTelemetry() {
  const pupilsCount = db.prepare(`SELECT COUNT(*) as total FROM students WHERE is_active = 1`).get()?.total || 0;
  const staffCount = db.prepare(`SELECT COUNT(*) as total FROM staff WHERE is_active = 1`).get()?.total || 0;
  const userCount = db.prepare(`SELECT COUNT(*) as total FROM users`).get()?.total || 0;
  const lockedUsers = db.prepare(`SELECT COUNT(*) as total FROM users WHERE is_active = 0`).get()?.total || 0;
  const settings = db.prepare(`SELECT * FROM system_settings WHERE id = 1`).get();

  return {
    pupilsCount,
    staffCount,
    userCount,
    lockedUsers,
    schoolName: settings?.school_name || 'Eagle Power Schools Awka',
    session: settings?.current_session || '2024/2025',
    term: settings?.current_term || 'Second Term',
    isTermLocked: Boolean(settings?.term_locked)
  };
}

export function triggerDbBackup() {
  const backupDir = path.resolve(__dirname, "../../server/backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `eaglepower_backup_${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);

  // Trigger WAL checkpoint
  try {
    db.prepare("PRAGMA wal_checkpoint(TRUNCATE);").run();
  } catch (_e) {}

  // Source db path
  const localDb = path.resolve(__dirname, "../../server/data/eaglepower.db");
  const bundledDb = path.resolve(__dirname, "../server_src/data/eaglepower.db");
  const srcDb = fs.existsSync(localDb) ? localDb : bundledDb;

  fs.copyFileSync(srcDb, backupFilePath);
  const stats = fs.statSync(backupFilePath);

  return {
    fileName: backupFileName,
    sizeKb: Math.round(stats.size / 1024),
    timestamp
  };
}
