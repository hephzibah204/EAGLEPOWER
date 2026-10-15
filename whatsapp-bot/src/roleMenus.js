/**
 * Role-Based Interactive Menus & Flow Helpers for Eagle Power Schools WhatsApp Bot
 * Supports: SuperAdmin, Bursar, Front Desk, Principal/Admin, Teachers, Parents, Students, and Guests
 * Users can simply tap numbers (1, 2, 3...) or speak in natural English!
 */

export function buildRoleMenu(session, senderName) {
  const role = session.role || 'guest';
  const title = session.title || senderName || 'Friend';

  switch (role) {
    case 'superadmin':
      return `🦅 *EAGLE POWER SCHOOLS — SUPERADMIN OMNI CONSOLE*
Welcome, *${title}* (SuperAdmin / Executive Director)!
Manage entire institution operations by replying with a *number* or speaking in natural English:

1️⃣ *Campus Pulse & System Telemetry* (e.g. _"System health"_)
2️⃣ *User IAM Directory & Account Lockouts* (e.g. _"Who is locked out?"_)
3️⃣ *Trigger Database WAL Checkpoint & Backup* (e.g. _"Backup database"_)
4️⃣ *WhatsApp School-Wide Broadcaster* (e.g. _"Broadcast: School resumes next Monday"_)
5️⃣ *Academic Session & Term-Lock Governance* (e.g. _"Term status"_)
6️⃣ *Financial Treasury & Payroll Overview* (e.g. _"Treasury summary"_)
7️⃣ *Ask Executive In-House AI Advisor* (e.g. _"Draft term circular for parents"_)
0️⃣ *Logout / Switch Role*

💡 _Tip: Reply with 1 to 7 or type administrative instructions directly._`;

    case 'bursar':
      return `🦅 *EAGLE POWER SCHOOLS — BURSARY & TREASURY DESK*
Welcome, *${title}* (Bursar / Accounts Office)!
Manage school revenue and financial clearance by replying with a *number* or speaking naturally:

1️⃣ *Today's Fee Collections & Revenue* (e.g. _"How much was collected today?"_)
2️⃣ *Outstanding Tuition Debtors by Class* (e.g. _"Debtors in JSS 1"_)
3️⃣ *Verify & Record Fee Payment* (e.g. _"Record payment 45000 for ESE2009012"_)
4️⃣ *Check Student Fee Statement & Clearance* (e.g. _"Fee status for ESE2009012"_)
5️⃣ *Staff Salary & Payroll Status* (e.g. _"Payroll status"_)
6️⃣ *Send Fee Payment Reminder* (e.g. _"Fee reminder for Primary 4"_)
7️⃣ *Official School Bank Accounts* (Moniepoint MFB & Zenith Bank)
0️⃣ *Logout / Switch User*

💡 _Tip: You can instantly reconcile any student or invoice by typing: "Paid 50000 for INV-2025-001"._`;

    case 'frontdesk':
      return `🦅 *EAGLE POWER SCHOOLS — FRONT DESK & RECEPTION*
Hello *${title}*! Welcome to Front Desk & Campus Visitor Control.
Manage security, visitor logs, and parent inquiries by replying with a *number*:

1️⃣ *Issue Official Visitor Security Pass* (e.g. _"Visitor Chief Emeka visiting Principal"_)
2️⃣ *Check-Out Visitor (Log Campus Exit)* (e.g. _"Checkout visitor Emeka"_)
3️⃣ *List Guests Currently on Campus* (e.g. _"Who is in the school right now?"_)
4️⃣ *Log Admission Walk-in Enquiry Lead* (e.g. _"Enquiry: Mrs. Okafor, 08031234567, Primary 2"_)
5️⃣ *Log Official Phone Call or Dispatch* (e.g. _"Log call from Ministry of Education"_)
6️⃣ *Log Parent Complaint or Feedback* (e.g. _"Log complaint from Mr. Eze regarding school bus"_)
7️⃣ *Campus Help Desk & Contact Info*
0️⃣ *Logout / Switch Desk*

💡 _Tip: Simply type "Visitor [Name] seeing [Person]" to auto-issue a digital pass code!_`;

    case 'admin':
      return `🦅 *EAGLE POWER SCHOOLS — PRINCIPAL & ADMIN CONSOLE*
Welcome, *${title}*! Select an administrative workflow by typing its *number* or speaking naturally:

1️⃣ *Staff Attendance Summary Today* (e.g. _"Who clocked in today?"_)
2️⃣ *Student Roll-Call & Absentee Radar* (e.g. _"Who was absent today?"_)
3️⃣ *Bursary Tuition & Revenue Overview* (e.g. _"Fee collection status"_)
4️⃣ *Look Up Any Student File* (e.g. _"Find student Ugochi"_)
5️⃣ *Look Up Staff Record* (e.g. _"Show staff directory"_)
6️⃣ *Academic Broadsheet & Performance* (e.g. _"Class averages for JSS 1"_)
7️⃣ *Ask School AI Executive Assistant* (e.g. _"Draft circular for mid-term break"_)
0️⃣ *Logout*

💡 _Tip: Reply with 1 to 7 or type your question directly in plain English._`;

    case 'teacher':
      return `🦅 *EAGLE POWER SCHOOLS — TEACHER PORTAL*
Hello *${title}*! Choose an action by typing its *number* or just say it in natural words:

1️⃣ *Clock In / Arrival* (e.g. _"I just arrived"_)
2️⃣ *Clock Out / Departure* (e.g. _"Closing for today"_)
3️⃣ *Mark Student Attendance* (e.g. _"Mark Chisom absent today"_)
4️⃣ *Record Test or Exam Scores* (e.g. _"Give Emeka 25 in CA and 60 in Maths"_)
5️⃣ *View My Class Register* (e.g. _"Show me students in Primary 4"_)
6️⃣ *Assign Homework* (e.g. _"Give Primary 4 homework on fractions"_)
7️⃣ *AI Lesson Helper* (e.g. _"Suggest 3 science experiments for Primary 5"_)
0️⃣ *Logout / Switch User*

💡 _Tip: You do NOT need to memorize any codes! Just type the number or speak naturally._`;

    case 'parent':
      const childList = session.profile?.children?.map(c => `${c.first_name} (${c.class_name || 'Class'})`).join(', ') || 'Your Child';
      return `🦅 *EAGLE POWER SCHOOLS — PARENT CONSOLE*
Hello *${title}*! Linked to: *${childList}*
Select an option by replying with its *number* or asking in your own words:

1️⃣ *Check Tuition & Fee Balance* (e.g. _"How much is my child owing?"_)
2️⃣ *Today's School Attendance* (e.g. _"Did my child arrive in school today?"_)
3️⃣ *Report Card & Exam Results* (e.g. _"Show me last term's results"_)
4️⃣ *In-House AI Progress & Coaching* (e.g. _"Where is my child struggling?"_)
5️⃣ *Submit Homework Solution* (e.g. _"Here is homework answer for Chisom"_)
6️⃣ *View Child ID & Academic Profile* (e.g. _"Show my child's profile"_)
7️⃣ *Official School Bank Accounts* (Moniepoint MFB & Zenith Bank)
8️⃣ *School Calendar & Resumption Dates* (e.g. _"When is resumption?"_)
9️⃣ *Contact Principal / School Desk* (e.g. _"I want to speak with the teacher"_)
0️⃣ *Link Another Child / Switch*

💡 _Tip: Type a number (1-9) or just ask me in your regular words!_`;

    case 'student':
      return `🦅 *EAGLE POWER SCHOOLS — STUDENT DESK*
Hello *${title}*! What would you like to check today? Reply with a *number*:

1️⃣ *View My Report Card & Scores* (e.g. _"Show my scores"_)
2️⃣ *My Active Homework & Assignments* (e.g. _"What homework do I have?"_)
3️⃣ *Submit Homework for AI Evaluation* (e.g. _"Submit homework solution"_)
4️⃣ *My Academic Profile & ID Slip* (e.g. _"Show my profile"_)
5️⃣ *AI Study Buddy & Subject Tutor* (e.g. _"Explain quadratic equations to me"_)
6️⃣ *School Calendar & Timetable*
0️⃣ *Sign Out*`;

    case 'guest':
    default:
      return `🦅 *WELCOME TO EAGLE POWER SCHOOLS*
_Citadel of Academic & Moral Excellence • Awka, Anambra State_

Hello *${title}*! How can we assist you today? Reply with a *number* or ask naturally:

1️⃣ *Admission Application & Requirements* (Crèche, Nursery, Primary & College)
2️⃣ *School Location & Campus Directions*
3️⃣ *School Fees Structure & Tuition Guide*
4️⃣ *Parent Login* (e.g. _"My child is ESE2009012"_)
5️⃣ *Teacher / Staff Login* (e.g. _"I am teacher EPS/ST/001"_)
6️⃣ *Speak with Front Desk / Contact Phone*
7️⃣ *About Eagle Power Schools & Facilities*

💬 _You can also just ask any question in plain English, e.g. "Where is the school located?" or "How do I register my 3-year-old?"_`;
  }
}
