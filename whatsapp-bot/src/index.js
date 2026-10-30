import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs";
import {
  getStaffByPhoneOrNumber,
  recordStaffClockIn,
  recordStaffClockOut,
  markStudentAttendance,
  markBatchAttendance,
  markClassAllPresent,
  recordStudentScore,
  recordBatchScores,
  getClassRoster,
  getClassRosterForTeacher,
  getClassBroadsheetSummary,
  getStudentSummary,
  getStaffPayslipByPhoneOrNumber,
} from "./smsService.js";
import { processConversationalMessage } from "./aiBrain.js";

const AUTH_DIR = process.env.AUTH_DIR || path.join(process.cwd(), "auth_info");
const PHONE_NUMBER = process.env.PHONE_NUMBER;

// This optional integration requires an end-to-end authorization review.
// Can be enabled with ENABLE_WHATSAPP=true or running in development mode.
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WHATSAPP !== 'true') {
  throw new Error('WhatsApp integration is not production-ready. Complete the authorization and shared-database deployment audit before enabling it. Set ENABLE_WHATSAPP=true to override.');
}

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const logger = pino({ level: process.env.LOG_LEVEL || "warn" });

function formatToWhatsAppJid(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  } else if (digits.length === 10) {
    digits = "234" + digits;
  }
  return digits.length >= 10 ? `${digits}@s.whatsapp.net` : null;
}

let activeSocket = null;
let reconnectTimeout = null;

