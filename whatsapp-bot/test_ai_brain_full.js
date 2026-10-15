import { processConversationalMessage } from "./src/aiBrain.js";
import db from "../server/src/config/db.js";

async function runTestSuite() {
  console.log("🤖 Running Full WhatsApp Bot Multi-Role Automation Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message, response) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      if (response) {
        console.error(`     Got response: ${response.slice(0, 150)}...`);
      }
      failed++;
    }
  }

  // Fetch real staff from DB for testing
  const superadminStaff = db.prepare(`SELECT * FROM staff WHERE role LIKE '%Principal%' OR role LIKE '%Head%' LIMIT 1`).get();
  const bursarStaff = db.prepare(`SELECT * FROM staff WHERE role LIKE '%Bursar%' LIMIT 1`).get();
  const teacherStaff = db.prepare(`SELECT * FROM staff WHERE role LIKE '%Teacher%' LIMIT 1`).get();
  const parentStudent = db.prepare(`SELECT * FROM students WHERE guardian_phone IS NOT NULL AND is_active = 1 LIMIT 1`).get();
  const student = db.prepare(`SELECT * FROM students WHERE is_active = 1 LIMIT 1`).get();

  console.log(`Staff fixtures found:`);
  console.log(`  - Admin/Super: ${superadminStaff?.name} (${superadminStaff?.phone})`);
  console.log(`  - Bursar: ${bursarStaff?.name} (${bursarStaff?.phone})`);
  console.log(`  - Teacher: ${teacherStaff?.name} (${teacherStaff?.phone})`);
  console.log(`  - Parent phone for ward: ${parentStudent?.first_name} (${parentStudent?.guardian_phone})`);
  console.log(`  - Student: ${student?.first_name} (${student?.admission_no})\n`);

  // --- 1. GUEST FLOW ---
  console.log("--- 1. Guest Flow ---");
  let res = await processConversationalMessage({
    senderJid: "guest_1@s.whatsapp.net",
    senderPhone: "2348099999999",
    senderName: "Prospective Parent",
    text: "hello"
  });
  assert(res.includes("Eagle Power") && res.includes("Admission"), "Guest receives public interactive menu", res);

  res = await processConversationalMessage({
    senderJid: "guest_1@s.whatsapp.net",
    senderPhone: "2348099999999",
    senderName: "Prospective Parent",
    text: "1" // Admissions info
  });
  assert(res.includes("Admission") || res.includes("Application"), "Guest option 1 returns admission guidance", res);

  res = await processConversationalMessage({
    senderJid: "guest_1@s.whatsapp.net",
    senderPhone: "2348099999999",
    senderName: "Prospective Parent",
    text: "what are the school bank details?"
  });
  assert(res.includes("Moniepoint") && res.includes("Zenith"), "Guest natural language bank query returns verified accounts", res);

  // --- 2. SUPERADMIN FLOW ---
  console.log("\n--- 2. Superadmin Flow ---");
  // Login superadmin via explicit command
  res = await processConversationalMessage({
    senderJid: "super_1@s.whatsapp.net",
    senderPhone: "2348011112233",
    senderName: "Proprietor",
    text: "login superadmin password123"
  });
  assert(res.includes("SuperAdministrator") || res.includes("Welcome"), "Superadmin login authentication", res);

  res = await processConversationalMessage({
    senderJid: "super_1@s.whatsapp.net",
    senderPhone: "2348011112233",
    senderName: "Proprietor",
    text: "system status"
  });
  assert((res.includes("Executive Telemetry") || res.includes("TELEMETRY")) && (res.includes("Pupils") || res.includes("Active")), "Superadmin natural language telemetry", res);

  res = await processConversationalMessage({
    senderJid: "super_1@s.whatsapp.net",
    senderPhone: "2348011112233",
    senderName: "Proprietor",
    text: "backup database"
  });
  assert((res.includes("Database Snapshot") || res.includes("BACKUP")) && (res.includes("Vault File") || res.includes("backup")), "Superadmin DB snapshot and backup trigger", res);

  res = await processConversationalMessage({
    senderJid: "super_1@s.whatsapp.net",
    senderPhone: "2348011112233",
    senderName: "Proprietor",
    text: "lock term"
  });
  assert(res.includes("Locked") || res.includes("LOCKED"), "Superadmin term lock governance", res);

  res = await processConversationalMessage({
    senderJid: "super_1@s.whatsapp.net",
    senderPhone: "2348011112233",
    senderName: "Proprietor",
    text: "unlock term"
  });
  assert(res.includes("Unlocked") || res.includes("UNLOCKED"), "Superadmin term unlock governance", res);

  res = await processConversationalMessage({
    senderJid: "super_1@s.whatsapp.net",
    senderPhone: "2348011112233",
    senderName: "Proprietor",
    text: "broadcast: Welcome to a productive new academic week!"
  });
  assert(res.includes("Broadcast") && res.includes("productive new academic week"), "Superadmin school-wide broadcast dispatch", res);

  // --- 3. BURSAR FLOW ---
  console.log("\n--- 3. Bursary Flow ---");
  // Login bursar via staff phone or direct login
  const bursarPhone = bursarStaff?.phone ? bursarStaff.phone.replace(/\D/g, "") : "2348023345566";
  res = await processConversationalMessage({
    senderJid: "bursar_1@s.whatsapp.net",
    senderPhone: bursarPhone,
    senderName: bursarStaff?.name || "Bursar",
    text: "menu"
  });
  assert(res.includes("BURSARY & TREASURY DESK") && (res.includes("Collections") || res.includes("Revenue")), "Bursar detected by phone receives treasury menu", res);

  res = await processConversationalMessage({
    senderJid: "bursar_1@s.whatsapp.net",
    senderPhone: bursarPhone,
    senderName: bursarStaff?.name || "Bursar",
    text: "how much did we collect today?"
  });
  assert(res.includes("Collections") || res.includes("₦"), "Bursar queries today's collections via NL", res);

  res = await processConversationalMessage({
    senderJid: "bursar_1@s.whatsapp.net",
    senderPhone: bursarPhone,
    senderName: bursarStaff?.name || "Bursar",
    text: "who is owing in Primary 4?"
  });
  assert(res.includes("Debtors") || res.includes("unpaid balances"), "Bursar queries class debtors list via NL", res);

  res = await processConversationalMessage({
    senderJid: "bursar_1@s.whatsapp.net",
    senderPhone: bursarPhone,
    senderName: bursarStaff?.name || "Bursar",
    text: `record payment 5000 for ${student.admission_no}`
  });
  assert(res.includes("Official Fee Receipt Issued") || res.includes("Receipt No") || res.includes("already fully cleared"), "Bursar conversational payment receipting", res);

  // --- 4. FRONT DESK FLOW ---
  console.log("\n--- 4. Front Desk Flow ---");
  // Switch session to frontdesk
  res = await processConversationalMessage({
    senderJid: "frontdesk_1@s.whatsapp.net",
    senderPhone: "2348077778888",
    senderName: "Receptionist Chioma",
    text: "login as frontdesk"
  });
  assert(res.includes("FRONTDESK") || res.includes("Front Desk") || res.includes("Reception"), "Front Desk role login", res);

  res = await processConversationalMessage({
    senderJid: "frontdesk_1@s.whatsapp.net",
    senderPhone: "2348077778888",
    senderName: "Receptionist Chioma",
    text: "visitor Chief Emeka visiting Principal Desk"
  });
  assert(res.includes("Pass Issued") && res.includes("Chief Emeka"), "Front Desk visitor pass issuance via NL", res);

  res = await processConversationalMessage({
    senderJid: "frontdesk_1@s.whatsapp.net",
    senderPhone: "2348077778888",
    senderName: "Receptionist Chioma",
    text: "who is in campus?"
  });
  assert(res.includes("Guests Currently on Campus") && res.includes("Chief Emeka"), "Front Desk inspects active campus visitors", res);

  res = await processConversationalMessage({
    senderJid: "frontdesk_1@s.whatsapp.net",
    senderPhone: "2348077778888",
    senderName: "Receptionist Chioma",
    text: "checkout visitor Emeka"
  });
  assert(res.includes("Departure Logged") && res.includes("Chief Emeka"), "Front Desk visitor checkout via NL", res);

  res = await processConversationalMessage({
    senderJid: "frontdesk_1@s.whatsapp.net",
    senderPhone: "2348077778888",
    senderName: "Receptionist Chioma",
    text: "enquiry Mrs Okonkwo phone 08031234567 asking about JSS1 fees"
  });
  assert(res.includes("Enquiry Logged") && res.includes("Mrs Okonkwo"), "Front Desk admission enquiry intake via NL", res);

  // --- 5. TEACHER FLOW ---
  console.log("\n--- 5. Teacher Flow ---");
  const teacherPhone = teacherStaff?.phone ? teacherStaff.phone.replace(/\D/g, "") : "2348067788990";
  res = await processConversationalMessage({
    senderJid: "teacher_1@s.whatsapp.net",
    senderPhone: teacherPhone,
    senderName: teacherStaff?.name || "Teacher",
    text: "clock in"
  });
  assert(res.includes("Good Morning") || res.includes("Clocked In") || res.includes("Present"), "Teacher clock-in via NL", res);

  res = await processConversationalMessage({
    senderJid: "teacher_1@s.whatsapp.net",
    senderPhone: teacherPhone,
    senderName: teacherStaff?.name || "Teacher",
    text: `mark ${student.admission_no} present`
  });
  assert(res.includes("Attendance Recorded") && res.includes("Present"), "Teacher mark single attendance via NL", res);

  // --- 6. PARENT FLOW ---
  console.log("\n--- 6. Parent Flow ---");
  const parentPhone = parentStudent?.guardian_phone ? parentStudent.guardian_phone.replace(/\D/g, "") : "2348033591058";
  res = await processConversationalMessage({
    senderJid: "parent_1@s.whatsapp.net",
    senderPhone: parentPhone,
    senderName: parentStudent?.guardian_name || "Mr Parent",
    text: "menu"
  });
  assert(res.includes("PARENT CONSOLE") || res.includes("Ward"), "Parent auto-detected by guardian phone receives parent menu", res);

  res = await processConversationalMessage({
    senderJid: "parent_1@s.whatsapp.net",
    senderPhone: parentPhone,
    senderName: parentStudent?.guardian_name || "Mr Parent",
    text: "my ward id"
  });
  assert(res.includes("STUDENT IDENTITY SLIP") || res.includes(parentStudent?.first_name || ""), "Parent queries ward ID slip and profile", res);

  // --- 7. STUDENT FLOW ---
  console.log("\n--- 7. Student Flow ---");
  res = await processConversationalMessage({
    senderJid: "student_1@s.whatsapp.net",
    senderPhone: "2348000000001",
    senderName: "Student",
    text: `my admission number is ${student.admission_no}`
  });
  assert(res.includes("Linked") || res.includes(student.first_name), "Student links by admission number", res);

  res = await processConversationalMessage({
    senderJid: "student_1@s.whatsapp.net",
    senderPhone: "2348000000001",
    senderName: "Student",
    text: "my profile"
  });
  assert(res.includes("STUDENT IDENTITY SLIP") && res.includes(student.first_name), "Student queries ID and academic profile", res);

  console.log(`\n========================================`);
  console.log(`🎯 Multi-Role WhatsApp Suite: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
