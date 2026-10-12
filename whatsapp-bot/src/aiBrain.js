import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  recordStaffClockIn,
  recordStaffClockOut,
  markStudentAttendance,
  markBatchAttendance,
  recordStudentScore,
  getClassRoster,
  getStudentSummary,
  getStaffByPhoneOrNumber,
} from "./smsService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localDbPath = path.resolve(__dirname, "../../server/src/config/db.js");
const bundledDbPath = path.resolve(__dirname, "../server_src/config/db.js");
const dbModule = fs.existsSync(localDbPath) ? localDbPath : bundledDbPath;
const { default: db } = await import(`file://${dbModule.replace(/\\/g, "/")}`);

// In-House AI Intelligence Service
const localAiPath = path.resolve(__dirname, "../../server/src/services/inHouseAi.js");
const bundledAiPath = path.resolve(__dirname, "../server_src/services/inHouseAi.js");
const aiServiceModule = fs.existsSync(localAiPath) ? localAiPath : bundledAiPath;
const { 
  analyzeStudentProgress, 
  generateParentRecommendations, 
  evaluateHomeworkSubmission 
} = await import(`file://${aiServiceModule.replace(/\\/g, "/")}`);

/**
 * In-memory active user sessions keyed by remoteJid
 * Stores: { role: 'parent'|'teacher'|'admin'|'guest', profile: {...}, lastActive: timestamp }
 */
const activeSessions = new Map();

/**
 * 1. SEAMLESS AUTHENTICATION
 * Automatically attempts to detect user identity by sender phone number.
 * Parents are identified via students.guardian_phone.
 * Teachers/Staff are identified via staff.phone.
 * Admins can also authenticate or switch via passcode or direct login.
 */
export function identifyOrAuthenticateUser(senderJid, senderPhone) {
  const cleanPhone = senderPhone.replace(/\D/g, "");
  const last10 = cleanPhone.slice(-10);

  // Check existing session in memory
  if (activeSessions.has(senderJid)) {
    const session = activeSessions.get(senderJid);
    session.lastActive = Date.now();
    return session;
  }

  // 1. Check if Staff / Teacher
  const staff = db
    .prepare(
      `SELECT * FROM staff WHERE REPLACE(REPLACE(phone, '+', ''), ' ', '') LIKE ? AND is_active = 1`
    )
    .get(`%${last10}%`);

  if (staff) {
    const session = {
      role: staff.role?.toLowerCase().includes("principal") || staff.role?.toLowerCase().includes("admin")
        ? "admin"
        : "teacher",
      profile: staff,
      title: staff.name,
      authenticated: true,
      authMethod: "PHONE_AUTO_MATCH",
      lastActive: Date.now(),
    };
    activeSessions.set(senderJid, session);
    return session;
  }

  // 2. Check if Parent (students.guardian_phone)
  const children = db
    .prepare(
      `SELECT s.*, c.name as class_name 
       FROM students s 
       LEFT JOIN classes c ON s.class_id = c.id 
       WHERE REPLACE(REPLACE(s.guardian_phone, '+', ''), ' ', '') LIKE ? AND s.is_active = 1`
    )
    .all(`%${last10}%`);

  if (children.length > 0) {
    const session = {
      role: "parent",
      profile: {
        guardianName: children[0].guardian_name || "Parent",
        children: children,
      },
      title: children[0].guardian_name || "Parent",
      authenticated: true,
      authMethod: "PHONE_AUTO_MATCH",
      lastActive: Date.now(),
    };
    activeSessions.set(senderJid, session);
    return session;
  }

  // 3. Fallback: Guest / Unauthenticated session
  const guestSession = {
    role: "guest",
    profile: null,
    title: "Guest",
    authenticated: false,
    authMethod: null,
    lastActive: Date.now(),
  };
  activeSessions.set(senderJid, guestSession);
  return guestSession;
}

/**
 * Explicit Login or Role Link
 * Allows users whose phone number does not match automatically
 * to say "login as staff EPS-STF-01" or "link student EPS-2024-001" or "login admin password".
 */