async function startBot() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (activeSocket) {
    try {
      activeSocket.end();
    } catch (_) {}
    activeSocket = null;
  }

  console.log("⚡ Starting Eagle Power WhatsApp Bot with Teacher Toolkit...");
  console.log(`📁 Auth Directory: ${AUTH_DIR}`);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !PHONE_NUMBER,
    auth: state,
    browser: ["EaglePower Bot", "Chrome", "1.0.0"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });
  activeSocket = sock;

  // Pairing Code Support
  if (PHONE_NUMBER && !sock.authState.creds.registered) {
    console.log(`📱 Requesting pairing code for: ${PHONE_NUMBER}`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER.replace(/\D/g, ""));
        console.log("\n==========================================");
        console.log(`🔑 YOUR WHATSAPP PAIRING CODE: ${code}`);
        console.log("👉 Go to WhatsApp: Linked Devices -> Link with phone number");
        console.log("==========================================\n");
      } catch (err) {
        console.error("Failed to request pairing code:", err);
      }
    }, 3000);
  }

  // Connection handling
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !PHONE_NUMBER) {
      console.log("\nScan QR code using WhatsApp (Linked Devices):");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("🔄 WhatsApp connection closed. Reconnecting in 5s...");
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => startBot(), 5000);
      }
    } else if (connection === "open") {
      console.log(" Connected to WhatsApp successfully!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Incoming Message Processor
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        if (!senderJid || !senderJid.endsWith('@s.whatsapp.net')) continue;

        const textMessage =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          "";

        const senderPhone = senderJid.replace(/@.+/, "");
        const senderName = msg.pushName || "Teacher / Parent";
        const cleanText = textMessage.trim();

        if (!cleanText) continue;

        logger.debug('Received a direct message');

      // 1. HELP / MENU
      if (cleanText.toLowerCase() === "!menu" || cleanText.toLowerCase() === "!help") {
        const menu = 
`🦅 *EAGLE POWER SCHOOLS — TEACHER & PORTAL BOT*

Hello *${senderName}*! Here are your available commands:

👨‍🏫 *1. Teacher Self Attendance:*
• *!clockin* or *!clockin <STAFF_NO>*
  _Records your daily arrival timestamp_
• *!clockout* or *!clockout <STAFF_NO>*
  _Records your departure timestamp_

📋 *2. Student Attendance:*
• *!mark <ADMISSION_NO> <P|A|L|E>*
  _Example:_ '!mark ESE2009012 P' (P=Present, A=Absent, L=Late, E=Excused)
• *!batch <ADM:STATUS> <ADM:STATUS>...*
  _Fast class roll-call:_ '!batch ESE2009012:P 2010134483:A'
• *!class <CLASS_NAME>*
  _View student list for a class (e.g. '!class Primary 4')_

📊 *3. Record Student Exam & CA Scores:*
• *!score <ADMISSION_NO> <SUBJECT> <CA> <EXAM>*
  _Single entry:_ '!score ESE2009012 MTH 25 58'
• *!scores <SUBJECT> <ADM:CA:EXAM> <ADM:CA:EXAM>...*
  _Fast batch entry:_ '!scores MTH ESE2009012:25:58 2010134483:28:64'
• *Multiline entry supported:* Type '!scores MTH' followed by one line per student!
  _Max CA: 30, Max Exam: 70. Auto-computes total, WAEC grade (A1-F9) & remark!_

🔍 *4. Academic & Financial Inquiries:*
• *!student <ADMISSION_NO>* - Student bio, guardian info & tuition status
• *!ping* - Check bot connection
• *!info* - Server system status

📚 *5. Homework & Assignments:*
• *!homework create <Class> | <Subject> | <Task> | <YYYY-MM-DD> | <Concepts>*
  _Assign work directly to class pupils_
• *Submit Homework:* Parents/students can text:
  _"Submitting homework HW-xxx for <ADM_NO>: <Answer/Text>"_ (Instant AI evaluation)

🧠 *6. In-House AI Pedagogical Coaching:*
• Text: _"Give me recommendations for <ADM_NO>"_
  _Generates home action plan, learning gaps radar & attendance impact summary!_

💡 *Natural Human Speech Supported:*
You can talk to me like a human! Try: _"Where is the school located?"_, _"How much is my child owing?"_, _"Good morning, I just arrived in school"_.`;

        await sock.sendMessage(senderJid, { text: menu }, { quoted: msg });
      }

      // 2. TEACHER CLOCK-IN
      else if (cleanText.toLowerCase().startsWith("!clockin")) {
        const parts = cleanText.split(" ");
        const staffNo = parts[1];
        const staff = getStaffByPhoneOrNumber(senderPhone);

        if (!staff) {
          await sock.sendMessage(
            senderJid,
            {
              text: `⚠️ *Clock-in Error:* No active staff profile found matching ${staffNo || senderPhone}. Please message from your registered phone number or provide your official staff ID (e.g. \`!clockin EPS-STF-01\`).`,
            },
            { quoted: msg }
          );
          continue;
        }

        const staffId = staff.id;
        const name = staff.name;
        const result = recordStaffClockIn(staffId, name);

        await sock.sendMessage(
          senderJid,
          {
            text: `✅ *Good Morning, ${name}!* 🏫\n• Date: ${result.date}\n• Clock-in Time: ${result.time}\n• Status: *Present*\nHave an inspiring teaching day!`,
          },
          { quoted: msg }
        );
      }

      // 3. TEACHER CLOCK-OUT
      else if (cleanText.toLowerCase().startsWith("!clockout")) {
        const parts = cleanText.split(/\s+/);
        const staffNo = parts[1];
        const staff = getStaffByPhoneOrNumber(staffNo || senderPhone);

        if (!staff) {
          await sock.sendMessage(
            senderJid,
            {
              text: `⚠️ *Clock-out Error:* No active staff profile found matching ${staffNo || senderPhone}. Please message from your registered phone number.`,
            },
            { quoted: msg }
          );
          continue;
        }

        const staffId = staff.id;
        const name = staff.name;
        const result = recordStaffClockOut(staffId);

        await sock.sendMessage(
          senderJid,
          {
            text: `👋 *Clock-out Recorded for ${name}*\n• Date: ${result.date}\n• Clock-out Time: ${result.time}\nThank you for your service today! Safe journey home.`,
          },
          { quoted: msg }
        );
      }

      // Check Staff Permissions for Teacher Commands
      else if (/^\s*!(mark|batch|allpresent|attend|score|scores|class|myclass|payslip|salary|homework)\b/i.test(cleanText) && !getStaffByPhoneOrNumber(senderPhone)) {
        await sock.sendMessage(
          senderJid,
          {
            text: `⛔ *Access Restricted:*\nThis command is only authorized for registered Eagle Power teachers and administrators. Your phone number (+${senderPhone}) is not recognized in the school staff roster.`
          },
          { quoted: msg }
        );
        continue;
      }

      // 4. MARK STUDENT ATTENDANCE
      else if (cleanText.toLowerCase().startsWith("!mark ")) {
        // Syntax: !mark <admission_no> <P|A|L|E>
        const parts = cleanText.split(/\s+/);
        if (parts.length < 3) {
          await sock.sendMessage(
            senderJid,
            { text: "⚠️ Usage: *!mark <ADMISSION_NO> <P|A|L|E>*\nExample: `!mark EPS-2024-001 P`" },
            { quoted: msg }
          );
          continue;
        }

        const admissionNo = parts[1];
        const statusLetter = parts[2];
        const result = markStudentAttendance(admissionNo, statusLetter, `WhatsApp:${senderName}`);

        if (result.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${result.error}` }, { quoted: msg });
        } else {
          await sock.sendMessage(
            senderJid,
            {
              text: `✅ *Attendance Recorded*\n• Student: *${result.studentName}* (${result.admissionNo})\n• Status: *${result.status}*\n• Date: ${result.date}`,
            },
            { quoted: msg }
          );

          // Automated Parent Alert: If marked Absent, notify parent on WhatsApp if number is on file
          if (result.status === "Absent" && result.guardianPhone) {
            const parentJid = formatToWhatsAppJid(result.guardianPhone);
            if (parentJid) {
              const alertMsg = 
`🔔 *EAGLE POWER SCHOOLS — ATTENDANCE ALERT*

Dear ${result.guardianName || "Parent/Guardian"},
This is to notify you that your child *${result.studentName}* (${result.admissionNo}) was marked *ABSENT* from school today (${result.date}).

If this absence is unexcused, please contact the school administration immediately.
📞 Help Desk: +234 803 709 8816`;

              sock.sendMessage(parentJid, { text: alertMsg }).catch((err) => {
                console.warn(`Could not dispatch parent alert to ${parentJid}:`, err.message);
              });
            }
          }
        }
      }

      // 4b. BATCH ROLL-CALL FOR CLASS (e.g. !batch 001:P 002:A 003:L)
      else if (cleanText.toLowerCase().startsWith("!batch ")) {
        const tokens = cleanText.slice(7).trim().split(/\s+/);
        if (tokens.length === 0 || !tokens[0].includes(":")) {
          await sock.sendMessage(
            senderJid,
            {
              text: "⚠️ Usage: *!batch <ADM_NO:STATUS> <ADM_NO:STATUS>...*\nExample: `!batch EPS-2024-001:P EPS-2024-002:A EPS-2024-003:L`",
            },
            { quoted: msg }
          );
          continue;
        }

        const batchResult = markBatchAttendance(tokens, `WhatsApp:${senderName}`);
        let reply = `📋 *Batch Roll-Call Completed!*\n• Successfully Recorded: *${batchResult.total}* students\n• Absentees: *${batchResult.absentees.length}*`;

        if (batchResult.errors.length > 0) {
          reply += `\n⚠️ Errors:\n• ${batchResult.errors.slice(0, 5).join("\n• ")}`;
        }

        await sock.sendMessage(senderJid, { text: reply }, { quoted: msg });

        // Dispatch alerts for all absentees
        for (const abs of batchResult.absentees) {
          if (abs.guardianPhone) {
            const parentJid = formatToWhatsAppJid(abs.guardianPhone);
            if (parentJid) {
              const alertMsg = 
`🔔 *EAGLE POWER SCHOOLS — ATTENDANCE ALERT*

Dear ${abs.guardianName || "Parent/Guardian"},
Your child *${abs.studentName}* (${abs.admissionNo}) was recorded *ABSENT* today (${abs.date}).
Please contact the school office if you require clarification.`;

              sock.sendMessage(parentJid, { text: alertMsg }).catch(() => {});
            }
          }
        }
      }

      // 4c. ONE-TAP CLASS ATTENDANCE (e.g. !allpresent SS2 or !attend SS2 all)
      else if (cleanText.toLowerCase().startsWith("!allpresent") || cleanText.toLowerCase().startsWith("!attend ")) {
        const staff = getStaffByPhoneOrNumber(senderPhone);
        let targetClass = cleanText.replace(/!allpresent/i, '').replace(/!attend/i, '').replace(/all/i, '').trim();
        
        if (!targetClass && staff) {
          const m = (staff.form_responsibility || staff.assigned_class || '').match(/(SSS?\d|JSS\d|Basic\s*\d|Primary\s*\d|Nursery\s*\d|Pre-Nursery)/i);
          if (m) targetClass = m[1];
        }

        if (!targetClass) {
          await sock.sendMessage(
            senderJid,
            { text: "⚠️ Usage: *!allpresent <CLASS_NAME>*\nExample: `!allpresent SS2` or `!allpresent Primary 4`" },
            { quoted: msg }
          );
          continue;
        }

        const res = markClassAllPresent(targetClass, `WhatsApp:${senderName || staff?.name || 'Teacher'}`);
        if (res.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${res.error}` }, { quoted: msg });
        } else {
          await sock.sendMessage(
            senderJid,
            {
              text: `✅ *Roll-Call Completed for ${res.className}!*
• Date: *${res.date}*
• Total Present: *${res.totalMarked}* pupils
• Confirmed by: *${staff?.name || senderName}*

All students have been recorded as *Present* in the official school database and the EduCore Portal.`
            },
            { quoted: msg }
          );
        }
      }

      // 4d. TEACHER CLASS ROSTER (e.g. !myclass or !students)
      else if (cleanText.toLowerCase() === "!myclass" || cleanText.toLowerCase() === "!students") {
        const res = getClassRosterForTeacher(senderPhone);
        if (res.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${res.error}` }, { quoted: msg });
        } else {
          let list = `📋 *Class Register: ${res.className} (${res.division})*
Teacher: *${res.teacherName}*
Total Pupils: *${res.totalStudents}*

`;
          res.students.forEach((s, idx) => {
            list += `${idx + 1}. *${s.name}* (\`${s.admissionNo}\`)\n   Parent: ${s.phone}\n`;
          });

          await sock.sendMessage(senderJid, { text: list }, { quoted: msg });
        }
      }

      // 4e. TEACHER PAYSLIP INQUIRY (e.g. !payslip or !salary)
      else if (cleanText.toLowerCase() === "!payslip" || cleanText.toLowerCase() === "!salary") {
        const payslip = getStaffPayslipByPhoneOrNumber(senderPhone);
        if (payslip.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${payslip.error}` }, { quoted: msg });
        } else {
          await sock.sendMessage(
            senderJid,
            {
              text: `🦅 *EAGLE POWER SCHOOLS — CONFIDENTIAL PAYSLIP*
• Staff Name: *${payslip.name}*
• Staff ID: \`${payslip.staffNo}\`
• Designation: *${payslip.role}*

💵 *Monthly Pay Breakdown:*
• Basic / Gross Salary: *₦${payslip.grossSalary.toLocaleString()}*
• Deductions / Tax / Pension: *₦0.00*
• *Net Salary Payable:* *₦${payslip.netPayable.toLocaleString()}*

🏦 *Bank Account on File:*
• Bank: *${payslip.bankName}*
• Account No: *${payslip.accountNumber}*
• Account Name: *${payslip.accountName}*
• Status: *${payslip.status}*

_For salary adjustments or account changes, contact the Bursar._`
            },
            { quoted: msg }
          );
        }
      }
      else if (cleanText.toLowerCase().startsWith("!score ")) {
        // Syntax: !score <admission_no> <subject_code> <ca_score> <exam_score>
        const parts = cleanText.split(/\s+/);
        if (parts.length < 5) {
          await sock.sendMessage(
            senderJid,
            {
              text: "⚠️ Usage: *!score <ADMISSION_NO> <SUBJECT_CODE> <CA_SCORE> <EXAM_SCORE>*\nExample: `!score EPS-2024-001 MTH 25 55`\n*(Max CA: 30, Max Exam: 70)*",
            },
            { quoted: msg }
          );
          continue;
        }

        const admissionNo = parts[1];
        const subjectCode = parts[2];
        const ca = parts[3];
        const exam = parts[4];

        const result = recordStudentScore(admissionNo, subjectCode, ca, exam);

        if (result.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${result.error}` }, { quoted: msg });
        } else {
          const reply = 
`🎯 *Score Successfully Recorded!*
• Student: *${result.studentName}* (${result.admissionNo})
• Subject: *${result.subjectName}*
• CA Score: *${result.ca}/30*
• Exam Score: *${result.exam}/70*
• Total: *${result.total}/100*
• Grade: *${result.grade}* (${result.remark})`;

          await sock.sendMessage(senderJid, { text: reply }, { quoted: msg });
        }
      }

      // 5b. BATCH RECORD SCORES FOR A SUBJECT
      // Syntax 1 (Inline): !scores MTH ESE2009012:25:58 2010134483:28:64
      // Syntax 2 (Multiline):
      // !scores MTH
      // ESE2009012 25 58
      // 2010134483 28 64
      else if (cleanText.toLowerCase().startsWith("!scores ") || cleanText.toLowerCase().startsWith("!scores\n")) {
        const lines = cleanText.split("\n").map(l => l.trim()).filter(Boolean);
        const firstLineTokens = lines[0].split(/\s+/);
        const subjectCode = firstLineTokens[1];

        if (!subjectCode) {
          await sock.sendMessage(
            senderJid,
            {
              text: "⚠️ Usage:\n*!scores <SUBJECT> <ADM:CA:EXAM> <ADM:CA:EXAM>...*\n\n_Example (Inline):_\n`!scores MTH ESE2009012:25:58 2010134483:28:64`\n\n_Example (Multiline):_\n`!scores MTH`\n`ESE2009012 25 58`\n`2010134483 28 64`",
            },
            { quoted: msg }
          );
          continue;
        }

        let entries = [];
        if (lines.length > 1) {
          // Multiline format: each line after the first is an entry
          entries = lines.slice(1);
        } else {
          // Inline format: tokens after subjectCode
          entries = firstLineTokens.slice(2);
        }

        if (entries.length === 0) {
          await sock.sendMessage(
            senderJid,
            {
              text: `⚠️ No student marks provided for *${subjectCode}*.\nExample: \`!scores ${subjectCode} ESE2009012:25:58 2010134483:28:64\``,
            },
            { quoted: msg }
          );
          continue;
        }

        const batchResult = recordBatchScores(subjectCode, entries);
        if (batchResult.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${batchResult.error}` }, { quoted: msg });
        } else {
          let summaryReply = `🎯 *Batch Scores Recorded for ${batchResult.subjectName} (${batchResult.subjectCode})!*\n• Successfully Updated: *${batchResult.total}* students\n\n`;
          summaryReply += batchResult.results
            .slice(0, 15)
            .map(r => `• *${r.studentName}* (\`${r.admissionNo}\`): ${r.ca}+${r.exam} = *${r.total}* (${r.grade})`)
            .join("\n");

          if (batchResult.results.length > 15) {
            summaryReply += `\n_...and ${batchResult.results.length - 15} more pupils._`;
          }

          if (batchResult.errors.length > 0) {
            summaryReply += `\n\n⚠️ *Issues encountered (${batchResult.errors.length}):*\n• ${batchResult.errors.slice(0, 5).join("\n• ")}`;
          }

          summaryReply += `\n\n_✅ Master Broadsheets and E-Report Cards have been live updated._`;
          await sock.sendMessage(senderJid, { text: summaryReply }, { quoted: msg });
        }
      }

      // 6. CLASS ROSTER INQUIRY
      else if (cleanText.toLowerCase().startsWith("!class ")) {
        const className = cleanText.slice(7).trim();
        const result = getClassRoster(className);

        if (result.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${result.error}` }, { quoted: msg });
        } else {
          const list = result.students
            .map((s, idx) => `${idx + 1}. \`${s.admission_no}\` - ${s.first_name} ${s.last_name}`)
            .join("\n");

          await sock.sendMessage(
            senderJid,
            {
              text: `📋 *Class Roster: ${result.className}* (${result.students.length} Students)\n\n${list || "No active students in this class."}`,
            },
            { quoted: msg }
          );
        }
      }

      // 6b. CLASS BROADSHEET INQUIRY
      else if (cleanText.toLowerCase().startsWith("!broadsheet ") || cleanText.toLowerCase() === "!broadsheet") {
        const className = cleanText.slice(11).trim() || "SS2";
        const result = getClassBroadsheetSummary(className);

        if (result.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${result.error}` }, { quoted: msg });
        } else if (result.evaluatedCount === 0) {
          await sock.sendMessage(
            senderJid,
            {
              text: `📊 *Eagle Power Academic Broadsheet: ${result.className}*\n• Session: *${result.session}* (${result.term})\n• Total Pupils: *${result.totalPupils}*\n• Status: *No marks recorded yet for this term.*\n\n_Tip: Use \`!score <ADM> <SUBJ> <CA> <EXAM>\` or open Live Score Entry in the Web Portal._`,
            },
            { quoted: msg }
          );
        } else {
          const topList = result.topStudents
            .map((s, idx) => `${idx + 1}. *${s.name}* (\`${s.admissionNo}\`): *${s.average}%* (${s.subjectCount} subjects)`)
            .join("\n");

          await sock.sendMessage(
            senderJid,
            {
              text: `🦅 *EAGLE POWER SCHOOLS — ACADEMIC BROADSHEET*\n🏫 *Class: ${result.className}* (${result.division})\n📅 *Term:* ${result.term}, ${result.session}\n\n📊 *Class Performance:*\n• Evaluated: *${result.evaluatedCount}/${result.totalPupils} Pupils*\n• Class Average: *${result.overallAverage}%*\n• Pass Rate (≥50%): *${result.passRate}%*\n\n🏆 *Top Performers:*\n${topList}\n\n📜 _Full master broadsheet and report cards available on your Web Portal._`,
            },
            { quoted: msg }
          );
        }
      }

      // 7. STUDENT SUMMARY & FEES
      else if (cleanText.toLowerCase().startsWith("!student ")) {
        const admissionNo = cleanText.slice(9).trim();
        const summary = getStudentSummary(admissionNo);

        if (summary.error) {
          await sock.sendMessage(senderJid, { text: `❌ ${summary.error}` }, { quoted: msg });
        } else {
          // Verify identity: caller must be a staff member or the student's registered guardian
          const staff = getStaffByPhoneOrNumber(senderPhone);
          const cleanGuardianPhone = (summary.guardianPhone || '').replace(/\D/g, '');
          const cleanSender = (senderPhone || '').replace(/\D/g, '');
          const isGuardian = Boolean(
            cleanGuardianPhone && cleanSender && 
            (cleanGuardianPhone.includes(cleanSender.slice(-7)) || cleanSender.includes(cleanGuardianPhone.slice(-7)))
          );

          if (!staff && !isGuardian) {
            await sock.sendMessage(
              senderJid,
              {
                text: `🔒 *Access Restricted:*\nStudent academic profiles and financial summaries are private. Only verified teachers and registered guardians may access this information.`
              },
              { quoted: msg }
            );
            continue;
          }

          const text = 
`👤 *Student Profile: ${summary.name}*
• Admission No: \`${summary.admissionNo}\`
• Class: *${summary.class}*
• Guardian: ${summary.guardianName} (${summary.guardianPhone})

💰 *Tuition Summary:*
• Total Billed: ₦${summary.tuitionDue.toLocaleString()}
• Total Paid: ₦${summary.tuitionPaid.toLocaleString()}
• Current Balance: *₦${summary.balance.toLocaleString()}*`;

          await sock.sendMessage(senderJid, { text }, { quoted: msg });
        }
      }

      // 8. PING
      else if (cleanText.toLowerCase() === "!ping") {
        await sock.sendMessage(senderJid, { text: "🏓 Pong! Eagle Power Bot is active." }, { quoted: msg });
      }

      // 9. INFO
      else if (cleanText.toLowerCase() === "!info") {
        const uptime = Math.floor(process.uptime());
        await sock.sendMessage(
          senderJid,
          {
            text: `ℹ️ *Eagle Power SMS Bot*\n• Version: 2.0 (Teacher Suite)\n• SQLite Connected: Yes\n• Uptime: ${uptime}s`,
          },
          { quoted: msg }
        );
      }

      // 10. AI NATURAL LANGUAGE REASONING BRAIN
      // Handles natural conversational inquiries from parents, teachers, and guests
      else {
        try {
          const aiResponse = await processConversationalMessage({
            senderJid,
            senderPhone,
            senderName,
            text: cleanText,
          });

          if (aiResponse) {
            await sock.sendMessage(senderJid, { text: aiResponse }, { quoted: msg });
          }
        } catch (aiErr) {
          console.error("AI Reasoning Error:", aiErr);
          await sock.sendMessage(
            senderJid,
            {
              text: `🦅 *Eagle Power Assistant*: I had a minor difficulty processing that query. Please ask me again, or type *!menu* for quick actions.`,
            },
            { quoted: msg }
          );
        }
      }
    } catch (msgErr) {
        logger.error({ err: msgErr }, "Error processing WhatsApp message");
      }
    }
  });
}

startBot().catch((err) => {
  console.error("Fatal Bot Error:", err);
});
