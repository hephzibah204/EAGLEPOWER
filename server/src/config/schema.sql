-- Eagle Power Schools (EduCore) Normalized SQLite Schema
-- Built for zero vulnerabilities, strict relational integrity, and high performance

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'teacher', 'bursar', 'student', 'parent')),
  reference_id TEXT,
  full_name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  division TEXT NOT NULL CHECK(division IN ('Nursery', 'Primary', 'Junior College', 'Senior College')),
  termly_tuition REAL DEFAULT 35000,
  class_teacher_id INTEGER REFERENCES staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  division TEXT DEFAULT 'All',
  category TEXT DEFAULT 'Core'
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admission_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('Male', 'Female')),
  dob TEXT,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  address TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  assigned_class TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  session TEXT DEFAULT '2024/2025',
  term TEXT DEFAULT 'Second Term',
  ca_score REAL DEFAULT 0 CHECK(ca_score >= 0 AND ca_score <= 30),
  exam_score REAL DEFAULT 0 CHECK(exam_score >= 0 AND exam_score <= 70),
  total_score REAL DEFAULT 0 CHECK(total_score >= 0 AND total_score <= 100),
  grade TEXT,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id, session, term)
);

CREATE TABLE IF NOT EXISTS report_extras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session TEXT DEFAULT '2024/2025',
  term TEXT DEFAULT 'Second Term',
  attendance TEXT DEFAULT '{"opened":120,"present":116,"absent":4}',
  traits TEXT DEFAULT '{"politeness":5,"neatness":5,"punctuality":4,"attentiveness":5,"honesty":5,"initiative":4,"selfControl":5,"cooperation":4}',
  psychomotor TEXT DEFAULT '{"handwriting":4,"fluency":5,"sports":4,"drawing":4,"tools":4,"club":5}',
  teacher_comment TEXT DEFAULT 'A very diligent and focused student. Shows high academic promise.',
  principal_comment TEXT DEFAULT 'Commendable result. Maintain this excellent standard of discipline and hard work.',
  next_term_resumption TEXT DEFAULT '2025-04-28',
  promotion_status TEXT DEFAULT 'Promoted to Next Class',
  template TEXT DEFAULT 'ELITE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, session, term)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE NOT NULL,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session TEXT DEFAULT '2024/2025',
  term TEXT DEFAULT 'Second Term',
  title TEXT NOT NULL,
  amount_due REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'Unpaid' CHECK(status IN ('Paid', 'Partial', 'Unpaid')),
  due_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_no TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'Bank Transfer',
  reference TEXT,
  recorded_by TEXT,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_no TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  dob TEXT,
  applying_class TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  address TEXT,
  previous_school TEXT,
  status TEXT DEFAULT 'Under Review' CHECK(status IN ('Under Review', 'Screening Scheduled', 'Admitted', 'Declined')),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- FRONT DESK / RECEPTION MANAGEMENT TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS frontdesk_visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pass_no TEXT UNIQUE NOT NULL,
  visitor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  person_to_see TEXT NOT NULL,
  id_card_type TEXT,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  check_out_time DATETIME,
  status TEXT DEFAULT 'In Campus' CHECK(status IN ('In Campus', 'Checked Out')),
  badge_no TEXT,
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS frontdesk_enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  class_interested TEXT NOT NULL,
  source TEXT DEFAULT 'Walk-in',
  enquiry_date TEXT NOT NULL,
  follow_up_date TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Followed Up', 'Converted/Admitted', 'Closed'))
);

CREATE TABLE IF NOT EXISTS frontdesk_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK(call_type IN ('Incoming', 'Outgoing')),
  call_date TEXT NOT NULL,
  duration TEXT,
  purpose TEXT NOT NULL,
  follow_up_needed INTEGER DEFAULT 0,
  message TEXT
);

CREATE TABLE IF NOT EXISTS frontdesk_dispatch (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_type TEXT NOT NULL CHECK(dispatch_type IN ('Received', 'Dispatched')),
  reference_no TEXT UNIQUE NOT NULL,
  to_title TEXT NOT NULL,
  from_title TEXT NOT NULL,
  document_title TEXT NOT NULL,
  date TEXT NOT NULL,
  handled_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS frontdesk_complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_no TEXT UNIQUE NOT NULL,
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to TEXT,
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Investigating', 'Resolved', 'Dismissed')),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON frontdesk_visitors(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON frontdesk_enquiries(status);

-- ==========================================
-- ATTENDANCE MANAGEMENT TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS student_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Half Day', 'Excused')),
  remarks TEXT,
  recorded_by TEXT, -- teacher/admin username or bot
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'On Leave', 'Half Day')),
  clock_in DATETIME,
  clock_out DATETIME,
  remarks TEXT,
  recorded_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_student_att_date ON student_attendance(date, class_id);
CREATE INDEX IF NOT EXISTS idx_staff_att_date ON staff_attendance(date);