export function processSeamlessLogin(senderJid, text, currentSession) {
  const clean = text.trim();

  // Pattern: "my child is ESE2009012" or "link child EPS-2024-001" or "admission number ESE..."
  // Must NOT trigger on teacher commands like "mark ESE2009012 present"
  const isMarkingAttendance = /(mark|score|grade|present|absent|late|ca)/i.test(clean);
  const studentMatch = !isMarkingAttendance && (
    clean.match(/(?:my\s+)?(?:child|ward|student|admission|adm)\s*(?:is|no|number|link)?[:\s]+([A-Za-z0-9\-_\/]+)/i) ||
    clean.match(/^([A-Za-z0-9\-_\/]+)$/i)
  );

  if (studentMatch && !isMarkingAttendance) {
    const adm = (studentMatch[1] || studentMatch[0]).trim().toUpperCase();
    const student = db
      .prepare(`SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE UPPER(s.admission_no) = ?`)
      .get(adm);

    if (student) {
      const session = {
        role: "parent",
        profile: {
          guardianName: student.guardian_name || "Parent",
          children: [student],
        },
        title: student.guardian_name || "Parent",
        authenticated: true,
        authMethod: "MANUAL_STUDENT_LINK",
        lastActive: Date.now(),
      };
      activeSessions.set(senderJid, session);
      return {
        success: true,
        message: `🤝 Welcome, *${student.guardian_name || "Parent"}*! You are now connected to *${student.first_name} ${student.last_name}* (${student.admission_no}, ${student.class_name}). You can now ask about their fees, attendance, report cards, or grades at any time!`,
      };
    }
  }

  // Pattern: "staff ID EPS/ST/001" or "teacher EPS-STF-01" or "I am staff EPS..."
  const staffMatch = clean.match(/(?:staff|teacher|id)\s*(?:no|number|is|am)?[:\s]+([A-Za-z0-9\-_\/]+)/i) ||
                     clean.match(/\b(EPS\/ST\/\d+|EPS-STF-\d+)\b/i);
  if (staffMatch) {
    const rawStaffNo = (staffMatch[1] || staffMatch[0]).trim().toUpperCase();
    // Allow matching both EPS/ST/001 and EPS-ST-001
    const normalizedStaffNo = rawStaffNo.replace(/-/g, "/");
    const staff = db.prepare(`SELECT * FROM staff WHERE (UPPER(staff_no) = ? OR UPPER(staff_no) = ?) AND is_active = 1`).get(rawStaffNo, normalizedStaffNo);
    if (staff) {
      const role = staff.role?.toLowerCase().includes("admin") || staff.role?.toLowerCase().includes("principal")
        ? "admin"
        : "teacher";
      const session = {
        role,
        profile: staff,
        title: staff.name,
        authenticated: true,
        authMethod: "MANUAL_STAFF_LINK",
        lastActive: Date.now(),
      };
      activeSessions.set(senderJid, session);
      return {
        success: true,
        message: `✅ Verified! Welcome, Teacher/Staff *${staff.name}* (${staff.role}). You are securely logged in. You can take attendance, record grades, or clock in/out conversationally.`,
      };
    }
  }

  // Pattern: logout
  if (/^(logout|sign out|switch user|reset session)/i.test(clean)) {
    activeSessions.delete(senderJid);
    return {
      success: true,
      message: `🔒 You have been signed out. To reconnect, simply tell me your staff number or your child's admission number!`,
    };
  }

  return null;
}

/**
 * 2. NATURAL LANGUAGE REASONING & INTENT DISPATCHER
 * Understands conversational human English, Nigerian colloquial phrasing, and typos.
 */
