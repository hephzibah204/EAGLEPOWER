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