-- ==========================================
-- IN-HOUSE AI ACADEMIC & HOMEWORK TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS homework_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_code TEXT UNIQUE NOT NULL, -- e.g. HW-MTH-PRI4-001
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  key_concepts TEXT, -- JSON array or comma-separated concepts/keywords
  max_points INTEGER DEFAULT 10,
  due_date TEXT NOT NULL, -- Format: YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Closed', 'Archived'))
);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_code TEXT UNIQUE NOT NULL, -- e.g. SUB-2025-001
  assignment_id INTEGER NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted_by_phone TEXT NOT NULL,
  submission_channel TEXT DEFAULT 'WhatsApp' CHECK(submission_channel IN ('WhatsApp', 'Portal', 'Classroom')),
  submission_text TEXT,
  attachment_path TEXT,
  ai_evaluated INTEGER DEFAULT 0,
  ai_score REAL,
  ai_feedback TEXT,
  teacher_score REAL,
  teacher_feedback TEXT,
  status TEXT DEFAULT 'Submitted' CHECK(status IN ('Submitted', 'AI_Reviewed', 'Teacher_Approved', 'Returned')),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_learning_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  mastery_level TEXT DEFAULT 'Developing' CHECK(mastery_level IN ('Critical Support', 'Developing', 'Proficient', 'Exemplary')),
  score_trend TEXT DEFAULT 'Stable' CHECK(score_trend IN ('Declining', 'Stable', 'Improving', 'Rapid Surge')),
  weak_topics TEXT, -- JSON array of identified struggling areas
  strong_topics TEXT, -- JSON array of mastered areas
  last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS ai_parent_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  recommendation_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Academic Support', 'Attendance Alert', 'Exam Readiness', 'Positive Praise', 'Homework Intervention')),
  title TEXT NOT NULL,
  detailed_advice TEXT NOT NULL,
  actionable_steps TEXT NOT NULL, -- JSON array of steps parents can do at home
  urgency TEXT DEFAULT 'Medium' CHECK(urgency IN ('Low', 'Medium', 'High', 'Urgent')),
  is_delivered_whatsapp INTEGER DEFAULT 0,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_concept_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL, -- Nursery, Primary, JSS, SSS
  topic TEXT NOT NULL,
  subtopic TEXT,
  core_keywords TEXT NOT NULL,
  typical_misconceptions TEXT
);

CREATE INDEX IF NOT EXISTS idx_hw_class ON homework_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_hw_subject ON homework_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_sub_assignment ON homework_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_sub_student ON homework_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_profile_student ON student_learning_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_recs_student ON ai_parent_recommendations(student_id);

-- ========================================================
-- PAYROLL MANAGEMENT & BULK SALARY DISBURSEMENT (PAYSTACK)
-- ========================================================

CREATE TABLE IF NOT EXISTS staff_salary_structures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER UNIQUE NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  base_salary REAL NOT NULL DEFAULT 65000,
  housing_allowance REAL DEFAULT 15000,
  transport_allowance REAL DEFAULT 10000,
  teaching_allowance REAL DEFAULT 10000,
  tax_deduction REAL DEFAULT 5000,
  pension_deduction REAL DEFAULT 3500,
  other_deductions REAL DEFAULT 0,
  net_salary REAL NOT NULL DEFAULT 91500,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER UNIQUE NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,           -- e.g. 'Guaranty Trust Bank', 'Zenith Bank', 'First Bank'
  bank_code TEXT NOT NULL,           -- NIBSS bank code, e.g. '058', '057', '011'
  account_number TEXT NOT NULL,      -- 10-digit NUBAN
  account_name TEXT NOT NULL,        -- Account name verified from NIBSS/Paystack
  paystack_recipient_code TEXT,      -- Paystack transfer recipient code e.g. RCP_xxxxxx
  is_verified INTEGER DEFAULT 1,     -- 1 if verified via NIBSS/Paystack resolve
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_code TEXT UNIQUE NOT NULL,   -- e.g. PAY-2026-10-OCT
  month_year TEXT NOT NULL,          -- e.g. 'October 2026'
  period_start TEXT,
  period_end TEXT,
  total_staff INTEGER DEFAULT 0,
  total_gross REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  total_net_payout REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft', 'Approved', 'Processing', 'Disbursed', 'Partially_Failed', 'Cancelled')),
  paystack_batch_code TEXT,          -- Paystack bulk transfer reference/batch code
  created_by TEXT DEFAULT 'Bursar',
  approved_by TEXT,
  disbursed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  base_salary REAL NOT NULL,
  total_allowances REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  transfer_reference TEXT UNIQUE,    -- e.g. TRF-PAY-2026-10-STF01
  paystack_transfer_code TEXT,       -- e.g. TRF_xxxxxxxx
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Queued', 'Success', 'Failed', 'Reversed')),
  failure_reason TEXT,
  disbursed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payroll_batch ON payroll_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_staff ON payroll_items(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_staff ON staff_salary_structures(staff_id);
CREATE INDEX IF NOT EXISTS idx_bank_staff ON staff_bank_accounts(staff_id);

-- Institutional System Configuration Table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  school_name TEXT DEFAULT 'Eagle Power Schools Awka',
  school_motto TEXT DEFAULT 'Love, Truth & Service',
  current_session TEXT DEFAULT '2024/2025',
  current_term TEXT DEFAULT 'Second Term',
  next_resumption_date TEXT DEFAULT '2025-05-05',
  active_report_template TEXT DEFAULT 'classic_british',
  principal_name TEXT DEFAULT 'Adaeze Uzoefuna',
  logo_url TEXT DEFAULT '/assets/official-logo.jpg',
  contact_phone TEXT DEFAULT '+234 803 359 1058',
  contact_email TEXT DEFAULT 'info@eaglepowerschools.com.ng',
  address TEXT DEFAULT '2 & 9 Amikwo Road, Awka, Anambra State',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial configuration if not present
INSERT OR IGNORE INTO system_settings (id, current_session, current_term, next_resumption_date)
VALUES (1, '2024/2025', 'Second Term', '2025-05-05');

-- WhatsApp Broadcast & Notification Log
CREATE TABLE IF NOT EXISTS whatsapp_broadcast_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broadcast_type TEXT NOT NULL DEFAULT 'ALL',
  target_audience TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  dispatched_by TEXT NOT NULL,
  status TEXT DEFAULT 'SENT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


