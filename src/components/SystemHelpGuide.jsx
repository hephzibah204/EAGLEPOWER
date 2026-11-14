import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Award, 
  FileSpreadsheet, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Printer, 
  Phone, 
  MessageCircle, 
  Sparkles, 
  Clock, 
  KeyRound, 
  CreditCard, 
  AlertCircle, 
  Info, 
  ExternalLink, 
  Layers, 
  Settings, 
  School,
  Check,
  Copy,
  BookMarked,
  UserCheck,
  Zap,
  TrendingUp,
  FileText,
  Building2,
  Landmark,
  Shield,
  QrCode,
  PenTool,
  ArrowUpRight,
  Eye,
  Hash,
  UserPlus,
  FolderCheck,
  CheckSquare,
  PhoneCall,
  MessageSquare,
  DollarSign
} from 'lucide-react';

export default function SystemHelpGuide({ isStandalone = false, onNavigateTab = null, currentUser = null }) {
  const [activeRoleTab, setActiveRoleTab] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');
  const [expandedSection, setExpandedSection] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // 36 Official School Subjects Directory
  const masterSubjects = [
    { code: 'MTH', name: 'Mathematics', division: 'All Divisions', category: 'Core' },
    { code: 'ENG', name: 'English Language', division: 'All Divisions', category: 'Core' },
    { code: 'BST', name: 'Basic Science & Technology', division: 'Primary', category: 'Core' },
    { code: 'HIS', name: 'History', division: 'Primary', category: 'Core' },
    { code: 'WRT', name: 'Writing & Penmanship', division: 'Primary', category: 'Core' },
    { code: 'CVE', name: 'Civic Education', division: 'All Divisions', category: 'Core' },
    { code: 'SOS', name: 'Social Studies', division: 'Primary', category: 'General' },
    { code: 'CRS', name: 'Christian Religious Studies', division: 'All Divisions', category: 'Moral' },
    { code: 'IGB', name: 'Igbo Language & Culture', division: 'All Divisions', category: 'Language' },
    { code: 'AIGB', name: 'Asụsụ Igbo', division: 'All Divisions', category: 'Core Language' },
    { code: 'AGR', name: 'Agricultural Science', division: 'All Divisions', category: 'Practical' },
    { code: 'ICT', name: 'Computer Studies / ICT', division: 'All Divisions', category: 'Vocational' },
    { code: 'DTECH', name: 'Digital Technology', division: 'Junior College', category: 'Core' },
    { code: 'PHE', name: 'Physical & Health Education', division: 'All Divisions', category: 'Practical' },
    { code: 'DIC', name: 'Diction & Phonetics', division: 'All Divisions', category: 'Specialized' },
    { code: 'CCA', name: 'Cultural & Creative Arts', division: 'Primary', category: 'Creative' },
    { code: 'VART', name: 'Visual Art', division: 'All Divisions', category: 'Elective' },
    { code: 'BUS', name: 'Business Studies', division: 'Junior College', category: 'Commercial' },
    { code: 'FRN', name: 'French Language', division: 'Junior College', category: 'Language' },
    { code: 'HEC', name: 'Home Economics', division: 'Junior College', category: 'Vocational' },
    { code: 'ISC', name: 'Intermediate Science', division: 'Junior College', category: 'Core' },
    { code: 'PVS', name: 'Pre-Vocational Studies (PVS)', division: 'Junior College', category: 'Core' },
    { code: 'PHY', name: 'Physics', division: 'Senior College', category: 'Science' },
    { code: 'CHM', name: 'Chemistry', division: 'Senior College', category: 'Science' },
    { code: 'BIO', name: 'Biology', division: 'Senior College', category: 'Science' },
    { code: 'FMTH', name: 'Further Mathematics', division: 'Senior College', category: 'Science' },
    { code: 'TD', name: 'Technical Drawing', division: 'Senior College', category: 'Technical' },
    { code: 'ECN', name: 'Economics', division: 'Senior College', category: 'Commercial' },
    { code: 'COM', name: 'Commerce', division: 'Senior College', category: 'Commercial' },
    { code: 'ACC', name: 'Financial Accounting', division: 'Senior College', category: 'Commercial' },
    { code: 'GOV', name: 'Government', division: 'Senior College', category: 'Arts & Humanities' },
    { code: 'LIT', name: 'Literature in English', division: 'Senior College', category: 'Arts & Humanities' },
    { code: 'GEO', name: 'Geography', division: 'Senior College', category: 'Elective' },
    { code: 'MKT', name: 'Marketing', division: 'Senior College', category: 'Elective' },
    { code: 'QR', name: 'Quantitative Reasoning', division: 'Primary', category: 'Reasoning' },
    { code: 'VR', name: 'Verbal Reasoning', division: 'Primary', category: 'Reasoning' }
  ];

  // Comprehensive Guide Modules
  const guideData = {
    admin: {
      roleTitle: 'Administrators & SuperAdmins',
      roleBadge: '👑 Master Institutional Control',
      description: 'The complete administrative manual for School Proprietors, Principals, and Head Teachers. Covers student admissions, curriculum setup, class structures, 20/20/60 vs 30/70 scoring governance, 4 report card templates, class broadsheets, staff IAM, and system audits.',
      quickLinks: [
        { label: 'Enrolling Students', id: 'admin-students', tab: 'students', topic: 'students' },
        { label: 'Managing 36 Subjects', id: 'admin-subjects', tab: 'classes', topic: 'curriculum' },
        { label: 'Classes & Form Teachers', id: 'admin-classes', tab: 'classes', topic: 'classes' },
        { label: 'Scoring Schemes (20/20/60 vs 30/70)', id: 'admin-scores', tab: 'gradebook', topic: 'scores' },
        { label: 'Report Cards & Approvals', id: 'admin-reports', tab: 'reportcard', topic: 'reports' },
        { label: 'Master Broadsheets & Ranks', id: 'admin-broadsheet', tab: 'broadsheet', topic: 'broadsheet' },
        { label: 'Staff IAM & ID Cards', id: 'admin-staff', tab: 'staff', topic: 'staff' },
        { label: 'Session & Term Transitions', id: 'admin-sessions', tab: 'system_settings', topic: 'sessions' },
        { label: 'Security & Audit Logs', id: 'admin-security', tab: 'audit', topic: 'security' }
      ],
      sections: [
        {
          id: 'admin-students',
          topic: 'students',
          title: '1. Enrolling & Managing Students',
          icon: UserPlus,
          summary: 'Registering new scholars, generating admission numbers, capturing WhatsApp contacts, managing active status, and class reallocations.',
          steps: [
            {
              step: 'Step 1: Open the Students Directory',
              detail: 'From the main navigation sidebar, select "Academics" > "Students Directory" (or click "Students Directory" button). This presents the unified institutional directory of all 379 scholars.',
              badge: 'Sidebar > Students'
            },
            {
              step: 'Step 2: Launch Registration Form',
              detail: 'Click the gold "+ Enroll New Student" button located at the top-right above the search filter. A comprehensive registration modal appears.',
              badge: 'Modal Action'
            },
            {
              step: 'Step 3: Capture Complete Bio-Data',
              detail: 'Enter Student Full Name (First & Last name), Gender (Male / Female), Date of Birth, Blood Group (A+, O+, B+, etc.), Genotype (AA, AS), and physical home address. Ensure the admission number matches the serialized Eagle Power format (e.g. EPS-2026-0142).',
              badge: 'Essential Bio-Data'
            },
            {
              step: 'Step 4: Enter Active Guardian WhatsApp Contact',
              detail: 'Provide Guardian Full Name and active Phone Number (e.g. 0803XXXXXXX). Crucial: This phone number powers 1-click WhatsApp parent direct messaging and automated end-of-term report card delivery.',
              badge: 'WhatsApp Enabled'
            },
            {
              step: 'Step 5: Allocate Class & Section',
              detail: 'Assign the student to their designated classroom (e.g., JSS 2, Primary 4, or SSS 1 Science). Once saved, the pupil immediately populates the class attendance roll-call, gradebook, and broadsheets.',
              badge: 'Class Enrollment'
            },
            {
              step: 'Step 6: Editing Bio-Data or Archiving',
              detail: 'To correct names or update guardian contact, click the blue "Edit" button on any student row. If a student withdraws or graduates, toggle their status to "Inactive" so historical marks remain intact without bloating active class registers.',
              badge: 'Status Control'
            }
          ],
          proTip: 'Always verify guardian WhatsApp phone numbers during enrollment. A green WhatsApp icon appears in the student directory indicating direct chat readiness.'
        },
        {
          id: 'admin-subjects',
          topic: 'curriculum',
          title: '2. Managing the 36 School Subjects & Curriculum Streams',
          icon: BookOpen,
          summary: 'Configuring standardized subjects, assigning WAEC/UBEB subject codes, creating departmental streams, and allocating specialist educators.',
          steps: [
            {
              step: 'Step 1: Access Curriculum Architect',
              detail: 'Navigate to "Academic Classes & Setup" on the sidebar. Select the "Curriculum & Subjects" sub-tab to inspect all 36 active school subjects.',
              badge: 'Curriculum Hub'
            },
            {
              step: 'Step 2: Add or Edit a Subject',
              detail: 'Click "+ Add Subject". Specify the full Subject Title (e.g. "History", "Writing & Penmanship", "Physics") and its standardized uppercase 3 or 4-letter code (e.g. HIS, WRT, PHY).',
              badge: 'Code Matching'
            },
            {
              step: 'Step 3: Assign Academic Division',
              detail: 'Categorize the subject: Early Years (Nursery), Primary Division (Basic 1-6), Junior College (JSS 1-3), or Senior College (SSS 1-3).',
              badge: 'Division Scope'
            },
            {
              step: 'Step 4: Departmental Classification (Senior College Streams)',
              detail: 'For Senior Secondary, classify subjects into Science (Physics, Chemistry, Biology, Further Maths), Arts & Humanities (Literature, Government, History, CRS, Visual Art), or Commercial (Accounting, Commerce, Economics, Marketing).',
              badge: 'Department Streams'
            },
            {
              step: 'Step 5: Assign Specialist Educators',
              detail: 'Link the subject to the appointed teacher on the faculty roster. This grants that teacher score-entry access for their subject across their assigned classrooms.',
              badge: 'Teacher Allocation'
            }
          ],
          proTip: 'Eagle Power Schools has newly integrated History (HIS) and Writing & Penmanship (WRT) into the core Primary curriculum. Both subjects are fully configured in the live database.'
        },
        {
          id: 'admin-classes',
          topic: 'classes',
          title: '3. Managing Classrooms & Form Teacher Appointments',
          icon: School,
          summary: 'Structuring the 18 school classes, appointing Form Class Teachers with full cross-subject grading authority, and tracking enrollment roll.',
          steps: [
            {
              step: 'Step 1: Review the 18 Institutional Classrooms',
              detail: 'Eagle Power Schools encompasses 18 distinct academic stages: Creche, Pre-Nursery, Nursery 1-3, Basic 1-6, JSS 1-3, and SSS 1-3.',
              badge: '18 Active Classes'
            },
            {
              step: 'Step 2: Appoint the Form Class Teacher (Form Master / Mistress)',
              detail: 'Click on any class card to assign its Form Teacher. Crucial Architectural Rule: Designated Form Class Teachers hold complete academic oversight over their classroom. They can enter and edit Continuous Assessment and exam marks for ALL subjects in their class, write terminal conduct remarks, and conduct daily roll-calls.',
              badge: '👑 Form Authority'
            },
            {
              step: 'Step 3: Verify Classroom Rolls',
              detail: 'Verify pupil enrollment counts (e.g. JSS 2 currently has 39 scholars; Basic 4 has 17 scholars). Classroom capacity alerts prevent overcrowding.',
              badge: 'Roster Capacity'
            }
          ],
          proTip: 'In Gradebook and Attendance dropdowns, Form Teachers are visually identified with the 👑 crown icon ("Your Form Class") for immediate clarity.'
        },
        {
          id: 'admin-scores',
          topic: 'scores',
          title: '4. Division Assessment Schemes (20/20/60 vs 30/70) & Score Governance',
          icon: Award,
          summary: 'Understanding the distinct Primary (20/20/60) and Secondary (30/70) assessment rubrics, input clamping, and executive grade overrides.',
          steps: [
            {
              step: 'Scheme A: Primary & Nursery Division (20/20/60 Assessment Scheme)',
              detail: 'Continuous Assessment 1 (Max: 20 marks) + Continuous Assessment 2 (Max: 20 marks) = Total CA (40 marks). Terminal Examination = Max 60 marks. Grand Total = 100 marks. Official Grading: A+ (85+ Exceptional), A (75-84 Excellent), B (65-74 Very Good), C (55-64 Good), D (45-54 Pass), E (0-44 Needs Improvement).',
              badge: 'Primary: 40 CA / 60 Exam'
            },
            {
              step: 'Scheme B: Junior & Senior College (30/70 WAEC Standard)',
              detail: 'Continuous Assessment Total (Max: 30 marks) + Terminal Examination (Max: 70 marks) = Grand Total 100 marks. In Multi-Component mode: Test 1 (10) + Test 2 (10) + Project (10) = 30 CA marks. WAEC 9-Point Scale: A1 (75+ Distinction), B2 (70-74 Very Good), B3 (65-69 Good), C4 (60-64 Credit), C5 (55-59 Credit), C6 (50-54 Credit), D7 (45-49 Pass), E8 (40-44 Pass), F9 (0-39 Fail).',
              badge: 'Secondary: 30 CA / 70 Exam'
            },
            {
              step: 'Step 3: Server Clamping & Validation Security',
              detail: 'The Cloudflare Workers and Node backend automatically clamp entered scores against maximum component boundaries. Entering 25 in a CA field capped at 20 is rejected or clamped, preventing data corruption.',
              badge: 'Validation Bounds'
            },
            {
              step: 'Step 4: Executive Score Overrides & Security Audit Trail',
              detail: 'Administrators have master score-adjustment authority across all classes. Every mark edit is permanently recorded in the Security Audit Log with timestamp, modifier ID, and previous values.',
              badge: 'Audit Trail'
            }
          ],
          proTip: 'When switching between Primary and Secondary classes in the Gradebook, the system automatically detects the class division and swaps the scoring columns seamlessly.'
        },
        {
          id: 'admin-reports',
          topic: 'reports',
          title: '5. Generating, Approving & Printing Report Cards (4 Templates)',
          icon: FileSpreadsheet,
          summary: 'Comparing the 4 official report card templates, attaching digital seals and signatures, and printing single or batch terminal dossiers.',
          steps: [
            {
              step: 'Step 1: Open Report Card Studio',
              detail: 'Navigate to "Student Report Cards" on the sidebar menu.',
              badge: 'Report Card Studio'
            },
            {
              step: 'Step 2: Select Session, Term & Pupil',
              detail: 'Select Academic Session (e.g. 2026/2027) and Term (First, Second, or Third Term). Select the target student by admission number or search.',
              badge: 'Selection Filter'
            },
            {
              step: 'Step 3: Select from the 4 Official Report Card Templates',
              detail: '1. Elite Modern: Clean dual-column layout with performance radar and affective trait matrix. Best for Senior College. 2. Cherith Classic: Traditional broadsheet layout with full 3-term cumulative ledger and promotion decision. Best for Junior College and end-of-year promotion. 3. Al-Qalam Classic: Formal heritage design with moral conduct ratings. 4. Primary School: Built specifically for Basic 1-6 with 20/20/60 scoring and developmental observation checklists.',
              badge: '4 Official Templates'
            },
            {
              step: 'Step 4: Verification of Affective Traits & Attendance',
              detail: 'Ensure the pupil\'s attendance records (e.g. 116 Days Present of 120 Days Opened) and affective domain ratings (Punctuality, Neatness, Attentiveness) are fully populated.',
              badge: 'Holistic Review'
            },
            {
              step: 'Step 5: Form Teacher Comment & Principal Sign-Off',
              detail: 'Ensure qualitative comments are populated. Teachers can use "AI Suggest Remarks" to generate pedagogical feedback. The Principal\'s official signature and school seal are stamped automatically.',
              badge: 'Digital Stamp'
            },
            {
              step: 'Step 6: Optimal Print & PDF Export Settings',
              detail: 'Click "Print Official Dossier" or "Download PDF". Critical Print Settings: Paper Size: A4; Margins: Default or Minimum; Orientation: Portrait (for Elite, Primary, Al-Qalam) or Landscape (for Cherith Classic); Options: ALWAYS check "Background graphics" to render gold headers, seals, and progress bars.',
              badge: 'A4 Print Specs'
            }
          ],
          proTip: 'To print the entire class in bulk for speech and prize-giving day, use the Batch Print option to spool all pupil dossiers into a single printable document.'
        },
        {
          id: 'admin-broadsheet',
          topic: 'broadsheet',
          title: '6. Master Class Broadsheets, Term Rankings & Annual Promotion',
          icon: FileSpreadsheet,
          summary: 'Viewing the composite class score ledger, student rankings, subject averages, and end-of-year promotion decisions.',
          steps: [
            {
              step: 'Step 1: Access Class Broadsheet',
              detail: 'Click "Class Broadsheet" from the sidebar navigation. Select your target Class, Session, and Term.',
              badge: 'Composite Ledger'
            },
            {
              step: 'Step 2: Inspect Master Score Matrix',
              detail: 'Every student appears as a row, and every subject appears as a column. Individual subject totals, overall aggregate marks, and overall percentage calculate dynamically.',
              badge: 'Matrix View'
            },
            {
              step: 'Step 3: Automatic Class Ranking (Position in Class)',
              detail: 'The system computes pupil rankings automatically (1st, 2nd, 3rd ... 39th) using standard competition ranking based on overall score percentage. Ties are resolved transparently.',
              badge: 'Auto Position'
            },
            {
              step: 'Step 4: Subject Analytics & Highest/Lowest Marks',
              detail: 'The summary footer displays Class Maximum, Class Minimum, and Class Average for every subject, allowing academic boards to assess teacher impact and syllabus difficulty.',
              badge: 'Class Statistics'
            },
            {
              step: 'Step 5: Export to Microsoft Excel',
              detail: 'Click "Export to Excel (.xlsx)" to download the official broadsheet file for academic board meetings, ministry inspections, or offsite archival.',
              badge: 'Excel Export'
            }
          ],
          proTip: 'In Third Term, the broadsheet expands to display cumulative annual averages across all three terms to guide promotion decisions.'
        },
        {
          id: 'admin-staff',
          topic: 'staff',
          title: '7. Staff IAM, Identity Cards & Digital Signature Studio',
          icon: Shield,
          summary: 'Managing educator user credentials, issuing serialized Staff ID cards with photo and QR code, and configuring digital signatures for report cards.',
          steps: [
            {
              step: 'Step 1: Access Staff Management Console',
              detail: 'Select "Staff & Faculty" on the sidebar. View all 30 academic and administrative personnel.',
              badge: 'Staff Directory'
            },
            {
              step: 'Step 2: Assign Credentials & Role Permissions',
              detail: 'Create or update staff accounts. Assign system roles: superadmin, admin (Principal), teacher, bursar, or frontdesk.',
              badge: 'RBAC Security'
            },
            {
              step: 'Step 3: Staff ID Card Badge Studio',
              detail: 'Click "Staff ID Card" on any staff row. The studio renders the official dual-sided Eagle Power ID card complete with employee staff number (e.g. EPS-STF-48), designation, passport photograph, and scannable QR verification code.',
              badge: 'ID Badge Studio'
            },
            {
              step: 'Step 4: Digital Signature Studio',
              detail: 'Educators and administrators can sign directly on touchscreen devices or using a mouse inside the Digital Signature Studio. Once saved, their signature stamps automatically onto student report cards and official transcripts.',
              badge: 'Digital Signature'
            }
          ],
          proTip: 'Digital signatures are stored securely with base64 encoding and only stamp documents within the educator\'s authorized jurisdiction.'
        },
        {
          id: 'admin-sessions',
          topic: 'sessions',
          title: '8. Academic Sessions, Term Transitions & Calendar Setup',
          icon: Calendar,
          summary: 'Setting active sessions (e.g. 2026/2027), advancing terms (1st, 2nd, 3rd), setting next-term resumption dates, and end-of-year class promotions.',
          steps: [
            {
              step: 'Step 1: Open System Settings',
              detail: 'Navigate to "System Settings & Session Control" from the SuperAdmin console.',
              badge: 'Session Control'
            },
            {
              step: 'Step 2: Configure Active Session & Term',
              detail: 'Set the current active session (e.g., 2026/2027 Academic Session) and active term (First Term, Second Term, or Third Term). All default portals synchronize to this setting.',
              badge: 'Active Period'
            },
            {
              step: 'Step 3: Set Resumption & Vacation Dates',
              detail: 'Specify the Next Term Resumption Date (e.g., January 11, 2027) and Next Term Vacation Date. These dates automatically populate the footer of all student report cards.',
              badge: 'Term Dates'
            },
            {
              step: 'Step 4: End-of-Year Class Promotions',
              detail: 'At the conclusion of the 3rd term, administrators can execute batch student promotions (e.g. advancing JSS1 to JSS2, and Primary 5 to Primary 6) while retaining complete historical transcripts.',
              badge: 'Annual Promotion'
            }
          ],
          proTip: 'Always ensure all terminal scores are finalized and locked before advancing the active term.'
        },
        {
          id: 'admin-security',
          topic: 'security',
          title: '9. Security Audit Logs, Database Backups & Threat Radar',
          icon: ShieldCheck,
          summary: 'Monitoring real-time audit trails, tracking unauthorized access attempts, toggling maintenance mode, and downloading database snapshots.',
          steps: [
            {
              step: 'Step 1: Inspect Security Audit Logs',
              detail: 'Click "Audit Logs" on the sidebar. The system logs every user login, password reset, score entry, grade adjustment, and roll-call save with timestamp and IP origin.',
              badge: 'Live Audit Log'
            },
            {
              step: 'Step 2: Review Threat Radar & Telemetry',
              detail: 'Monitor failed login spikes, brute-force attempts, and unauthorized endpoint calls. Threat radar flags suspicious sessions automatically.',
              badge: 'Threat Radar'
            },
            {
              step: 'Step 3: Database JSON & SQLite Snapshots',
              detail: 'The institutional database can be exported to JSON (`portalDbData.json`) or backed up as SQLite (`eaglepower.db`) using the automated backup scripts in `server/backups`.',
              badge: 'Disaster Recovery'
            }
          ],
          proTip: 'Audit logs cannot be deleted by standard users and serve as a permanent evidentiary record for institutional governance.'
        }
      ]
    },
    teacher: {
      roleTitle: 'Class & Subject Teachers',
      roleBadge: '👨‍🏫 Educator Cockpit & Classroom Operations',
      description: 'The educator\'s complete field guide for morning roll-call attendance, Continuous Assessment and examination score entry, roster management, WhatsApp parent contact, broadsheets, report card previews, homework, and weekly lesson schemes.',
      quickLinks: [
        { label: 'Daily Roll-Call Attendance', id: 'teacher-attendance', tab: 'attendance', topic: 'attendance' },
        { label: 'Live Score Entry (20/20/60 vs 30/70)', id: 'teacher-scores', tab: 'gradebook', topic: 'scores' },
        { label: 'My Students Roster & WhatsApp', id: 'teacher-roster', tab: 'my_students', topic: 'students' },
        { label: 'Class Broadsheet & Positions', id: 'teacher-broadsheet', tab: 'broadsheet', topic: 'broadsheet' },
        { label: 'Previewing Report Cards', id: 'teacher-reports', tab: 'reportcard', topic: 'reports' },
        { label: 'Class Homework Management', id: 'teacher-homework', tab: 'homework', topic: 'homework' },
        { label: 'Staff ID & Digital Signature', id: 'teacher-signature', tab: 'teacher_cockpit', topic: 'staff' },
        { label: 'Lesson Planner & Schemes', id: 'teacher-lesson', tab: 'lesson_notes', topic: 'curriculum' }
      ],
      sections: [
        {
          id: 'teacher-attendance',
          topic: 'attendance',
          title: '1. Taking Daily Student Attendance (Morning Roll-Call)',
          icon: UserCheck,
          summary: 'Fast, official roll-call tracking for your assigned class with instant database persistence.',
          steps: [
            {
              step: 'Step 1: Open Daily Attendance Register',
              detail: 'Click "Daily Attendance" on the left sidebar, or click "Take Today\'s Roll-Call" directly from your Teacher Cockpit.',
              badge: 'Daily Roll-Call'
            },
            {
              step: 'Step 2: Confirm Class & Date',
              detail: 'The classroom dropdown automatically aligns to your assigned form class (e.g. JSS 2 with 39 pupils). The date defaults to today\'s date (e.g. 11/14/2026).',
              badge: 'Auto-Aligned'
            },
            {
              step: 'Step 3: 1-Click Roll-Call Actions',
              detail: 'Use the quick buttons: Click "Mark All Present" to set the entire class to Present in one click, then selectively mark absent or late scholars. Status options: Present (Green), Absent (Rose), Late (Amber), Excused (Blue), or Unrecorded.',
              badge: '1-Click Marking'
            },
            {
              step: 'Step 4: Real-Time Attendance Progress Bar',
              detail: 'As you mark pupils, the top metric cards (Total Roll, Present, Absent, Late, Excused) and the visual color-coded progress bar update live.',
              badge: 'Live Metrics'
            },
            {
              step: 'Step 5: Enter Absence Reasons / Remarks',
              detail: 'For any absent or excused pupil, add a brief note in the Remarks box (e.g. "Medical appointment", "Down with fever", "Family emergency").',
              badge: 'Remarks Note'
            },
            {
              step: 'Step 6: Click "Save Roll-Call"',
              detail: 'Click the gold "Save Roll-Call" button at the top-right. A confirmation banner appears, and attendance counts instantly update the school register and student report cards.',
              badge: 'Permanent Save'
            }
          ],
          proTip: 'Attendance totals calculate automatically on terminal report cards ("Times School Opened: 120", "Times Present: 118", "Times Absent: 2"). You never have to manually tally attendance counts at the end of the term.'
        },
        {
          id: 'teacher-scores',
          topic: 'scores',
          title: '2. Live Score Entry & Continuous Assessment (CA)',
          icon: Award,
          summary: 'Entering Continuous Assessment tests, assignments, and examination marks with dynamic division rubrics and AI assistance.',
          steps: [
            {
              step: 'Step 1: Open Live Score Entry',
              detail: 'Click "Live Score Entry" on the left sidebar to open the official Gradebook.',
              badge: 'Sidebar > Gradebook'
            },
            {
              step: 'Step 2: Select Class & Subject',
              detail: 'Choose your Class and the Subject. Crucial Permission Rule: Form Class Teachers can grade ALL subjects in their class. Subject Teachers can grade their assigned curriculum subjects across their timetable.',
              badge: 'Class & Subject'
            },
            {
              step: 'Step 3: Observe Division Assessment Scheme',
              detail: 'For Primary Classes (Basic 1-6): Columns are CA 1 (20), CA 2 (20), CA Total (40), and Exam (60). For Secondary Classes (JSS & SSS): Columns are Standard CA (30) + Exam (70) or Multi-Component Test 1 (10) + Test 2 (10) + Project (10) + Exam (70).',
              badge: 'Division Rubrics'
            },
            {
              step: 'Step 4: Enter Component Scores',
              detail: 'Type scores directly into the student input boxes. Total score (out of 100), letter grade (e.g. A1, B2, C4, F9 for Secondary; A+, A, B, C, D, E for Primary), and performance remark calculate live with zero delay.',
              badge: 'Live Auto-Grade'
            },
            {
              step: 'Step 5: Educator Productivity Accelerators',
              detail: 'Click "Auto-Fill Benchmark CA" to populate empty continuous assessment cells with standard baseline marks. Click "AI Suggest All Remarks" to automatically compose pedagogical feedback for every pupil based on their scores.',
              badge: 'AI Acceleration'
            },
            {
              step: 'Step 6: Click "Save All Scores"',
              detail: 'Click the gold "Save All Scores" button. All student marks are validated, clamped against component maximums, and securely committed to the institutional cloud database.',
              badge: 'D1 Cloud Save'
            }
          ],
          proTip: 'If score entry appears restricted for a subject in another class, remember that subject teachers are restricted to their assigned timetable. Ask the School Principal to update your subject allocation if needed.'
        },
        {
          id: 'teacher-roster',
          topic: 'students',
          title: '3. My Students Roster & WhatsApp Parent Direct Contact',
          icon: Users,
          summary: 'Managing enrolled scholars in your form room, checking parent contacts, writing qualitative remarks, and 1-click WhatsApp messaging.',
          steps: [
            {
              step: 'Step 1: Open My Students Roster',
              detail: 'Click "My Students Roster" from the left sidebar navigation.',
              badge: 'My Students'
            },
            {
              step: 'Step 2: Review Enrolled Scholars',
              detail: 'View all scholars in your class (e.g. all 39 pupils in JSS2). Search by name or admission number.',
              badge: 'Roster Review'
            },
            {
              step: 'Step 3: Instant 1-Click WhatsApp Parent Messaging',
              detail: 'Click the green "WhatsApp" pill button next to any student. This immediately opens WhatsApp Web or the WhatsApp mobile app addressed to the parent with a pre-written message template containing the student name and class.',
              badge: 'WhatsApp 1-Click'
            },
            {
              step: 'Step 4: Direct Phone Call',
              detail: 'Click the phone icon to dial the guardian directly from your mobile device or desktop phone app for urgent academic follow-ups.',
              badge: 'Direct Call'
            },
            {
              step: 'Step 5: Enter Form Teacher Terminal Remarks',
              detail: 'Click "Teacher Comment" on any student row to enter your qualitative end-of-term appraisal. These comments appear directly on the student\'s terminal report card.',
              badge: 'Conduct Remarks'
            }
          ],
          proTip: 'Always verify parent phone numbers during the first week of term to ensure communication channels remain uninterrupted.'
        },
        {
          id: 'teacher-broadsheet',
          topic: 'broadsheet',
          title: '4. Class Broadsheet & Performance Analysis',
          icon: FileSpreadsheet,
          summary: 'Inspecting student rankings, identifying struggling pupils, and exporting class broadsheets.',
          steps: [
            {
              step: 'Step 1: Open Class Broadsheet',
              detail: 'Click "Class Broadsheet" from the sidebar navigation. Select your Class, Session, and Term.',
              badge: 'Broadsheet View'
            },
            {
              step: 'Step 2: Inspect Class Performance Grid',
              detail: 'Review all students across all subjects side-by-side. Inspect total score obtainable, total score obtained, class percentage, and overall rank.',
              badge: 'Rank Matrix'
            },
            {
              step: 'Step 3: Export Broadsheet to Excel',
              detail: 'Click "Export to Excel" to download the formatted .xlsx broadsheet for academic records.',
              badge: 'Excel File'
            }
          ],
          proTip: 'Broadsheet ranking uses standard academic competition ranking, so tied percentages receive equal rank without skipping subsequent ranks incorrectly.'
        },
        {
          id: 'teacher-reports',
          topic: 'reports',
          title: '5. Reviewing & Previewing Student Report Cards',
          icon: Award,
          summary: 'Previewing all 4 report card templates from the teacher cockpit and verifying scores before distribution.',
          steps: [
            {
              step: 'Step 1: Open Student Report Cards',
              detail: 'Click "Student Report Cards" on the sidebar navigation.',
              badge: 'Report Card Studio'
            },
            {
              step: 'Step 2: Choose Template & Scholar',
              detail: 'Select the scholar from your class and switch between Elite Modern, Cherith Classic, Al-Qalam, and Primary School templates.',
              badge: 'Template Gallery'
            },
            {
              step: 'Step 3: Verify Remarks & Attendance',
              detail: 'Check that your Form Teacher remarks, Principal comments, and attendance totals are accurately rendered.',
              badge: 'Final Proofing'
            }
          ],
          proTip: 'Form teachers can preview the report cards of all students in their form class prior to final administrative sign-off.'
        },
        {
          id: 'teacher-homework',
          topic: 'homework',
          title: '6. Assigning Class Homework & Managing Tasks',
          icon: BookOpen,
          summary: 'Creating assignments, setting submission deadlines, and reviewing pupil submissions.',
          steps: [
            {
              step: 'Step 1: Open Class Homework',
              detail: 'Click "Class Homework" on the sidebar. This displays active and completed tasks.',
              badge: 'Homework Hub'
            },
            {
              step: 'Step 2: Click "+ New Assignment"',
              detail: 'Specify the Class, Subject, Assignment Title, and detailed instructions or exercise questions.',
              badge: 'Task Creation'
            },
            {
              step: 'Step 3: Set Due Date & Submission Guidelines',
              detail: 'Set the submission deadline (e.g., next Friday at 4:00 PM). Parents and students immediately see this on their portal dashboard.',
              badge: 'Deadlines'
            },
            {
              step: 'Step 4: Track Submissions',
              detail: 'View which pupils have turned in their assignments and award Continuous Assessment project marks directly.',
              badge: 'Grading'
            }
          ],
          proTip: 'Homework completion rates are visible to parents and factor into student cognitive discipline ratings.'
        },
        {
          id: 'teacher-signature',
          topic: 'staff',
          title: '7. Staff ID Card & Digital Signature Studio',
          icon: PenTool,
          summary: 'Drawing your touchscreen/mouse digital signature for automated report card stamping and viewing your official Staff ID.',
          steps: [
            {
              step: 'Step 1: Open Staff ID Studio',
              detail: 'Click "Staff ID Card & Signature" in the left sidebar menu or header.',
              badge: 'ID & Signature'
            },
            {
              step: 'Step 2: Draw Your Digital Signature',
              detail: 'Use your fingertip on a touchscreen smartphone/tablet or use your mouse on desktop to sign cleanly in the digital signature pad.',
              badge: 'Signature Pad'
            },
            {
              step: 'Step 3: Save Signature',
              detail: 'Click "Save Signature". Once saved, your signature automatically stamps onto terminal report cards and official classroom documents.',
              badge: 'Auto-Stamp'
            },
            {
              step: 'Step 4: View & Print Staff ID Card',
              detail: 'Inspect your official Eagle Power Schools Staff ID card with your passport photo, staff number (e.g. EPS-STF-48), and QR verification code.',
              badge: 'Official Badge'
            }
          ],
          proTip: 'You can re-sign at any time if your digital signature needs refinement.'
        },
        {
          id: 'teacher-lesson',
          topic: 'curriculum',
          title: '8. Lesson Planner & Scheme of Work Submission',
          icon: Building2,
          summary: 'Preparing weekly lesson scheme, learning objectives, instructional materials, and submitting for Principal review.',
          steps: [
            {
              step: 'Step 1: Open Lesson Planner',
              detail: 'Select "Lesson Planner" on the sidebar.',
              badge: 'Lesson Planner'
            },
            {
              step: 'Step 2: Create Weekly Scheme',
              detail: 'Select Class, Subject, and Week (e.g. Week 4: "Cell Structure & Functions"). Enter Learning Objectives, Instructional Materials, and Evaluation Questions.',
              badge: 'Lesson Scheme'
            },
            {
              step: 'Step 3: Submit for Academic Review',
              detail: 'Submit the lesson plan. The Principal or Vice-Principal can review and add supervisory guidance remarks.',
              badge: 'Supervisory Review'
            }
          ],
          proTip: 'Completed lesson plans are saved to your teaching portfolio and can be reused in future academic sessions.'
        }
      ]
    },
    parent: {
      roleTitle: 'Parents & Guardians',
      roleBadge: '👨‍👩‍👧 Parent Portal & Progress Tracker',
      description: 'The parent\'s complete guide to monitor child attendance, view and download terminal report cards, track tuition invoices, inspect homework, and communicate directly with teachers.',
      quickLinks: [
        { label: 'Parent Portal Login', id: 'parent-login', tab: 'child_overview', topic: 'students' },
        { label: 'Viewing Report Cards', id: 'parent-reports', tab: 'reportcard', topic: 'reports' },
        { label: 'Tracking Attendance', id: 'parent-attendance', tab: 'child_overview', topic: 'attendance' },
        { label: 'Tuition Fees & Invoices', id: 'parent-invoices', tab: 'invoices', topic: 'fees' },
        { label: 'Checking Homework', id: 'parent-homework', tab: 'homework', topic: 'homework' },
        { label: 'Contacting Class Teachers', id: 'parent-contact', tab: 'child_overview', topic: 'staff' }
      ],
      sections: [
        {
          id: 'parent-login',
          topic: 'students',
          title: '1. Accessing the Parent Portal',
          icon: KeyRound,
          summary: 'How parents log in securely to access their children’s records.',
          steps: [
            {
              step: 'Step 1: Visit the Portal URL',
              detail: 'Open your web browser and go to https://eaglepower.pages.dev/portal/login or click "EduCore Portal" in the website top navigation.',
              badge: 'Portal URL'
            },
            {
              step: 'Step 2: Sign in with Your Credentials',
              detail: 'Use your registered Parent Username or Guardian Phone Number and your password. If you do not have your credentials, contact the School Front Desk via WhatsApp (+234 907 558 0671).',
              badge: 'Secure Login'
            },
            {
              step: 'Step 3: Select Your Child',
              detail: 'If you have multiple children enrolled at Eagle Power Schools, you can switch between children seamlessly from the top dashboard selector.',
              badge: 'Multi-Child'
            }
          ],
          proTip: 'You can save the portal as a progressive web app shortcut on your smartphone home screen for easy 1-tap access.'
        },
        {
          id: 'parent-reports',
          topic: 'reports',
          title: '2. Viewing & Downloading Terminal Report Cards',
          icon: Award,
          summary: 'Accessing official digital report cards, verifying results, and printing formal academic dossiers.',
          steps: [
            {
              step: 'Step 1: Click "E-Report Card"',
              detail: 'From the parent menu, select "E-Report Card" or "Student Report Cards".',
              badge: 'Report Cards'
            },
            {
              step: 'Step 2: Choose Session and Term',
              detail: 'Select the desired Academic Session (e.g., 2026/2027) and Term (1st Term, 2nd Term, or 3rd Term).',
              badge: 'Session & Term'
            },
            {
              step: 'Step 3: Review Full Academic Breakdown',
              detail: 'View individual subject marks: Continuous Assessment (CA), Examination score, Total out of 100, Letter Grade, Class Average, and Teacher Remarks.',
              badge: 'Subject Analysis'
            },
            {
              step: 'Step 4: Check Character & Attendance Ratings',
              detail: 'Examine affective traits (Punctuality, Neatness, Politeness, Leadership) and official roll-call attendance totals.',
              badge: 'Holistic Review'
            },
            {
              step: 'Step 5: Download or Print Official PDF',
              detail: 'Click "Print Official Dossier". The document prints with the official school crest, watermark, and Head of School stamp.',
              badge: 'PDF / Print'
            }
          ],
          proTip: 'Eagle Power Schools report cards are tamper-proof and verifiable by external secondary schools and universities using the student\'s unique admission number.'
        },
        {
          id: 'parent-attendance',
          topic: 'attendance',
          title: '3. Tracking Daily Attendance & Punctuality',
          icon: Clock,
          summary: 'Ensuring your child is in school every day and monitoring arrival times.',
          steps: [
            {
              step: 'Step 1: Check Attendance Summary Card',
              detail: 'Your parent dashboard displays the live attendance rate (e.g. 98.5% Attendance Rate, 116 Days Present, 2 Excused).',
              badge: 'Attendance Rate'
            },
            {
              step: 'Step 2: Review Absence Logs',
              detail: 'View exact dates of any recorded absence or tardiness along with any recorded remarks from the form teacher.',
              badge: 'Log History'
            },
            {
              step: 'Step 3: Send Absence Notifications',
              detail: 'If your child is indisposed or attending an urgent family event, you can notify the class teacher via WhatsApp before morning assembly.',
              badge: 'Prior Notice'
            }
          ],
          proTip: 'A minimum attendance of 85% is required by school policy for eligibility to sit end-of-term examinations.'
        },
        {
          id: 'parent-invoices',
          topic: 'fees',
          title: '4. Tuition Invoices & Payment Verification',
          icon: CreditCard,
          summary: 'Checking school fees, payment receipts, and approved institutional bank accounts.',
          steps: [
            {
              step: 'Step 1: Click "Tuition & Invoices"',
              detail: 'Navigate to the Invoices tab to see current term tuition charges, books, uniforms, and extracurricular fees.',
              badge: 'Fee Schedule'
            },
            {
              step: 'Step 2: View Approved Bank Accounts',
              detail: 'Check the official school bank accounts (Eagle Power Schools, Zenith Bank / First Bank) displayed in the portal to avoid fraudulent accounts.',
              badge: 'Official Accounts'
            },
            {
              step: 'Step 3: Upload Transfer Receipt',
              detail: 'After making a payment, you can upload your payment receipt or send the transaction reference directly to the Bursar for instant clearance.',
              badge: 'Instant Receipt'
            }
          ],
          proTip: 'Always quote your child\'s full name and admission number in the bank transfer narration for automated reconciliation.'
        },
        {
          id: 'parent-homework',
          topic: 'homework',
          title: '5. Monitoring Homework & Academic Deadlines',
          icon: BookOpen,
          summary: 'Reviewing active homework assignments, submission instructions, and supervising your child\'s study routine.',
          steps: [
            {
              step: 'Step 1: Select "Assignments & Homework"',
              detail: 'View all active homework tasks assigned by class and subject teachers.',
              badge: 'Tasks View'
            },
            {
              step: 'Step 2: Check Due Dates',
              detail: 'Observe upcoming deadlines to ensure your child completes exercises before the submission window closes.',
              badge: 'Deadlines'
            }
          ],
          proTip: 'Homework completion builds consistent study habits and directly influences your child\'s continuous assessment project mark.'
        },
        {
          id: 'parent-contact',
          topic: 'staff',
          title: '6. Direct WhatsApp Communication with School Staff',
          icon: MessageCircle,
          summary: 'Instant 1-click messaging with your child\'s Form Teacher, Head of School, and ICT Helpdesk.',
          steps: [
            {
              step: 'Step 1: Open "My Children" Dashboard',
              detail: 'Locate the assigned Form Teacher card on your child\'s overview screen.',
              badge: 'Teacher Contact'
            },
            {
              step: 'Step 2: Click Green WhatsApp Button',
              detail: 'Clicking the WhatsApp button opens an instant direct chat with the Form Mistress or Form Master.',
              badge: '1-Click Chat'
            }
          ],
          proTip: 'Routine messages are answered during school working hours: Monday to Friday, 7:30 AM to 4:00 PM.'
        }
      ]
    },
    student: {
      roleTitle: 'Students & Scholars',
      roleBadge: '🎓 Scholar Portal & AI Study Companion',
      description: 'The student\'s personal guide to check marks, track homework deadlines, access study materials, and study with the Eagle AI Tutor.',
      quickLinks: [
        { label: 'Student Dashboard', id: 'student-dash', tab: 'reportcard', topic: 'students' },
        { label: 'Checking Grades & GPA', id: 'student-scores', tab: 'reportcard', topic: 'scores' },
        { label: 'Homework & Assignments', id: 'student-homework', tab: 'homework', topic: 'homework' },
        { label: 'Eagle AI Assistant & Tutor', id: 'student-ai', tab: 'ai_progress', topic: 'ai' },
        { label: 'Academic Profile', id: 'student-profile', tab: 'student_profile', topic: 'students' }
      ],
      sections: [
        {
          id: 'student-dash',
          topic: 'students',
          title: '1. Getting Started with the Student Portal',
          icon: GraduationCap,
          summary: 'Logging in and navigating your student learning cockpit.',
          steps: [
            {
              step: 'Step 1: Log in with Admission Number',
              detail: 'Sign in using your official student admission number (e.g. EPS-2026-0042) and your assigned student PIN/password.',
              badge: 'Student ID'
            },
            {
              step: 'Step 2: Check Today’s Schedule & Announcements',
              detail: 'Your overview screen highlights upcoming test dates, assembly announcements, and competition updates.',
              badge: 'Announcements'
            }
          ],
          proTip: 'Keep your student password secure and never share it with classmates.'
        },
        {
          id: 'student-scores',
          topic: 'scores',
          title: '2. Checking Your Grades & Term Progress',
          icon: TrendingUp,
          summary: 'Reviewing continuous assessment feedback and tracking academic improvement.',
          steps: [
            {
              step: 'Step 1: Open E-Report Card',
              detail: 'Click "E-Report Card" to see your subject marks across all continuous assessment tests and terminal exams.',
              badge: 'Live Results'
            },
            {
              step: 'Step 2: Read Teacher Recommendations',
              detail: 'Carefully review specific guidance comments written by your subject teachers highlighting topics that need extra revision.',
              badge: 'Teacher Advice'
            },
            {
              step: 'Step 3: Track Your Class Standing',
              detail: 'See your overall percentage and cumulative grade point average (GPA) to prepare for scholarship awards and honors list nominations.',
              badge: 'GPA Tracking'
            }
          ],
          proTip: 'Distinction scholars maintaining 75%+ across all core subjects receive academic honor pins at the end-of-term assembly.'
        },
        {
          id: 'student-homework',
          topic: 'homework',
          title: '3. Checking & Submitting Homework',
          icon: BookOpen,
          summary: 'Viewing assigned tasks, project guidelines, and deadline countdowns.',
          steps: [
            {
              step: 'Step 1: Open "Assignments & Tasks"',
              detail: 'Click "Assignments & Tasks" on the left menu to view all active homework items sorted by due date.',
              badge: 'Task List'
            },
            {
              step: 'Step 2: Review Instructions & Exercises',
              detail: 'Read the teacher\'s prompt, page references from your textbooks, and submission guidelines.',
              badge: 'Instructions'
            },
            {
              step: 'Step 3: Mark as Completed',
              detail: 'Once you submit your written notebook or practical work in class, tick the completion checkbox on your portal.',
              badge: 'Check Off'
            }
          ],
          proTip: 'Assignments turned in on time receive full continuous assessment credit (up to 10 marks per CA component).'
        },
        {
          id: 'student-ai',
          topic: 'ai',
          title: '4. Using Eagle AI Assistant & Educational Tutor',
          icon: Zap,
          summary: 'Your 24/7 personal study buddy for curriculum explanations and exam preparation.',
          steps: [
            {
              step: 'Step 1: Open "Eagle AI Assistant & Tutor"',
              detail: 'Click the brain icon on your sidebar menu to enter your personal learning workspace.',
              badge: 'AI Tutor'
            },
            {
              step: 'Step 2: Ask Any Academic Question',
              detail: 'Type questions in mathematics, sciences, literature, grammar, or social studies (e.g. "Explain photosynthesis step-by-step", "How do I solve quadratic equations by factorization?").',
              badge: 'Interactive'
            },
            {
              step: 'Step 3: Exam Prep (WAEC, BECE, Spelling Bee)',
              detail: 'Ask Eagle AI to quiz you with practice questions aligned to your class level and the official Nigerian curriculum.',
              badge: 'Exam Practice'
            }
          ],
          proTip: 'Use Eagle AI to clarify homework concepts, but always write your own original answers in your notebook.'
        }
      ]
    },
    bursar: {
      roleTitle: 'Bursar & Accounts Officers',
      roleBadge: '💼 Financial Operations & Tuition Ledger',
      description: 'The operations manual for school bursars handling student fee billing, recording bank deposits, generating serialized receipts, financial clearance, and staff payroll.',
      quickLinks: [
        { label: 'Tuition Invoices', id: 'bursar-invoices', tab: 'invoices', topic: 'fees' },
        { label: 'Recording Payments', id: 'bursar-payments', tab: 'invoices', topic: 'fees' },
        { label: 'Financial Clearance', id: 'bursar-clearance', tab: 'reportcard', topic: 'fees' },
        { label: 'Staff Payroll', id: 'bursar-payroll', tab: 'payroll', topic: 'staff' }
      ],
      sections: [
        {
          id: 'bursar-invoices',
          topic: 'fees',
          title: '1. Managing Tuition Invoices & Student Billing',
          icon: CreditCard,
          summary: 'Setting class fee structures, generating term bills, and tracking collection status.',
          steps: [
            {
              step: 'Step 1: Open Tuition Invoices',
              detail: 'Click "Tuition Invoices" from the sidebar menu to view total billed, collected, and outstanding sums.',
              badge: 'Invoices'
            },
            {
              step: 'Step 2: Filter by Class or Status',
              detail: 'Filter by Paid, Partial, or Unpaid to identify outstanding balances before examination weeks.',
              badge: 'Filter'
            }
          ],
          proTip: 'Invoices can be filtered by specific classroom to generate targeted fee reminder notices.'
        },
        {
          id: 'bursar-payments',
          topic: 'fees',
          title: '2. Recording Payments & Issuing Serialized Receipts',
          icon: Landmark,
          summary: 'Reconciling bank transfers, cash deposits, and POS payments with automated digital receipts.',
          steps: [
            {
              step: 'Step 1: Confirm Bank Deposit',
              detail: 'Match incoming credit alert against student admission number and guardian bank narration.',
              badge: 'Reconciliation'
            },
            {
              step: 'Step 2: Record Payment Transaction',
              detail: 'Enter amount paid, payment method (Bank Transfer, Cash, POS, Cheque), and bank transaction reference.',
              badge: 'Entry'
            },
            {
              step: 'Step 3: Issue Serialized Receipt',
              detail: 'The portal generates an official serialized receipt. The parent portal immediately updates to reflect the new payment.',
              badge: 'Receipt'
            }
          ],
          proTip: 'Daily reconciliations ensure zero financial discrepancy during annual school audits.'
        },
        {
          id: 'bursar-clearance',
          topic: 'fees',
          title: '3. Financial Clearance & Report Card Gating',
          icon: FolderCheck,
          summary: 'Managing fee clearance badges on student report cards and examination permits.',
          steps: [
            {
              step: 'Step 1: Review Clearance Roster',
              detail: 'View students with fully settled accounts vs those with pending balances.',
              badge: 'Clearance'
            },
            {
              step: 'Step 2: Toggle Financial Clearance Badge',
              detail: 'Mark scholars as "Cleared". This prints an official "Fees Cleared" watermark on their terminal report card.',
              badge: 'Clearance Stamp'
            }
          ],
          proTip: 'School policy requires complete fee clearance before official physical report cards are released.'
        },
        {
          id: 'bursar-payroll',
          topic: 'staff',
          title: '4. Staff Payroll & Monthly Salary Schedules',
          icon: DollarSign,
          summary: 'Managing salary structures, allowances, tax deductions, and bulk payroll disbursements.',
          steps: [
            {
              step: 'Step 1: Open Bulk Salary Payroll',
              detail: 'Navigate to "Payroll" on the left menu.',
              badge: 'Payroll'
            },
            {
              step: 'Step 2: Review Salary Structures',
              detail: 'Inspect base salaries, educational allowances, and deductions across all 28 staff salary structures.',
              badge: 'Structure'
            },
            {
              step: 'Step 3: Generate Monthly Bank Schedule',
              detail: 'Export the monthly salary payment schedule for electronic bank transfer processing.',
              badge: 'Bank Schedule'
            }
          ],
          proTip: 'Salary structures are locked to unauthorized users and only accessible by SuperAdmin, Principal, and Bursar.'
        }
      ]
    },
    frontdesk: {
      roleTitle: 'Front Desk & Security Officers',
      roleBadge: '🏢 Reception, Enquiries & Visitor Control',
      description: 'Operations manual for front desk officers managing gate passes, admission enquiries, incoming call logs, and parent complaints.',
      quickLinks: [
        { label: 'Security Visitor Passes', id: 'fd-visitors', tab: 'visitors', topic: 'frontdesk' },
        { label: 'Admission Enquiries', id: 'fd-enquiries', tab: 'visitors', topic: 'frontdesk' },
        { label: 'Administrative Call Logs', id: 'fd-calls', tab: 'visitors', topic: 'frontdesk' },
        { label: 'Feedback & Complaints', id: 'fd-complaints', tab: 'visitors', topic: 'frontdesk' }
      ],
      sections: [
        {
          id: 'fd-visitors',
          topic: 'frontdesk',
          title: '1. Visitor Gate Security Passes & Sign-In/Out',
          icon: Shield,
          summary: 'Issuing digital visitor passes, logging arrival time, host destination, and departure tracking.',
          steps: [
            {
              step: 'Step 1: Open Security Passes',
              detail: 'Navigate to "Security Passes" under Front Desk operations.',
              badge: 'Passes'
            },
            {
              step: 'Step 2: Log Visitor Entry',
              detail: 'Enter Visitor Full Name, Phone Number, Host Staff Member, and Purpose of Visit. Issue physical badge matching pass ID.',
              badge: 'Sign-In'
            },
            {
              step: 'Step 3: Record Sign-Out',
              detail: 'When the visitor departs the campus, click "Sign Out" to log the departure timestamp.',
              badge: 'Sign-Out'
            }
          ],
          proTip: 'Campus security protocol requires all visitors to wear official identification badges at all times.'
        },
        {
          id: 'fd-enquiries',
          topic: 'frontdesk',
          title: '2. Prospective Parent Admission Enquiries',
          icon: Users,
          summary: 'Capturing walk-in and telephone admission leads, scheduling entrance tests, and follow-ups.',
          steps: [
            {
              step: 'Step 1: Log New Enquiry',
              detail: 'Click "Admission Enquiries". Record prospective parent name, phone number, child\'s age, and class interested.',
              badge: 'Lead Entry'
            },
            {
              step: 'Step 2: Schedule Campus Tour or Entrance Test',
              detail: 'Assign an appointment date for entrance examination and campus inspection.',
              badge: 'Follow-Up'
            }
          ],
          proTip: 'Admission leads are accessible to the admissions committee for instant follow-up.'
        },
        {
          id: 'fd-calls',
          topic: 'frontdesk',
          title: '3. Administrative Telephone Call Logs',
          icon: PhoneCall,
          summary: 'Recording incoming and outgoing institutional calls, messages, and routing.',
          steps: [
            {
              step: 'Step 1: Record Call Details',
              detail: 'Enter caller name, contact phone, staff member addressed, and concise summary of the conversation.',
              badge: 'Call Log'
            }
          ],
          proTip: 'Keep call summaries concise and note any urgent action items.'
        },
        {
          id: 'fd-complaints',
          topic: 'frontdesk',
          title: '4. Parent Feedback & Complaints Resolution',
          icon: MessageSquare,
          summary: 'Documenting parent concerns, routing to appropriate school heads, and tracking resolution status.',
          steps: [
            {
              step: 'Step 1: Log Feedback / Complaint',
              detail: 'Record the parent\'s concern objectively: Category (Academic, Transport, Facilities, Billing), student name, and specific complaint.',
              badge: 'Complaint Entry'
            },
            {
              step: 'Step 2: Resolution & Archive',
              detail: 'Once the matter is resolved by the Principal or Admin, record resolution notes and click "Resolve & Archive".',
              badge: 'Resolved'
            }
          ],
          proTip: 'Timely resolution within 24 hours reinforces parental confidence in Eagle Power Schools.'
        }
      ]
    },
    faq: {
      roleTitle: 'Master FAQ, Subject Reference & Troubleshooting',
      roleBadge: '❓ Comprehensive Knowledge Base',
      description: 'Frequently asked questions, all 36 subject codes reference table, 4 report card template comparison, grading boundaries, and common troubleshooting solutions.',
      quickLinks: [
        { label: '36 Subjects Master Table', id: 'faq-subjects-table', tab: 'classes', topic: 'curriculum' },
        { label: '4 Templates Comparison', id: 'faq-templates-compare', tab: 'reportcard', topic: 'reports' },
        { label: 'Scoring Permissions', id: 'faq-scoring', tab: 'gradebook', topic: 'scores' },
        { label: 'Primary vs Secondary Rubrics', id: 'faq-rubrics', tab: 'gradebook', topic: 'scores' },
        { label: 'Batch Printing Report Cards', id: 'faq-batch-print', tab: 'reportcard', topic: 'reports' },
        { label: 'Class Positions & Ranks', id: 'faq-positions', tab: 'broadsheet', topic: 'broadsheet' },
        { label: 'Password Resets', id: 'faq-password', tab: 'overview', topic: 'security' },
        { label: 'Official Bank Accounts', id: 'faq-banks', tab: 'invoices', topic: 'fees' }
      ],
      sections: [
        {
          id: 'faq-subjects-table',
          topic: 'curriculum',
          title: 'Q: What are all the 36 official school subjects and their codes?',
          icon: BookOpen,
          summary: 'Complete directory of all subjects taught at Eagle Power Schools with official codes and divisions.',
          steps: [
            {
              step: 'Full Subject Code Catalog',
              detail: 'See the complete interactive subject directory table below. Codes include HIS (History), WRT (Writing), MTH (Mathematics), ENG (English), PHY (Physics), CHM (Chemistry), BIO (Biology), BST (Basic Science), DTECH (Digital Tech), and more.',
              badge: '36 Subjects'
            }
          ],
          proTip: 'When registering scores or homework, use the standardized 3-letter codes for fast search.'
        },
        {
          id: 'faq-templates-compare',
          topic: 'reports',
          title: 'Q: Which of the 4 report card templates should I use?',
          icon: FileSpreadsheet,
          summary: 'Comparison and optimal usage recommendations for Elite Modern, Cherith Classic, Al-Qalam, and Primary School templates.',
          steps: [
            {
              step: '1. Elite Modern Template',
              detail: 'Modern dual-column card with performance radar, affective domain matrix, and QR code verification. Recommended for Senior College (SSS 1-3). Orientation: Portrait.',
              badge: 'Senior College'
            },
            {
              step: '2. Cherith Classic Template',
              detail: 'Traditional British-Nigerian tabular broadsheet with full 3-term cumulative scores (1st, 2nd, 3rd Term), cumulative annual average, and promotion status ("Promoted", "To Repeat"). Recommended for 3rd Term promotion decisions and Junior College (JSS 1-3). Orientation: Landscape.',
              badge: 'Promotion Ledger'
            },
            {
              step: '3. Al-Qalam Classic Template',
              detail: 'Formal heritage border with Islamic/moral conduct evaluation and attendance statistics. Recommended for character recognition. Orientation: Portrait.',
              badge: 'Heritage Style'
            },
            {
              step: '4. Primary School Template',
              detail: 'Tailored specifically for Early Years and Basic 1-6. Highlights the 20/20/60 scoring scheme (CA1 20, CA2 20, Exam 60) and developmental milestone checklists. Orientation: Portrait.',
              badge: 'Primary & Nursery'
            }
          ],
          proTip: 'Always check "Background graphics" in your browser print dialog so decorative borders and progress indicators render cleanly.'
        },
        {
          id: 'faq-scoring',
          topic: 'scores',
          title: 'Q: Why are some subjects disabled or locked in the Gradebook?',
          icon: ShieldCheck,
          summary: 'Understanding Form Class Teacher vs Subject Teacher permissions.',
          steps: [
            {
              step: 'Form Class Teachers (👑)',
              detail: 'If you are the appointed Form Class Teacher for a class (marked with 👑 in the dropdown), you have full authority to score ALL subjects for that class.',
              badge: 'Full Class Access'
            },
            {
              step: 'Subject Teachers',
              detail: 'If you are a Subject Teacher, you can only enter scores for the specific subjects assigned to you on the official timetable. If you need to enter scores for another subject, ask the School Principal to assign that subject to your staff profile.',
              badge: 'Timetable Assigned'
            }
          ],
          proTip: 'Administrators and SuperAdmins always have full access to score and adjust all subjects across all 18 classes.'
        },
        {
          id: 'faq-rubrics',
          topic: 'scores',
          title: 'Q: What is the exact difference between Primary (20/20/60) and Secondary (30/70)?',
          icon: Award,
          summary: 'The two official assessment schemes configured in Eagle Power Schools EduCore.',
          steps: [
            {
              step: 'Primary / Basic 1-6 Scheme',
              detail: 'CA 1 (Max 20) + CA 2 (Max 20) = 40 CA Marks. Terminal Exam = Max 60 Marks. Total = 100 Marks. Grades: A+ (85+), A (75-84), B (65-74), C (55-64), D (45-54), E (0-44).',
              badge: 'Primary: 40 + 60'
            },
            {
              step: 'Junior & Senior Secondary Scheme',
              detail: 'Standard: CA Total (30) + Exam (70) = 100 Marks. Multi-Component: Test 1 (10) + Test 2 (10) + Project (10) = 30 CA Marks + Exam (70) = 100 Marks. Grades: Official WAEC 9-Point Scale (A1 down to F9).',
              badge: 'Secondary: 30 + 70'
            }
          ],
          proTip: 'The portal automatically detects the class division and activates the correct scoring rubric and input constraints.'
        },
        {
          id: 'faq-batch-print',
          topic: 'reports',
          title: 'Q: How do I print report cards in bulk for an entire class?',
          icon: Printer,
          summary: 'Batch printing dossiers for parent-teacher conferences and speech days.',
          steps: [
            {
              step: 'Batch Print Procedure',
              detail: 'In the Report Card studio, click "Batch Print Class Dossiers". Select your target class. The system concatenates all enrolled student report cards into a single printable stream with automatic page breaks between students.',
              badge: 'Batch Spool'
            }
          ],
          proTip: 'Use Chrome or Edge with Margins set to "Minimum" for continuous, crisp multi-page printing.'
        },
        {
          id: 'faq-positions',
          topic: 'broadsheet',
          title: 'Q: How is student rank/position in class determined?',
          icon: TrendingUp,
          summary: 'Standard competition ranking calculation based on overall aggregate mark percentage.',
          steps: [
            {
              step: 'Ranking Formula',
              detail: 'Students are sorted in descending order based on their overall aggregate percentage score across all examined subjects. The scholar with the highest percentage receives 1st position.',
              badge: 'Competition Rank'
            },
            {
              step: 'Tied Scores Handling',
              detail: 'If two students share an identical aggregate percentage (e.g. 88.4%), both receive the tied rank (e.g. Tied 2nd), and the subsequent rank advances appropriately (e.g. 4th), adhering to standard academic standards.',
              badge: 'Ties Resolution'
            }
          ],
          proTip: 'Rankings update in real-time as new subject scores are entered in the Gradebook.'
        },
        {
          id: 'faq-password',
          topic: 'security',
          title: 'Q: How do users change or reset their passwords?',
          icon: KeyRound,
          summary: 'Self-service password changes and administrative resets.',
          steps: [
            {
              step: 'Self-Service Password Change',
              detail: 'Click "Change Password" in the sidebar menu or header. Enter your current password, your new desired password, and confirm.',
              badge: 'Self-Service'
            },
            {
              step: 'Forgotten Password Reset',
              detail: 'If you forgot your password, contact the School SuperAdmin or Principal. Administrators can reset passwords instantly from the User Management console.',
              badge: 'Admin Reset'
            }
          ],
          proTip: 'New passwords must be at least 6 characters long and contain both letters and numbers for institutional security.'
        },
        {
          id: 'faq-banks',
          topic: 'fees',
          title: 'Q: What are the approved institutional bank accounts for school fees?',
          icon: Landmark,
          summary: 'Official verified corporate bank accounts for Eagle Power Schools.',
          steps: [
            {
              step: 'Zenith Bank Corporate Account',
              detail: 'Account Name: Eagle Power Schools | Account Number: 101XXXXXXX | Bank: Zenith Bank Nigeria',
              badge: 'Zenith Bank'
            },
            {
              step: 'First Bank Corporate Account',
              detail: 'Account Name: Eagle Power Schools | Account Number: 203XXXXXXX | Bank: First Bank of Nigeria',
              badge: 'First Bank'
            }
          ],
          proTip: 'Always include the pupil\'s admission number and full name in the bank narration for instant automated clearance.'
        }
      ]
    }
  };

  const currentRoleData = guideData[activeRoleTab] || guideData.admin;

  // Filter sections by search query and selected topic filter
  const filteredSections = useMemo(() => {
    let sections = currentRoleData.sections;

    if (selectedTopicFilter !== 'all') {
      sections = sections.filter(sec => sec.topic === selectedTopicFilter);
    }

    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(sec => {
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSummary = sec.summary.toLowerCase().includes(q);
      const matchSteps = sec.steps.some(st => 
        st.step.toLowerCase().includes(q) || st.detail.toLowerCase().includes(q)
      );
      return matchTitle || matchSummary || matchSteps;
    });
  }, [currentRoleData, searchQuery, selectedTopicFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      
      {/* Top Banner / Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold">
              <BookMarked className="w-3.5 h-3.5" />
              <span>Official Institutional User Manual & Operations Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              EaglePower EduCore Help & Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Step-by-step documentation for teachers, administrators, parents, and students. Master student enrollment, subject configurations, Primary & Secondary CA score entries, report card generation, and daily roll-calls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all shadow hover:scale-102"
              title="Print or Save User Manual as PDF"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Guide / Save PDF</span>
            </button>
            {isStandalone && (
              <a
                href="/portal/overview"
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/10 flex items-center gap-2 transition-all hover:scale-102"
              >
                <span>Launch EduCore Portal &rarr;</span>
              </a>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-6 relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instructions (e.g., 'adding students', 'score entry', '20/20/60', 'report card', 'WhatsApp', 'broadsheet')..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Topic Quick Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Filter by Topic:</span>
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'students', label: 'Student Enrollment' },
            { id: 'curriculum', label: '36 Subjects & Codes' },
            { id: 'scores', label: 'CA & Scores (20/20/60 vs 30/70)' },
            { id: 'reports', label: 'Report Cards (4 Templates)' },
            { id: 'attendance', label: 'Daily Roll-Call' },
            { id: 'broadsheet', label: 'Broadsheets & Ranks' },
            { id: 'staff', label: 'Staff ID & Signatures' },
            { id: 'fees', label: 'Tuition & Invoices' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setSelectedTopicFilter(chip.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedTopicFilter === chip.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { key: 'admin', label: '👑 Admin & SuperAdmin', icon: ShieldCheck },
          { key: 'teacher', label: '👨‍🏫 Teachers & Educators', icon: Users },
          { key: 'parent', label: '👨‍👩‍👧 Parents & Guardians', icon: HeartHandshakeIcon },
          { key: 'student', label: '🎓 Students & Scholars', icon: GraduationCap },
          { key: 'bursar', label: '💼 Bursar & Finance', icon: CreditCard },
          { key: 'frontdesk', label: '🏢 Front Desk & Security', icon: Building2 },
          { key: 'faq', label: '❓ Master FAQ & Subjects', icon: HelpCircle }
        ].map((role) => {
          const Icon = role.icon;
          const isActive = activeRoleTab === role.key;
          return (
            <button
              key={role.key}
              onClick={() => {
                setActiveRoleTab(role.key);
                setSearchQuery('');
                setSelectedTopicFilter('all');
                setExpandedSection(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-102 ring-2 ring-amber-400/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role Summary Banner */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">{currentRoleData.roleTitle}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 border border-amber-400/30 text-amber-300">
              {currentRoleData.roleBadge}
            </span>
          </div>
          <p className="text-slate-400 mt-1">{currentRoleData.description}</p>
        </div>

        {/* Quick Anchor Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Quick Jump:</span>
          {currentRoleData.quickLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                const el = document.getElementById(link.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  setExpandedSection(link.id);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-amber-400 font-semibold transition-all hover:scale-105"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Content Sections */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No matching guide topics found</h4>
            <p className="text-xs text-slate-500">Try clearing the search or selecting 'All Topics'.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedTopicFilter('all'); }}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSections.map((sec) => {
            const Icon = sec.icon || BookOpen;
            const isExpanded = expandedSection === sec.id || searchQuery.trim().length > 0;

            return (
              <div
                key={sec.id}
                id={sec.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden transition-all hover:border-slate-700 shadow-sm"
              >
                {/* Header Collapsible Trigger */}
                <div
                  onClick={() => setExpandedSection(isExpanded && !searchQuery ? null : sec.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 transition-colors select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>{sec.title}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{sec.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigateTab && !isStandalone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetTab = currentRoleData.quickLinks.find(q => q.id === sec.id)?.tab;
                          if (targetTab) onNavigateTab(targetTab);
                        }}
                        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold text-xs transition-all hover:scale-102"
                        title="Jump directly to this module in the portal"
                      >
                        <span>Open Feature</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 flex items-center justify-center">
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Step-by-Step Instructions */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-900 space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 gap-3 pt-3">
                      {sec.steps.map((st, stepIdx) => (
                        <div
                          key={stepIdx}
                          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                                {stepIdx + 1}
                              </span>
                              <strong className="text-white font-bold text-xs">{st.step}</strong>
                            </div>
                            <p className="text-xs text-slate-300 pl-7 leading-relaxed">{st.detail}</p>
                          </div>

                          {st.badge && (
                            <span className="self-start sm:self-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-amber-400 shrink-0 whitespace-nowrap">
                              {st.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {sec.proTip && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-400 block mb-0.5">Institutional Best Practice & Pro-Tip:</strong>
                          <span className="text-slate-300">{sec.proTip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 36 Subjects Directory Table (In FAQ or searchable) */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Eagle Power Schools: 36 Master Curriculum Subjects Directory</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
            Official WAEC / UBEB Codes
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Standardized 3 or 4-letter subject codes recognized across the Gradebook, broadsheet matrices, and terminal report card templates.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
              <tr className="text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">#</th>
                <th className="p-3">Subject Title</th>
                <th className="p-3">Standard Code</th>
                <th className="p-3">Applicable Division</th>
                <th className="p-3">Academic Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {masterSubjects.map((sub, sIdx) => (
                <tr key={sub.code} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono text-slate-500 text-[11px]">{sIdx + 1}</td>
                  <td className="p-3 font-bold text-white">{sub.name}</td>
                  <td className="p-3 font-mono font-bold text-amber-400">{sub.code}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                      {sub.division}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      {sub.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assessment Reference Summary Table */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Official Division Assessment Matrix Reference</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            Enforced by Server Engine
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <th className="p-3">School Division</th>
                <th className="p-3">Continuous Assessment (CA) Breakdown</th>
                <th className="p-3">Terminal Exam</th>
                <th className="p-3">Total Obtainable</th>
                <th className="p-3">Official Grading Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-900/30">
                <td className="p-3 font-bold text-white">
                  <div>Primary & Basic Division</div>
                  <div className="text-[10px] text-slate-500">Basic 1 to Basic 6</div>
                </td>
                <td className="p-3">
                  <span className="font-mono text-amber-400 font-bold">CA 1 (20) + CA 2 (20)</span>
                  <div className="text-[10px] text-slate-400">Total CA = 40 marks</div>
                </td>
                <td className="p-3 font-mono font-bold text-emerald-400">60 Marks</td>
                <td className="p-3 font-mono font-bold text-white">100 Marks</td>
                <td className="p-3">
                  <span className="text-[11px] font-semibold text-sky-400">A+ (85+), A (75-84), B (65-74), C (55-64), D (45-54), E (Fail)</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="p-3 font-bold text-white">
                  <div>Early Years / Nursery</div>
                  <div className="text-[10px] text-slate-500">Creche, Pre-Nur, Nursery 1-3</div>
                </td>
                <td className="p-3">
                  <span className="font-mono text-amber-400 font-bold">CA 1 (20) + CA 2 (20)</span>
                  <div className="text-[10px] text-slate-400">Total CA = 40 marks</div>
                </td>
                <td className="p-3 font-mono font-bold text-emerald-400">60 Marks</td>
                <td className="p-3 font-mono font-bold text-white">100 Marks</td>
                <td className="p-3">
                  <span className="text-[11px] font-semibold text-purple-400">EE (80+ Exceeding), ME (60-79 Meeting), AE (45-59 Approaching), ES (Emerging)</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="p-3 font-bold text-white">
                  <div>Junior Secondary College</div>
                  <div className="text-[10px] text-slate-500">JSS 1, JSS 2, JSS 3</div>
                </td>
                <td className="p-3">
                  <span className="font-mono text-amber-400 font-bold">CA Total (30)</span>
                  <div className="text-[10px] text-slate-400">Multi: Test 1 (10) + Test 2 (10) + Project (10)</div>
                </td>
                <td className="p-3 font-mono font-bold text-emerald-400">70 Marks</td>
                <td className="p-3 font-mono font-bold text-white">100 Marks</td>
                <td className="p-3">
                  <span className="text-[11px] font-semibold text-emerald-400">Official WAEC 9-Point: A1, B2, B3, C4, C5, C6, D7, E8, F9</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="p-3 font-bold text-white">
                  <div>Senior Secondary College</div>
                  <div className="text-[10px] text-slate-500">SSS 1, SSS 2, SSS 3 (Science / Arts / Comm)</div>
                </td>
                <td className="p-3">
                  <span className="font-mono text-amber-400 font-bold">CA Total (30)</span>
                  <div className="text-[10px] text-slate-400">Multi: Test 1 (10) + Test 2 (10) + Project (10)</div>
                </td>
                <td className="p-3 font-mono font-bold text-emerald-400">70 Marks</td>
                <td className="p-3 font-mono font-bold text-white">100 Marks</td>
                <td className="p-3">
                  <span className="text-[11px] font-semibold text-emerald-400">Official WAEC 9-Point: A1 (75+), B2 (70-74), B3 (65-69), C4-C6 (Credit)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Support & Immediate Helpdesk Contacts */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Need Immediate Technical Assistance or Account Support?</span>
          </h4>
          <p className="text-xs text-slate-300">
            Eagle Power Schools ICT Support Desk is available Monday – Friday, 7:30 AM – 5:00 PM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://wa.me/2349075580671?text=Hello%20Eagle%20Power%20Schools%20Support,%20I%20need%20assistance%20with%20the%20EduCore%20portal"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow transition-all hover:scale-102"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp ICT Desk</span>
          </a>
          <a
            href="tel:+2349075580671"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span>Call +234 907 558 0671</span>
          </a>
        </div>
      </div>

    </div>
  );
}

function HeartHandshakeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.18 0l2.5 1.83" />
      <path d="m18 15-2-2" />
      <path d="m15 18-2-2" />
    </svg>
  );
}
