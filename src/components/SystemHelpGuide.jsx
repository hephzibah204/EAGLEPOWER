'use client';

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
  FolderPlus,
  BookMarked,
  UserCheck,
  Zap,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function SystemHelpGuide({ isStandalone = false, onNavigateTab = null, currentUser = null }) {
  const [activeRoleTab, setActiveRoleTab] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Guide Modules Data
  const guideData = {
    admin: {
      roleTitle: 'Administrators & SuperAdmins',
      roleBadge: '👑 Master Academic & IAM Control',
      description: 'Complete operational manual for School Proprietors, Principals, and Head Teachers managing students, curriculum, classes, staff permissions, and institutional reporting.',
      quickLinks: [
        { label: 'Adding Students', id: 'admin-students', tab: 'students' },
        { label: 'Adding Subjects', id: 'admin-subjects', tab: 'classes' },
        { label: 'Classes & Teacher Assignments', id: 'admin-classes', tab: 'classes' },
        { label: 'Score Entry & Assessment Scheme', id: 'admin-scores', tab: 'gradebook' },
        { label: 'Report Cards & Approvals', id: 'admin-reports', tab: 'reportcard' },
        { label: 'Class Broadsheets', id: 'admin-broadsheet', tab: 'broadsheet' },
        { label: 'Audit Logs & Security', id: 'admin-security', tab: 'audit' }
      ],
      sections: [
        {
          id: 'admin-students',
          title: '1. Enrolling & Managing Students',
          icon: Users,
          summary: 'How to register new students, assign admission numbers, update bio-data, and manage class enrollments.',
          steps: [
            {
              step: 'Step 1: Open the Students Directory',
              detail: 'From the executive sidebar, navigate to Academics > Students Directory (or click "Students Directory" button).',
              badge: 'Sidebar > Students'
            },
            {
              step: 'Step 2: Click "Enroll New Student"',
              detail: 'Click the gold "+ Enroll New Student" button located at the top-right of the student directory table to open the official registration modal.',
              badge: 'Modal Action'
            },
            {
              step: 'Step 3: Fill Required Student Information',
              detail: 'Enter Full Name (First & Last name), Gender (Male / Female), Date of Birth, and permanent residential address. Ensure the admission number matches the official Eagle Power format (e.g., EPS-2026-0142).',
              badge: 'Form Fields'
            },
            {
              step: 'Step 4: Enter Guardian & WhatsApp Contact Details',
              detail: 'Enter the Guardian Name and Guardian Phone Number. Crucial: Ensure the phone number is active on WhatsApp (e.g., 0803XXXXXXX) as this powers the instant 1-click report card and attendance broadcast system.',
              badge: 'WhatsApp Enabled'
            },
            {
              step: 'Step 5: Assign Class & Section',
              detail: 'Select the designated classroom (e.g., JSS 2, Primary 4, SSS 1 Science). Once saved, the student is immediately enrolled into the official class roll-call and gradebook rosters.',
              badge: 'Class Enrollment'
            }
          ],
          proTip: 'For batch enrollments of large incoming cohorts, you can request an automated Excel migration import via the SuperAdmin database synchronizer tool.'
        },
        {
          id: 'admin-subjects',
          title: '2. Adding & Managing Curriculum Subjects',
          icon: BookOpen,
          summary: 'Setting up subjects, assigning official WAEC/UBEB subject codes, and mapping subjects to school divisions.',
          steps: [
            {
              step: 'Step 1: Access Class & Subject Manager',
              detail: 'Navigate to "Academic Classes & Setup" under Academics in the sidebar.',
              badge: 'Classes > Subjects'
            },
            {
              step: 'Step 2: Add or Configure a Subject',
              detail: 'Click "+ Add New Subject". Specify the full descriptive Subject Title (e.g., "Intermediate Science", "Further Mathematics", "Agricultural Science") and its canonical 3 or 4-letter code (e.g., ISC, FMTH, AGR).',
              badge: 'Code Matching'
            },
            {
              step: 'Step 3: Define School Division',
              detail: 'Select which division this subject belongs to: Early Years (Nursery), Primary (Basic 1-6), Junior College (JSS 1-3), or Senior College (SSS 1-3 Science, Arts, or Commercial).',
              badge: 'Curriculum Grouping'
            },
            {
              step: 'Step 4: Designate Subject Teachers',
              detail: 'Assign the specialist educator responsible for delivering this curriculum. The system will automatically permit this teacher to grade this subject across assigned classes.',
              badge: 'Permission Mapping'
            }
          ],
          proTip: 'Subject codes are standardized across Nigerian curricula: MTH (Mathematics), ENG (English Language), BIO (Biology), CHM (Chemistry), PHY (Physics), PHE (Physical & Health Ed), CRS (Christian Religious Studies), IGB (Igbo Language).'
        },
        {
          id: 'admin-classes',
          title: '3. Managing Classes & Assigning Form Teachers',
          icon: School,
          summary: 'Structuring the school divisions, appointing Form Class Teachers, and configuring class capacities.',
          steps: [
            {
              step: 'Step 1: Review Current Class Structure',
              detail: 'Eagle Power Schools encompasses 18 academic classrooms spanning Creche, Pre-Nursery, Nursery 1-3, Basic 1-6, JSS 1-3, and SSS 1-3.',
              badge: 'School Structure'
            },
            {
              step: 'Step 2: Appoint Form Class Teacher (Form Master/Mistress)',
              detail: 'Select the class card and designate the Form Teacher. Crucial: The designated Form Class Teacher holds full academic authority over their class, giving them access to enter scores for ALL subjects, prepare terminal remarks, and monitor daily roll-calls.',
              badge: 'Form Authority'
            },
            {
              step: 'Step 3: Set Class Capacity & Room Allocation',
              detail: 'Review enrolled pupil counts (e.g., JSS2: 39 pupils, Basic 4: 17 pupils). The system maintains a real-time headcount against classroom capacity.',
              badge: 'Roster Tracking'
            }
          ],
          proTip: 'Form Teachers are marked with the 👑 crown icon in the Gradebook and Roster dropdowns for instant identification.'
        },
        {
          id: 'admin-scores',
          title: '4. Division Assessment Schemes & Score Governance',
          icon: Award,
          summary: 'Understanding the distinct Primary (20/20/60) and Secondary (30/70) scoring rules and executive grade overrides.',
          steps: [
            {
              step: 'Scheme A: Primary & Nursery Division (20/20/60)',
              detail: 'Continuous Assessment 1 (Max 20) + Continuous Assessment 2 (Max 20) = CA Total (40 marks). Terminal Examination = Max 60 marks. Grand Total = 100 marks. Grades: A+ (85+), A (75-84), B (65-74), C (55-64), D (45-54), E (0-44).',
              badge: 'Primary: 40 CA / 60 Exam'
            },
            {
              step: 'Scheme B: Junior & Senior College (30/70)',
              detail: 'Continuous Assessment Total (Max 30) + Terminal Examination (Max 70) = 100 marks. In Detailed mode: CA 1 (10) + CA 2 (10) + Project / Assignment (10) = 30 CA marks. WAEC 9-Point Scale: A1 (75+), B2 (70-74), B3 (65-69), C4 (60-64), C5 (55-59), C6 (50-54), D7 (45-49), E8 (40-44), F9 (0-39).',
              badge: 'Secondary: 30 CA / 70 Exam'
            },
            {
              step: 'Step 3: Executive Score Override & Audit',
              detail: 'Administrators can view and adjust entered scores across any class or subject. Every score modification is logged in the permanent Security Audit Log with timestamp, modifier ID, and previous values.',
              badge: 'Audit Trail'
            }
          ],
          proTip: 'The system automatically clamps scores to maximum component bounds, preventing typographical errors (e.g. entering 75 in an exam field capped at 70).'
        },
        {
          id: 'admin-reports',
          title: '5. Generating, Approving & Printing Report Cards',
          icon: FileSpreadsheet,
          summary: 'Batch generating terminal dossiers, selecting report card styles, and attaching principal sign-offs.',
          steps: [
            {
              step: 'Step 1: Open Report Card Studio',
              detail: 'Navigate to "Student Report Cards" on the sidebar or click the Student Dossier tab.',
              badge: 'Sidebar > Report Cards'
            },
            {
              step: 'Step 2: Select Session, Term & Template',
              detail: 'Choose Session (e.g., 2026/2027), Term (First, Second, or Third Term), and Template: Elite Modern, Cherith Classic, Al-Qalam Classic, or Primary School Template.',
              badge: '4 Official Templates'
            },
            {
              step: 'Step 3: Review Computed Academic Metrics',
              detail: 'Verify student total marks, class percentage, subject positions, cognitive domains, affective traits, and attendance records (e.g. 116 of 120 days present).',
              badge: 'Verification'
            },
            {
              step: 'Step 4: Form Teacher & Principal Comments',
              detail: 'Ensure the Form Teacher comment and Principal sign-off are generated or entered. Eagle AI can suggest tailored educational remarks based on student trajectory.',
              badge: 'Sign-Off'
            },
            {
              step: 'Step 5: Print or Export PDF',
              detail: 'Click "Print Official Dossier" or "Download PDF". For optimal printing: select A4 paper size, check "Background Graphics" in the browser print dialog, and leave margins at Default or Minimum.',
              badge: 'Clean Print'
            }
          ],
          proTip: 'Use Cherith Classic for traditional cumulative 3-term tracking, Elite Modern for modern color-coded analytics, and Primary School Template for Basic 1-6.'
        }
      ]
    },
    teacher: {
      roleTitle: 'Class & Subject Teachers',
      roleBadge: '👨‍🏫 Educator Cockpit & Classroom Hub',
      description: 'Step-by-step instructions for teachers to record attendance, manage student rosters, enter Continuous Assessment and exam scores, assign homework, and communicate with parents.',
      quickLinks: [
        { label: 'Daily Roll-Call Attendance', id: 'teacher-attendance', tab: 'attendance' },
        { label: 'Score Entry & CA Marking', id: 'teacher-scores', tab: 'gradebook' },
        { label: 'My Students Roster', id: 'teacher-roster', tab: 'my_students' },
        { label: 'Class Broadsheet', id: 'teacher-broadsheet', tab: 'broadsheet' },
        { label: 'Assigning Homework', id: 'teacher-homework', tab: 'homework' },
        { label: 'Lesson Notes & Schemes', id: 'teacher-lesson', tab: 'lesson_notes' },
        { label: 'Parent Contact via WhatsApp', id: 'teacher-whatsapp', tab: 'my_students' }
      ],
      sections: [
        {
          id: 'teacher-attendance',
          title: '1. Taking Daily Student Attendance (Roll-Call)',
          icon: UserCheck,
          summary: 'Fast, official roll-call tracking for your assigned class with instant database synchronization.',
          steps: [
            {
              step: 'Step 1: Open Daily Attendance Register',
              detail: 'Click "Daily Attendance" on the left sidebar, or click "Take Today\'s Roll-Call" directly from your Teacher Cockpit.',
              badge: 'Daily Roll-Call'
            },
            {
              step: 'Step 2: Confirm Class & Date',
              detail: 'The class dropdown automatically aligns to your assigned form class (e.g. JSS 2 with 39 pupils). The date defaults to today\'s date (e.g. 11/14/2026).',
              badge: 'Auto-Aligned'
            },
            {
              step: 'Step 3: Mark Roll-Call Status',
              detail: 'Use the quick buttons: "Mark All Present" to set everyone to Present in one click, then selectively change absent or late students. Statuses available: Present (Green), Absent (Rose), Late (Amber), Excused (Blue).',
              badge: '1-Click Marking'
            },
            {
              step: 'Step 4: Optional Remarks / Reasons',
              detail: 'For absent or excused pupils, enter a brief note (e.g., "Medical appointment", "Fee issue", "Flu").',
              badge: 'Documentation'
            },
            {
              step: 'Step 5: Click "Save Roll-Call"',
              detail: 'Click the gold "Save Roll-Call" button at the top-right. A confirmation toast appears, and attendance counts instantly update the school register and student report cards.',
              badge: 'Permanent Save'
            }
          ],
          proTip: 'Attendance data is directly integrated into terminal report cards ("Times School Opened" and "Times Present") without double-entry.'
        },
        {
          id: 'teacher-scores',
          title: '2. Live Score Entry & Continuous Assessment (CA)',
          icon: Award,
          summary: 'How to enter test marks, project scores, and examination results with live grade computation.',
          steps: [
            {
              step: 'Step 1: Open Live Score Entry',
              detail: 'Click "Live Score Entry" on the left sidebar to open the official Gradebook.',
              badge: 'Sidebar > Gradebook'
            },
            {
              step: 'Step 2: Select Class & Subject',
              detail: 'Choose your Class and the Subject. Note: Form Class Teachers can grade ALL subjects in their class. Subject Teachers can grade their assigned curriculum subjects.',
              badge: 'Class & Subject'
            },
            {
              step: 'Step 3: Observe Division Assessment Scheme',
              detail: 'For Primary Classes (Basic 1-6): CA 1 is out of 20, CA 2 is out of 20 (Total CA = 40), and Exam is out of 60. For Secondary Classes (JSS & SSS): CA is out of 30, and Exam is out of 70 (or 10+10+10 multi-component).',
              badge: 'Live Rubric'
            },
            {
              step: 'Step 4: Enter Component Scores',
              detail: 'Type scores directly into the student input boxes. Total score (out of 100), letter grade (e.g. A1, B2, C4, F9), and performance remark calculate live with zero delay.',
              badge: 'Live Auto-Grade'
            },
            {
              step: 'Step 5: Use Educator Productivity Accelerators',
              detail: 'Click "Auto-Fill Benchmark CA" to populate empty continuous assessment cells with standard baseline marks. Click "AI Suggest All Remarks" to automatically compose pedagogical feedback for every pupil.',
              badge: 'AI Assisted'
            },
            {
              step: 'Step 6: Click "Save All Scores"',
              detail: 'Click the gold "Save All Scores" button. All student marks are validated, clamped against component maximums, and securely committed to the institutional cloud database.',
              badge: 'Durable Save'
            }
          ],
          proTip: 'If score entry appears locked for a subject in another class, remember that subject teachers are restricted to their assigned timetable. Contact the Admin if you need an additional subject assigned.'
        },
        {
          id: 'teacher-roster',
          title: '3. My Students Roster & WhatsApp Parent Contact',
          icon: Users,
          summary: 'Managing your form class members, writing terminal comments, and communicating directly with parents.',
          steps: [
            {
              step: 'Step 1: Open My Students Roster',
              detail: 'Click "My Students Roster" from the sidebar. You will see all pupils enrolled in your form class (e.g. all 39 students in JSS2).',
              badge: 'Roster View'
            },
            {
              step: 'Step 2: Instant WhatsApp Contact to Parent',
              detail: 'Every student card features a green WhatsApp pill button. Clicking it instantly launches WhatsApp with the guardian\'s phone number and a pre-composed greeting referencing the pupil\'s name and class.',
              badge: 'Instant WhatsApp'
            },
            {
              step: 'Step 3: Direct Phone Call',
              detail: 'Click the phone button to dial the guardian directly from your mobile device or desktop phone app for urgent academic follow-ups.',
              badge: 'Phone Call'
            },
            {
              step: 'Step 4: Writing Terminal Remarks',
              detail: 'Click "Teacher Comment" on any student row to enter your qualitative end-of-term appraisal. These comments appear directly on the student\'s terminal report card.',
              badge: 'Dossier Remarks'
            }
          ],
          proTip: 'Always verify parent phone numbers during the first week of term to ensure communication channels remain uninterrupted.'
        },
        {
          id: 'teacher-homework',
          title: '4. Assigning Class Homework & Tasks',
          icon: BookOpen,
          summary: 'Creating homework assignments, setting submission deadlines, and reviewing pupil submissions.',
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
        }
      ]
    },
    parent: {
      roleTitle: 'Parents & Guardians',
      roleBadge: '👨‍👩‍👧 Parent Portal & Progress Tracker',
      description: 'Guide for parents and guardians to monitor their child\'s attendance, view and download terminal report cards, track tuition invoices, and contact school staff.',
      quickLinks: [
        { label: 'Parent Portal Login', id: 'parent-login', tab: 'child_overview' },
        { label: 'Viewing Report Cards', id: 'parent-reports', tab: 'reportcard' },
        { label: 'Monitoring Attendance', id: 'parent-attendance', tab: 'child_overview' },
        { label: 'Homework & Assignments', id: 'parent-homework', tab: 'homework' },
        { label: 'Tuition Fees & Invoices', id: 'parent-invoices', tab: 'invoices' },
        { label: 'Contacting Class Teachers', id: 'parent-contact', tab: 'child_overview' }
      ],
      sections: [
        {
          id: 'parent-login',
          title: '1. Accessing the Parent Portal',
          icon: KeyRound,
          summary: 'How parents log in securely to access their children’s records.',
          steps: [
            {
              step: 'Step 1: Visit the Portal URL',
              detail: 'Open your web browser and go to https://eaglepower.pages.dev/portal/login or click "Portal" in the website top navigation.',
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
        }
      ]
    },
    student: {
      roleTitle: 'Students & Scholars',
      roleBadge: '🎓 Scholar Portal & AI Study Companion',
      description: 'Guide for students to check their grades, view homework deadlines, explore learning resources, and use the Eagle AI Tutor.',
      quickLinks: [
        { label: 'Student Dashboard', id: 'student-dash', tab: 'reportcard' },
        { label: 'Checking My Scores', id: 'student-scores', tab: 'reportcard' },
        { label: 'Homework & Assignments', id: 'student-homework', tab: 'homework' },
        { label: 'Eagle AI Assistant & Tutor', id: 'student-ai', tab: 'ai_progress' },
        { label: 'Academic Profile', id: 'student-profile', tab: 'student_profile' }
      ],
      sections: [
        {
          id: 'student-dash',
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
          title: '4. Using Eagle AI Assistant & Tutor',
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
      description: 'Operations manual for school bursars handling tuition invoicing, payment reconciliations, payroll, and clearance.',
      quickLinks: [
        { label: 'Tuition Invoices', id: 'bursar-invoices', tab: 'invoices' },
        { label: 'Recording Payments', id: 'bursar-payments', tab: 'invoices' },
        { label: 'Salary Payroll', id: 'bursar-payroll', tab: 'payroll' },
        { label: 'Exam Clearance', id: 'bursar-clearance', tab: 'reportcard' }
      ],
      sections: [
        {
          id: 'bursar-invoices',
          title: '1. Managing Tuition Invoices & Student Billing',
          icon: CreditCard,
          summary: 'Generating term bills and tracking payment statuses.',
          steps: [
            {
              step: 'Step 1: Open Tuition Invoices',
              detail: 'Click "Tuition Invoices" from the sidebar menu to see real-time payment metrics.',
              badge: 'Invoices'
            },
            {
              step: 'Step 2: Filter by Class or Status',
              detail: 'Filter by Paid, Partial, or Unpaid to identify outstanding balances before examination weeks.',
              badge: 'Filtering'
            },
            {
              step: 'Step 3: Issue Official Receipts',
              detail: 'Record confirmed bank deposits and issue serialized digital receipts directly to parent accounts.',
              badge: 'Receipting'
            }
          ],
          proTip: 'Reconcile daily bank credit alerts against student admission numbers every evening.'
        }
      ]
    },
    faq: {
      roleTitle: 'Frequently Asked Questions & Troubleshooting',
      roleBadge: '❓ Knowledge Base & Diagnostics',
      description: 'Common questions, access permission rules, and troubleshooting solutions.',
      quickLinks: [
        { label: 'Scoring Permissions', id: 'faq-scoring', tab: 'gradebook' },
        { label: 'Missing Pupils in Roll', id: 'faq-roster', tab: 'attendance' },
        { label: 'Printing Report Cards', id: 'faq-print', tab: 'reportcard' },
        { label: 'Password Resets', id: 'faq-password', tab: 'overview' },
        { label: 'Primary vs Secondary Rubrics', id: 'faq-rubrics', tab: 'gradebook' }
      ],
      sections: [
        {
          id: 'faq-scoring',
          title: 'Q: Why are some subjects disabled or locked in the Gradebook?',
          icon: ShieldCheck,
          summary: 'Understanding teacher subject assignments vs form teacher privileges.',
          steps: [
            {
              step: 'Form Class Teachers',
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
          id: 'faq-print',
          title: 'Q: How do I ensure report cards print on a single clean page without cutoff?',
          icon: Printer,
          summary: 'Best browser print settings for crystal-clear physical dossiers.',
          steps: [
            {
              step: 'Paper Size',
              detail: 'Set Paper Size to A4.',
              badge: 'Paper: A4'
            },
            {
              step: 'Background Graphics',
              detail: 'Enable "Background graphics" in the print dialog options to render school seals, progress bars, and colored headers.',
              badge: 'Enable Backgrounds'
            },
            {
              step: 'Margins & Scale',
              detail: 'Set Margins to "Default" or "Minimum". Set Scale to "Fit to printable area" or 100%.',
              badge: 'Scale: 100%'
            }
          ],
          proTip: 'For Cherith Classic 3-term broadsheets, Landscape orientation is recommended.'
        },
        {
          id: 'faq-password',
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
        }
      ]
    }
  };

  const currentRoleData = guideData[activeRoleTab] || guideData.admin;

  // Search filter
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentRoleData.sections;
    const q = searchQuery.toLowerCase();
    return currentRoleData.sections.filter(sec => {
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSummary = sec.summary.toLowerCase().includes(q);
      const matchSteps = sec.steps.some(st => 
        st.step.toLowerCase().includes(q) || st.detail.toLowerCase().includes(q)
      );
      return matchTitle || matchSummary || matchSteps;
    });
  }, [currentRoleData, searchQuery]);

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
            placeholder="Search instructions (e.g., 'adding students', 'score entry', '20/20/60', 'report card', 'WhatsApp')..."
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
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { key: 'admin', label: '👑 Admin & SuperAdmin', icon: ShieldCheck },
          { key: 'teacher', label: '👨‍🏫 Teachers & Educators', icon: Users },
          { key: 'parent', label: '👨‍👩‍👧 Parents & Guardians', icon: HeartHandshakeIcon },
          { key: 'student', label: '🎓 Students & Scholars', icon: GraduationCap },
          { key: 'bursar', label: '💼 Bursar & Finance', icon: CreditCard },
          { key: 'faq', label: '❓ FAQ & Diagnostics', icon: HelpCircle }
        ].map((role) => {
          const Icon = role.icon;
          const isActive = activeRoleTab === role.key;
          return (
            <button
              key={role.key}
              onClick={() => {
                setActiveRoleTab(role.key);
                setSearchQuery('');
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
            <p className="text-xs text-slate-500">Try searching for broader keywords like "scores", "attendance", "students", or "report".</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredSections.map((sec, idx) => {
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