export async function processConversationalMessage({ senderJid, senderPhone, senderName, text }) {
  const cleanText = text.trim();

  // Step 1: Resolve user session & identity
  let session = identifyOrAuthenticateUser(senderJid, senderPhone);

  // Check if this message is a login / link command
  const loginResult = processSeamlessLogin(senderJid, cleanText, session);
  if (loginResult) {
    return loginResult.message;
  }

  // Refresh session in case it just got updated
  session = activeSessions.get(senderJid) || session;

  const lower = cleanText.toLowerCase();

  // ----------------------------------------------------
  // GREETINGS & CASUAL CONVERSATION (Only when no specific action is embedded)
  // ----------------------------------------------------
  const hasSpecificAction = /(arrive|got to school|clock|sign\s*in|sign\s*out|fee|tuition|balance|attendance|present|absent|result|score|mark|roster|where|location)/i.test(lower);
  if (!hasSpecificAction && /^(hello|hi|hey|good morning|good afternoon|good evening|how far|howdy|greetings|kedu|kedu kwanu)\b/i.test(lower)) {
    const greeting = getGreetingTime();
    let intro = `${greeting}! 🦅 Welcome to *Eagle Power Schools* (EduCore AI Assistance).`;
    if (session.authenticated) {
      if (session.role === "parent") {
        const childNames = session.profile.children.map((c) => `${c.first_name} (${c.class_name})`).join(", ");
        intro += `\n\nNice to chat with you, *${session.title}*. I see you are linked to *${childNames}*.\n\nHow can I help you today? You can ask me:\n• _"How is my child doing?"_\n• _"What is my outstanding tuition balance?"_\n• _"Was my child present in school today?"_\n• _"When is school resuming?"_`;
      } else if (session.role === "teacher" || session.role === "admin") {
        intro += `\n\nGood to see you, *${session.title}* (${session.profile.role}).\n\nI can assist you right now with:\n• Clocking in/out (_"Good morning, I just arrived"_, _"Clock me out"_)\n• Marking student attendance (_"Emeka was absent today"_, or batch)\n• Entering scores (_"Give Chisom 24 in CA and 60 in Maths exam"_)\n• Checking class registers (_"Show me Primary 4 students"_)`;
      }
    } else {
      intro += `\n\nI am your intelligent school assistant. You can chat with me naturally!\n\n💡 *Tips:*\n• *Parents:* Tell me your child's admission number (e.g. _"My child is EPS-2024-001"_) to check fees, attendance & results.\n• *Teachers:* Tell me your staff number (e.g. _"I am staff EPS-STF-01"_) to log in.\n• *Visitors:* Ask me anything about our school, location, fees, or admission!`;
    }
    return intro;
  }

  // ----------------------------------------------------
  // SCHOOL PROFILE, ADMISSION & GENERAL INQUIRIES
  // ----------------------------------------------------
  if (/(where is (the )?school|location|address|contact|phone number|principal|admissions?|how to apply|enroll|school fees general|about the school)/i.test(lower)) {
    if (/(location|address|where)/i.test(lower)) {
      return `🏫 *Eagle Power Schools Campus Address:*\n📍 *2 & 9 Amikwo Road, Awka, Awka-South LGA, Anambra State, Nigeria*.\n\n📞 Telephone: *+234 803 542 8910* | *+234 803 709 8816*\n🌐 Web: https://eaglepowerschools.sch.ng\n\nWe provide serene Montessori Nursery, standard Primary, Junior College, and Senior College preparatory education approved by the Anambra State Ministry of Education.`;
    }
    if (/(admission|apply|enroll|register a child|new student)/i.test(lower)) {
      return `📝 *Admissions at Eagle Power Schools:*\nAdmissions are currently ongoing for Crèche, Nursery, Primary, and Junior/Senior Secondary School!\n\n📋 *How to Apply:*\n1. Visit our administrative desk at *2 & 9 Amikwo Road, Awka* or apply online on the school portal.\n2. Pick up an application form (or submit details here).\n3. Prospective pupils undergo friendly entrance placement tests.\n\nWould you like our Admissions Officer to call you directly? Reply with your child's name and intended class!`;
    }
    if (/(contact|phone|call|email)/i.test(lower)) {
      return `📞 *Eagle Power Schools Contact Details:*\n• Phone: *+234 803 542 8910* / *+234 803 709 8816*\n• Campus: *2 & 9 Amikwo Road, Awka, Anambra State*\n• Front Desk Hours: *Monday - Friday, 7:30 AM - 4:30 PM*`;
    }
  }

  // ----------------------------------------------------
  // CLOCK IN / CLOCK OUT (NATURAL LANGUAGE FOR TEACHERS)
  // ----------------------------------------------------
  if (
    /(clock\s*in|sign\s*in|arrive|arrived|just got to school|i am in school|present today|clock\s*out|leaving school|closing for today|sign\s*out)/i.test(
      lower
    )
  ) {
    const isClockOut = /(clock\s*out|leaving|closing|heading home|sign\s*out)/i.test(lower);

    if (session.role !== "teacher" && session.role !== "admin") {
      // Check if user specified a staff ID in text
      const staffMatch = lower.match(/(?:eps-stf-[\w]+|stf-[\w]+)/i);
      if (staffMatch) {
        const staff = getStaffByPhoneOrNumber(staffMatch[0]);
        if (staff) {
          if (isClockOut) {
            const res = recordStaffClockOut(staff.id);
            return `👋 *Clock-out Recorded for ${staff.name}*\n• Date: ${res.date}\n• Time: ${res.time}\nThank you for your dedicated service today!`;
          } else {
            const res = recordStaffClockIn(staff.id, staff.name);
            return `✅ *Clock-in Recorded for ${staff.name}* 🏫\n• Date: ${res.date}\n• Time: ${res.time}\n• Status: *Present*\nHave an inspiring teaching day!`;
          }
        }
      }
      return `⚠️ I could not verify your teacher profile.\nPlease link your staff ID first by replying with: _"I am staff EPS-STF-01"_ or _"!clockin <STAFF_NO>"_.`;
    }

    const staffId = session.profile.id;
    const staffName = session.profile.name;

    if (isClockOut) {
      const res = recordStaffClockOut(staffId);
      return `👋 *Clock-out Recorded for ${staffName}*\n• Date: ${res.date}\n• Time: ${res.time}\nSafe journey home! See you tomorrow.`;
    } else {
      const res = recordStaffClockIn(staffId, staffName);
      return `✅ *Good Morning, ${staffName}!* 🏫\n• Date: ${res.date}\n• Clock-in Time: ${res.time}\n• Status: *Present*\nYour arrival has been recorded in the central staff register!`;
    }
  }

  // ----------------------------------------------------
  // ATTENDANCE INQUIRY / MARKING (NATURAL LANGUAGE)
  // ----------------------------------------------------
  // Parent asking: "Was my child in school today?", "Is Emeka present?"
  if (/(was my child (in school|present|absent)|attendance of|did .* come to school|check attendance)/i.test(lower)) {
    let student = null;
    if (session.role === "parent" && session.profile.children.length > 0) {
      student = session.profile.children[0];
    } else {
      const admMatch = cleanText.match(/(?:eps-[\d]+-[\w]+|[a-z]{3}\d{7})/i);
      if (admMatch) {
        student = db.prepare("SELECT * FROM students WHERE UPPER(admission_no) = ?").get(admMatch[0].toUpperCase());
      }
    }

    if (!student) {
      return `🔍 Please provide your child's admission number (e.g. _"Is EPS-2024-001 present today?"_) so I can check today's register.`;
    }

    const today = new Date().toISOString().split("T")[0];
    const record = db
      .prepare(`SELECT * FROM student_attendance WHERE student_id = ? AND date = ?`)
      .get(student.id, today);

    if (record) {
      return `📋 *Attendance for ${student.first_name} ${student.last_name}* (${student.admission_no})\n• Date: *${today}*\n• Status: *${record.status.toUpperCase()}*\n• Recorded By: ${record.recorded_by || "Class Teacher"}`;
    } else {
      return `ℹ️ No attendance record has been filed yet today for *${student.first_name} ${student.last_name}* (${today}). Morning roll call may still be underway.`;
    }
  }

  // Teacher marking attendance in natural language:
  // e.g. "Mark EPS-2024-001 as absent", "Chisom EPS-2024-002 was present", "Mark absent EPS-2024-003"
  if (/(mark\s+|absent|present|late|excused)/i.test(lower) && /(eps-[\w-]+|[a-z]{3}\d{7})/i.test(cleanText)) {
    const admMatch = cleanText.match(/(?:eps-[\w-]+|[a-z]{3}\d{7})/i);
    const admissionNo = admMatch[0].toUpperCase();

    let statusLetter = "P";
    if (/absent/i.test(lower)) statusLetter = "A";
    else if (/late/i.test(lower)) statusLetter = "L";
    else if (/excuse/i.test(lower)) statusLetter = "E";

    const res = markStudentAttendance(admissionNo, statusLetter, `WhatsApp AI:${session.title}`);
    if (res.error) {
      return `❌ ${res.error}`;
    }

    let response = `✅ *Attendance Recorded via AI:*\n• Student: *${res.studentName}* (\`${res.admissionNo}\`)\n• Status: *${res.status}*\n• Date: ${res.date}`;
    if (res.status === "Absent") {
      response += `\n🔔 _Automated notification has been queued for guardian (${res.guardianPhone || "No phone"})._`;
    }
    return response;
  }

  // ----------------------------------------------------
  // TUITION FEES & FINANCIAL INQUIRIES
  // ----------------------------------------------------
  if (/(fees?|tuition|balance|how much (do i owe|is school fees)|payment|pay|receipt|invoice|bursary)/i.test(lower)) {
    let targetAdm = null;

    // Check if user provided an admission number
    const admMatch = cleanText.match(/(?:eps-[\w-]+|[a-z]{3}\d{7})/i);
    if (admMatch) {
      targetAdm = admMatch[0].toUpperCase();
    } else if (session.role === "parent" && session.profile.children.length > 0) {
      targetAdm = session.profile.children[0].admission_no;
    }

    if (!targetAdm) {
      return `💰 *Eagle Power Schools Bursary Information*\nTermly Tuition Fees:\n• Nursery / Montessori: *₦35,000*\n• Primary School: *₦45,000*\n• Junior College: *₦55,000*\n• Senior College: *₦65,000*\n\nTo check the specific balance for your child, please reply with their admission number, e.g.:\n_"How much is EPS-2024-001 owing?"_`;
    }

    const summary = getStudentSummary(targetAdm);
    if (summary.error) {
      return `❌ ${summary.error}`;
    }

    const balanceFormatted = `₦${summary.balance.toLocaleString()}`;
    const paidFormatted = `₦${summary.tuitionPaid.toLocaleString()}`;
    const dueFormatted = `₦${summary.tuitionDue.toLocaleString()}`;

    let reply = `🎓 *Bursary Tuition Statement*\n• Student: *${summary.name}* (\`${summary.admissionNo}\`)\n• Class: *${summary.class}*\n• Total Billed: *${dueFormatted}*\n• Amount Paid: *${paidFormatted}*\n• Outstanding Balance: *${balanceFormatted}*\n\n`;

    if (summary.balance <= 0) {
      reply += `🎉 *Fully Cleared!* No outstanding fees are due for this academic term. Thank you for your prompt commitment!`;
    } else {
      reply += `🏦 *Payment Methods:*\nBank: *Zenith Bank*\nAccount Name: *Eagle Power Schools*\nAccount No: *1014589230*\n\n_After payment, please submit the bank transaction reference here or to the Bursary desk for official clearance._`;
    }

    return reply;
  }

  // ----------------------------------------------------
  // ACADEMIC RESULTS / SCORES / REPORT CARD
  // ----------------------------------------------------
  // Teacher recording score conversationally:
  // "Record score for EPS-2024-001 MTH 25 60", "Give EPS-2024-002 20 in CA and 50 in ENG"
  // "Record Chisom Okeke Maths CA 28 Exam 62"
  if (/(score|grade|mark|exam|ca)\b/i.test(lower) && /(eps-[\w-]+|[a-z]{3}\d{7}|\d{10}|record|give|award|scored)/i.test(cleanText)) {
    let targetStudent = null;
    const admMatch = cleanText.match(/(?:eps-[\w-]+|[a-z]{3}\d{7}|\b\d{10}\b)/i);
    if (admMatch) {
      targetStudent = db.prepare("SELECT * FROM students WHERE UPPER(admission_no) = ?").get(admMatch[0].toUpperCase());
    }

    // Try finding subject code
    const subMatch = cleanText.match(/\b(mth|math|maths|mathematics|eng|english|bio|biology|chem|chemistry|phy|physics|crs|ict|agric|geo|civic|basic\s*tech|social\s*studies)\b/i);
    // Find numbers (scores)
    const numbers = cleanText.match(/\b\d+(\.\d+)?\b/g);

    // If no admission number found yet, try finding student by name in the teacher's class or general registry
    if (!targetStudent) {
      const words = cleanText.split(/\s+/).filter(w => w.length > 2 && !/^(score|scores|grade|mark|exam|ca|and|for|the|give|record|in|got)$/i.test(w));
      for (const word of words) {
        const found = db.prepare("SELECT * FROM students WHERE (first_name LIKE ? OR last_name LIKE ?) AND is_active = 1 LIMIT 1").get(`%${word}%`, `%${word}%`);
        if (found) {
          targetStudent = found;
          break;
        }
      }
    }

    if (targetStudent && subMatch && numbers && numbers.length >= 2) {
      const subjectCode = subMatch[1].toUpperCase();
      // Pick first two numbers as CA and Exam
      const ca = numbers[0];
      const exam = numbers[1];

      const res = recordStudentScore(targetStudent.admission_no, subjectCode, ca, exam);
      if (res.error) return `❌ ${res.error}`;

      return `🎯 *Score Saved Successfully!*
• Student: *${res.studentName}* (\`${res.admissionNo}\`)
• Subject: *${res.subjectName}*
• CA: *${res.ca}/30* | Exam: *${res.exam}/70*
• Total Score: *${res.total}/100*
• Grade: *${res.grade}* (${res.remark})

_The student's master broadsheet and report card have been live updated._`;
    }
  }

  // Parent or student asking: "How is my child doing?", "Show report card", "Check results"
  if (/(result|report card|grades?|performance|how did .* do|scores?)/i.test(lower)) {
    let targetAdm = null;
    const admMatch = cleanText.match(/(?:eps-[\w-]+|[a-z]{3}\d{7})/i);
    if (admMatch) {
      targetAdm = admMatch[0].toUpperCase();
    } else if (session.role === "parent" && session.profile.children.length > 0) {
      targetAdm = session.profile.children[0].admission_no;
    }

    if (!targetAdm) {
      return `📊 To view academic scores and terminal progress, please specify the admission number:\nExample: _"Show results for EPS-2024-001"_`;
    }

    const student = db.prepare("SELECT * FROM students WHERE UPPER(admission_no) = ?").get(targetAdm);
    if (!student) return `❌ Student with admission number ${targetAdm} not found.`;

    const marks = db
      .prepare(
        `SELECT m.*, sub.name as subject_name 
         FROM marks m 
         JOIN subjects sub ON m.subject_id = sub.id 
         WHERE m.student_id = ? 
         ORDER BY sub.name ASC`
      )
      .all(student.id);

    if (marks.length === 0) {
      return `ℹ️ Marks for *${student.first_name} ${student.last_name}* (\`${student.admission_no}\`) have not been finalized yet for the current term. Please check back shortly!`;
    }

    let report = `📜 *Academic Summary: ${student.first_name} ${student.last_name}*\nAdmission No: \`${student.admission_no}\`\n\n`;
    let totalScoreSum = 0;

    marks.forEach((m, idx) => {
      totalScoreSum += m.total_score;
      report += `${idx + 1}. *${m.subject_name}*: ${m.total_score}/100 [${m.grade}] (${m.remark})\n`;
    });

    const average = (totalScoreSum / marks.length).toFixed(1);
    report += `\n📈 *Subjects Taken:* ${marks.length}\n⭐ *Term Average:* *${average}%*\n\n_Full printable terminal report card is available on the parent portal!_`;
    return report;
  }

  // ----------------------------------------------------
  // IN-HOUSE AI PARENT PROGRESS & RECOMMENDATIONS DOSSIER
  // ----------------------------------------------------
  if (/(recommendation|advice|how to help|progress report|learning gap|weakness|strength|study plan|coaching)/i.test(lower)) {
    let targetAdm = null;
    const admMatch = cleanText.match(/(?:eps-[\w-]+|[a-z]{3}\d{7})/i);
    if (admMatch) {
      targetAdm = admMatch[0].toUpperCase();
    } else if (session.role === "parent" && session.profile.children.length > 0) {
      targetAdm = session.profile.children[0].admission_no;
    }

    if (!targetAdm) {
      return `🦅 *Eagle Power In-House AI Tutor*: To get a tailored academic progress analysis and home coaching plan, please provide your child's admission number:\nExample: _"Give me recommendations for ESE2009012"_`;
    }

    const student = db.prepare("SELECT * FROM students WHERE UPPER(admission_no) = ?").get(targetAdm);
    if (!student) return `❌ Student with admission number ${targetAdm} not found in our registry.`;

    const profile = analyzeStudentProgress(student.id);
    const recs = generateParentRecommendations(student.id);

    let dossier = `🦅 *EAGLE POWER IN-HOUSE AI ACADEMIC DOSSIER*\n`;
    dossier += `👤 *Student:* ${profile.student.name} (\`${profile.student.admission_no}\`)\n`;
    dossier += `🏫 *Class:* ${profile.student.class_name}\n`;
    dossier += `📊 *Term Average:* *${profile.metrics.term_average}%* &bull; *Tier:* *${profile.metrics.readiness_tier}*\n`;
    dossier += `📅 *Attendance Rate:* *${profile.metrics.attendance_rate}%* (${profile.metrics.absent_days} absences)\n`;
    dossier += `📝 *Homework Submitted:* *${profile.metrics.homework_submissions}*\n\n`;

    if (profile.strong_subjects.length > 0) {
      dossier += `⭐ *Key Strengths:*\n`;
      profile.strong_subjects.slice(0, 3).forEach(s => {
        dossier += `• ${s.subject}: ${s.score}% [${s.grade}]\n`;
      });
      dossier += `\n`;
    }

    if (profile.critical_subjects.length > 0) {
      dossier += `⚠️ *Identified Learning Gaps:*\n`;
      profile.critical_subjects.forEach(c => {
        dossier += `• ${c.subject}: ${c.score}% (CA: ${c.ca}/30, Exam: ${c.exam}/70)\n`;
      });
      dossier += `\n`;
    }

    dossier += `💡 *Personalized Home Action Plan (In-House AI):*\n`;
    recs.slice(0, 3).forEach((r, idx) => {
      dossier += `*${idx + 1}. ${r.title}* [${r.urgency} Priority]\n${r.detailed_advice}\n`;
      try {
        const steps = JSON.parse(r.actionable_steps);
        steps.slice(0, 2).forEach(step => {
          dossier += `  👉 _${step}_\n`;
        });
      } catch {}
      dossier += `\n`;
    });

    dossier += `_Powered by Eagle Power In-House Local Educational AI Kernel._`;
    return dossier;
  }

  // ----------------------------------------------------
  // TEACHER ASSIGNING HOMEWORK VIA WHATSAPP
  // ----------------------------------------------------
  if (
    cleanText.toLowerCase().startsWith('!homework') ||
    /(assign|give|create|post)\s+(homework|assignment)/i.test(lower)
  ) {
    if (session.role !== 'teacher' && session.role !== 'admin') {
      // Check if teacher included a staff number in their message e.g. !homework create ... staff:EPS/ST/001
      const staffMatch = cleanText.match(/\b(EPS\/ST\/\d+|EPS-STF-\d+)\b/i);
      if (staffMatch) {
        const staff = db.prepare('SELECT * FROM staff WHERE (UPPER(staff_no) = ? OR UPPER(staff_no) = ?) AND is_active = 1').get(staffMatch[0].toUpperCase(), staffMatch[0].replace(/-/g, '/').toUpperCase());
        if (staff) {
          session.role = 'teacher';
          session.profile = staff;
        }
      } else {
        return `⚠️ *Teacher Authentication Required:*\nTo assign homework, please identify yourself with your staff number first:\nExample: _"I am staff EPS/ST/001"_ or include it in your command: \`!homework create Primary 4 | Mathematics | ... | staff:EPS/ST/001\``;
      }
    }

    // Syntax format: !homework create <Class> | <Subject> | <Title/Questions> | <Due Date YYYY-MM-DD> | <Key Concepts>
    // Or natural pattern: Assign Primary 4 Mathematics: Fractions page 42 due 2026-10-18
    const classMatch = cleanText.match(/(?:primary\s*\d|jss\s*\d|ss\s*\d|nursery\s*\d|creche)/i);
    const dateMatch = cleanText.match(/\b\d{4}-\d{2}-\d{2}\b/);

    if (!classMatch) {
      return `⚠️ *How to Assign Homework Conversationally:*\nPlease specify the class, subject, task, and due date.\n\n*Format:*\n_!homework create <Class> | <Subject> | <Description> | <YYYY-MM-DD> | <Concepts>_\n\n*Example:*\n\`!homework create Primary 4 | Mathematics | Solve exercises 1 to 5 on fractions | 2026-10-18 | denominator, numerator, simplify\``;
    }

    const matchedClassName = classMatch[0].trim();
    const classRecord = db.prepare('SELECT id, name FROM classes WHERE UPPER(name) LIKE ?').get(`%${matchedClassName.toUpperCase()}%`);
    if (!classRecord) return `❌ Class "${matchedClassName}" not found in database.`;

    // Try splitting by pipe or parse description
    const pipeParts = cleanText.split('|').map(p => p.trim());
    let subjectName = 'General Studies';
    let title = 'Class Homework';
    let description = cleanText;
    let dueDate = dateMatch ? dateMatch[0] : new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    let concepts = 'core understanding, neat handwriting';

    if (pipeParts.length >= 4) {
      subjectName = pipeParts[1];
      description = pipeParts[2];
      title = description.slice(0, 40);
      dueDate = pipeParts[3];
      if (pipeParts[4]) concepts = pipeParts[4];
    } else {
      // Natural extraction
      title = `${classRecord.name} Homework`;
    }

    // Resolve subject
    const subjectRecord = db.prepare('SELECT id, name FROM subjects WHERE UPPER(name) LIKE ? OR UPPER(code) LIKE ?').get(
      `%${subjectName.toUpperCase()}%`,
      `%${subjectName.toUpperCase()}%`
    ) || db.prepare('SELECT id, name FROM subjects LIMIT 1').get();

    const teacherId = session.profile?.id || 1;
    const assignmentCode = `HW-${subjectRecord.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const stmt = db.prepare(`
      INSERT INTO homework_assignments 
      (assignment_code, class_id, subject_id, teacher_id, title, description, key_concepts, max_points, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 10, ?, 'Active')
    `);

    stmt.run(
      assignmentCode,
      classRecord.id,
      subjectRecord.id,
      teacherId,
      title,
      description,
      concepts,
      dueDate
    );

    return `📚 *Homework Successfully Assigned!*
• Code: *\`${assignmentCode}\`*
• Class: *${classRecord.name}*
• Subject: *${subjectRecord.name}*
• Due Date: *${dueDate}*
• Task: _${description}_
• Expected Concepts: _${concepts}_

Parents connected to ${classRecord.name} can now submit answers on WhatsApp quoting *\`${assignmentCode}\`*!`;
  }

  // ----------------------------------------------------
  // PARENT/STUDENT SUBMITTING HOMEWORK VIA WHATSAPP (WITH IN-HOUSE AI EVALUATION)
  // ----------------------------------------------------
  if (/(submit|submitting|answer|solution|answers? to|homework for)\s+(hw-|homework|assignment)/i.test(lower) ||
      cleanText.toUpperCase().includes('HW-') && /(here is|answer|submi)/i.test(lower)) {

    // Extract assignment code or resolve student first
    const hwMatch = cleanText.match(/\b(HW-[\w-]+)\b/i);
    const admMatch = cleanText.match(/(?:eps-[\w-]+|[a-z]{3}\d{7})/i);
    let targetAssignment = null;

    if (hwMatch) {
      targetAssignment = db.prepare('SELECT h.*, c.name as class_name, s.name as subject_name FROM homework_assignments h JOIN classes c ON h.class_id = c.id JOIN subjects s ON h.subject_id = s.id WHERE UPPER(h.assignment_code) = ?').get(hwMatch[1].toUpperCase());
    } else {
      // Pick latest active assignment based on student adm no or parent session
      let candidateClassId = null;
      if (admMatch) {
        const studentRow = db.prepare('SELECT class_id FROM students WHERE UPPER(admission_no) = ?').get(admMatch[0].toUpperCase());
        if (studentRow) candidateClassId = studentRow.class_id;
      } else if (session.role === 'parent' && session.profile.children.length > 0) {
        candidateClassId = session.profile.children[0].class_id;
      }

      if (candidateClassId) {
        targetAssignment = db.prepare("SELECT h.*, c.name as class_name, s.name as subject_name FROM homework_assignments h JOIN classes c ON h.class_id = c.id JOIN subjects s ON h.subject_id = s.id WHERE h.class_id = ? AND h.status = 'Active' ORDER BY h.id DESC LIMIT 1").get(candidateClassId);
      }
    }

    if (!targetAssignment) {
      // Check if there are ANY active homework assignments in the school
      targetAssignment = db.prepare("SELECT h.*, c.name as class_name, s.name as subject_name FROM homework_assignments h JOIN classes c ON h.class_id = c.id JOIN subjects s ON h.subject_id = s.id WHERE h.status = 'Active' ORDER BY h.id DESC LIMIT 1").get();
    }

    if (!targetAssignment) {
      return `📝 There are currently no active homework assignments posted for your child's class. Please check back when a teacher assigns new work!`;
    }

    // Resolve Student
    let student = null;
    if (admMatch) {
      student = db.prepare('SELECT * FROM students WHERE UPPER(admission_no) = ?').get(admMatch[0].toUpperCase());
    } else if (session.role === 'parent' && session.profile.children.length > 0) {
      student = session.profile.children[0];
    } else {
      student = db.prepare('SELECT * FROM students WHERE class_id = ? AND is_active = 1 LIMIT 1').get(targetAssignment.class_id);
    }

    if (!student) {
      return `⚠️ Please mention your child's admission number with the submission.\nExample: _"Submitting homework HW-MTH-1234 for ESE2009012: The answer is..."_`;
    }

    // In-House AI Evaluation Kernel
    const aiResult = evaluateHomeworkSubmission({
      assignment: targetAssignment,
      submissionText: cleanText,
      studentName: `${student.first_name} ${student.last_name}`
    });

    const submissionCode = `SUB-WA-${Date.now().toString().slice(-5)}`;

    const stmt = db.prepare(`
      INSERT INTO homework_submissions
      (submission_code, assignment_id, student_id, submitted_by_phone, submission_channel, submission_text, ai_evaluated, ai_score, ai_feedback, status)
      VALUES (?, ?, ?, ?, 'WhatsApp', ?, 1, ?, ?, 'AI_Reviewed')
    `);

    stmt.run(
      submissionCode,
      targetAssignment.id,
      student.id,
      senderPhone,
      cleanText,
      aiResult.score,
      aiResult.feedback
    );

    return `✅ *Homework Received & Evaluated!* 🦅\n
• Submission Ref: *\`${submissionCode}\`*
• Student: *${student.first_name} ${student.last_name}* (\`${student.admission_no}\`)
• Assignment: *${targetAssignment.title}* (${targetAssignment.subject_name})
• In-House AI Score: *${aiResult.score}/${targetAssignment.max_points}* (${Math.round((aiResult.score / targetAssignment.max_points) * 100)}%)

🧠 *Instant Pedagogical Feedback:*
${aiResult.feedback}

_Your submission has been securely recorded. The subject teacher has also received this in the portal._`;
  }

  // ----------------------------------------------------
  // CLASS ROSTER (FOR TEACHERS / ADMINS)
  // ----------------------------------------------------
  if (/(roster|class list|students in|who is in|show me class)/i.test(lower)) {
    const classMatch = cleanText.match(/(?:primary\s*\d|jss\s*\d|ss\s*\d|nursery\s*\d|creche)/i);
    if (classMatch) {
      const res = getClassRoster(classMatch[0]);
      if (res.error) return `❌ ${res.error}`;

      const list = res.students
        .slice(0, 25)
        .map((s, idx) => `${idx + 1}. \`${s.admission_no}\` - ${s.first_name} ${s.last_name}`)
        .join("\n");

      return `📋 *Class Registry: ${res.className}* (${res.students.length} pupils)\n\n${list}${
        res.students.length > 25 ? `\n...and ${res.students.length - 25} more.` : ""
      }`;
    }
  }

  // ----------------------------------------------------
  // RESUMPTION DATES & CALENDAR
  // ----------------------------------------------------
  if (/(calendar|resumption|term starts|term ends|holiday|when is school resuming)/i.test(lower)) {
    return `📅 *Eagle Power Schools Academic Calendar Notice:*\n• Current Term: *Second Term (2024/2025)*\n• Mid-Term Break: *Passed*\n• Examination Period: *Begins late March*\n• Next Term Resumption Date: *Monday, 28th April 2025*\n\nPlease ensure all fees and requirements are settled before the resumption date.`;
  }

  // ----------------------------------------------------
  // DEFAULT HUMAN-LIKE INTELLIGENT FALLBACK
  // ----------------------------------------------------
  let fallback = `🦅 *Eagle Power Schools Assistant*\n\nI hear you, ${session.title}! While I am still learning every variation of human speech, I can understand your requests in plain words.\n\nHere are some things you can say to me:`;

  if (session.role === "teacher" || session.role === "admin") {
    fallback += `\n• _"Good morning, clock me in for today"_\n• _"Was Chisom in school?"_\n• _"Mark EPS-2024-001 absent today"_\n• _"Record score for EPS-2024-001 MTH 25 60"_\n• _"Show me students in Primary 4"_`;
  } else if (session.role === "parent") {
    fallback += `\n• _"What is my child's outstanding fees balance?"_\n• _"Did my child come to school today?"_\n• _"Show my child's report card results"_\n• _"When is the resumption date?"_`;
  } else {
    fallback += `\n• _"Where is the school located?"_\n• _"How can I register my child?"_\n• _"My child is EPS-2024-001" (to log in seamlessly)_\n• _"I am teacher EPS-STF-01" (to link staff ID)_`;
  }

  fallback += `\n\nNeed urgent administrative assistance? Call our desk directly at *+234 803 542 8910*.`;
  return fallback;
}

function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
