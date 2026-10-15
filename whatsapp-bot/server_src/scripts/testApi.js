const BASE_URL = 'http://127.0.0.1:5050/api';

async function runTests() {
  console.log('🧪 Starting EaglePower EduCore Backend API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!res.ok || data.status !== 'healthy') throw new Error(`Unexpected: ${JSON.stringify(data)}`);
  });

  // 2. Admin Login
  let adminToken = '';
  await test('Admin Authentication (Bcrypt + JWT)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'EagleAdmin2025!' })
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.message || 'Login failed');
    adminToken = data.token;
  });

  // 2b. SuperAdmin Login
  let superadminToken = '';
  await test('SuperAdmin Authentication (Bcrypt + JWT)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'EagleSuperAdmin2025!' })
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.message || 'SuperAdmin login failed');
    superadminToken = data.token;
  });

  // 3. Student Portal Login (Real Migrated Student)
  let studentToken = '';
  await test('Student Portal Login (Admission No: ESE2009012)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ESE2009012', password: 'Eagle2025!' })
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.message || 'Login failed');
    studentToken = data.token;
  });

  // 4. Academics Classes
  await test('Get Academic Classes', async () => {
    const res = await fetch(`${BASE_URL}/academics/classes`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.count < 10) throw new Error(`Expected at least 10 classes, got ${data.count}`);
  });

  // 5. Academics Subjects
  let testSubjectRealId = null;
  await test('Get Curriculum Subjects', async () => {
    const res = await fetch(`${BASE_URL}/academics/subjects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.count < 20) throw new Error(`Expected subjects, got ${data.count}`);
    testSubjectRealId = data.data[0].id;
  });

  // 6. Students Directory
  await test('Search Students (96+ Migrated Students)', async () => {
    const res = await fetch(`${BASE_URL}/students?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.total < 96) throw new Error(`Expected at least 96 students, got ${data.total}`);
  });

  // 7. Student Quick Lookup (Authenticated & Scoped)
  let testStudentRealId = null;
  let testStudentClassId = null;
  await test('Student Quick Lookup (ESE2009012)', async () => {
    const res = await fetch(`${BASE_URL}/students/lookup/ESE2009012`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.data.first_name !== 'Ugochi') throw new Error(`Expected Ugochi, got ${data.data?.first_name}`);
    testStudentRealId = data.data.id;
    testStudentClassId = data.data.class_id;
  });

  // 8. Staff Roster (Authenticated)
  await test('Staff Roster Listing', async () => {
    const res = await fetch(`${BASE_URL}/staff`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.count < 5) throw new Error(`Expected staff list, got ${data.count}`);
  });

  // 9. Comprehensive E-Report Card with Class Ranking
  await test('E-Report Card Generation with Computed Class Position', async () => {
    const res = await fetch(`${BASE_URL}/exams/report-card/ESE2009012`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.report_card?.performance_summary?.class_position) {
      throw new Error(`Report card position missing: ${JSON.stringify(data)}`);
    }
  });

  // 10. Bursary Stats (Restricted to Bursar/Admin)
  await test('Finance / Bursary Analytics', async () => {
    const res = await fetch(`${BASE_URL}/finance/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.data.total_invoices === 0) throw new Error('Bursary stats empty');
  });

  // 11. Public Online Admission Submission
  let createdAppNo = '';
  await test('Public Online Admission Application Intake', async () => {
    const res = await fetch(`${BASE_URL}/admissions/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: 'David Obiora Eze',
        gender: 'Male',
        dob: '2017-05-14',
        applying_class: 'Primary 2',
        parent_name: 'Engr. Obiora Eze',
        parent_phone: '+234 803 999 8888',
        parent_email: 'obiora.eze@gmail.com',
        previous_school: 'Great Heritage Academy'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.application?.application_no) throw new Error(data.message || 'Admission failed');
    createdAppNo = data.application.application_no;
  });

  // 12. Check Admission Status
  await test('Check Admission Status by Application No', async () => {
    const res = await fetch(`${BASE_URL}/admissions/${createdAppNo}`);
    const data = await res.json();
    if (!res.ok || data.data.status !== 'Under Review') throw new Error('Admission status check failed');
  });

  // 13. Front Desk Stats Overview
  await test('Front Desk Stats (Visitors in Campus, Inquiries, Complaints)', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.stats.visitors_in_campus === undefined) throw new Error('Front desk stats failed');
  });

  // 14. Front Desk Visitors Check-in & Listing
  let testVisitorId = null;
  await test('Front Desk Visitor Check-In & Security Pass Generation', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        visitor_name: 'Sir Jude Okonkwo',
        phone: '0803 777 6655',
        purpose: 'School Fees Inquiry & Bursary Clearance',
        person_to_see: 'Mr. Chukwuma Okafor (Bursar)',
        badge_no: 'BADGE-12'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.visitor?.pass_no) throw new Error(data.message || 'Visitor checkin failed');
    testVisitorId = data.visitor.id;
  });

  // 15. Front Desk Visitor Checkout
  await test('Front Desk Visitor Check-Out Timestamp', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/visitors/${testVisitorId}/checkout`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('Visitor checkout failed: ' + (data.message || ''));
  });

  // 16. Front Desk Enquiries
  await test('Front Desk Admission Enquiries & Walk-in Leads', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/enquiries`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.count < 3) throw new Error('Enquiries list failed');
  });

  // 17. Front Desk Call Logs & Dispatch Records
  await test('Front Desk Phone Calls & Postal Dispatch Records', async () => {
    const resCalls = await fetch(`${BASE_URL}/frontdesk/calls`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const resDisp = await fetch(`${BASE_URL}/frontdesk/dispatch`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataCalls = await resCalls.json();
    const dataDisp = await resDisp.json();
    if (!resCalls.ok || !resDisp.ok || dataCalls.count === 0 || dataDisp.count === 0) {
      throw new Error('Call logs or dispatch failed');
    }
  });

  // 18. Front Desk Complaints / Feedback
  await test('Front Desk Stakeholder Complaints & Feedback Management', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/complaints`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.count === 0) throw new Error('Complaints query failed');
  });

  // 19. Security Hardening Status
  await test('Security Hardening & Legacy Mitigation Status', async () => {
    const res = await fetch(`${BASE_URL}/audit/security-status`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.diagnostics?.legacy_php_mitigation) throw new Error('Security status check failed');
  });

  // 20. Master Class Broadsheet Matrix
  await test('Master Broadsheet Matrix with Ranking & WAEC Averages', async () => {
    const res = await fetch(`${BASE_URL}/exams/class-broadsheet?class_id=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.students || !data.statistics) {
      throw new Error('Class broadsheet calculation failed');
    }
  });

  // 21. Bulk Class Report Cards Generation
  await test('Bulk Class Report Cards Generation for Batch Printing', async () => {
    const res = await fetch(`${BASE_URL}/exams/class-reports/1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.data)) {
      throw new Error('Bulk class reports generation failed');
    }
  });

  // 22. Student Report Extras & Traits Persistence
  await test('Save Student Report Extras & Traits (Attendance, Comments, Template)', async () => {
    const res = await fetch(`${BASE_URL}/exams/report-extras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        student_id: testStudentRealId,
        session: '2024/2025',
        term: 'Second Term',
        attendance: { opened: 120, present: 118, absent: 2 },
        traits: { politeness: 5, neatness: 5, punctuality: 4 },
        psychomotor: { handwriting: 5, fluency: 5, sports: 4 },
        teacher_comment: 'Sterling performance in class.',
        principal_comment: 'Keep up the good work.',
        template: 'ELITE'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('Saving report extras failed');
  });

  // 23. Security: Public Parent Self-Registration Blocked (401) & Admin Provisioning Authorized
  await test('Security: Public Registration Blocked (401) & Admin Parent Provisioning Works', async () => {
    const parentUsername = `parent_api_${Date.now()}`;
    const payload = {
      username: parentUsername,
      password: 'ParentSecure2025!',
      full_name: 'Mrs. Adaeze Okeke',
      email: `${parentUsername}@gmail.com`,
      phone: '07066397577', // Matches ESE2009012 guardian record
      role: 'parent',
      reference_id: 'ESE2009012'
    };

    // A. Unauthenticated public registration attempt MUST be rejected with 401
    const unauthRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for public self-registration, but got status ${unauthRes.status}`);
    }

    // B. Authenticated Administrator can provision parent account
    const authRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await authRes.json();
    if (!authRes.ok || !data.token || data.user.role !== 'parent') {
      throw new Error(data.message || 'Admin parent provisioning failed');
    }
  });

  // 24. Admin Onboarding Staff Member
  let newStaffUsername = `teacher_api_${Date.now()}`;
  await test('Admin Onboard Staff Member (POST /api/staff)', async () => {
    const res = await fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Mrs. Folake Adeyemi',
        role: 'English Language Teacher',
        email: `${newStaffUsername}@eaglepowerschools.com.ng`,
        phone: '08134449988',
        qualification: 'B.A English, PGDE',
        assigned_class: 'Junior College (JSS 2)',
        username: newStaffUsername,
        password: 'EnglishTeacher2025!'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.staff?.staff_no || !data.portal_account) {
      throw new Error(data.message || 'Staff onboarding failed');
    }
  });

  // 25. Login with Newly Created Staff Credentials
  await test('Login with Newly Onboarded Staff Credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newStaffUsername,
        password: 'EnglishTeacher2025!'
      })
    });
    const data = await res.json();
    if (!res.ok || data.user.role !== 'teacher') {
      throw new Error(data.message || 'Login with new staff credentials failed');
    }
  });

  // 26. Teacher Assign Homework (POST /api/homework)
  let testHwId = null;
  await test('Teacher Assign Homework with AI Concept Rubric (POST /api/homework)', async () => {
    const res = await fetch(`${BASE_URL}/homework`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        class_id: 1,
        subject_id: testSubjectRealId || 56,
        title: 'Fractions & Proportions Homework',
        description: 'Solve textbook word problem 4 on adding fractions with distinct denominators.',
        key_concepts: 'denominator, numerator, simplify',
        max_points: 10,
        due_date: '2026-10-30'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.assignment?.id) throw new Error(data.message || 'Homework creation failed');
    testHwId = data.assignment.id;
  });

  // 27. Parent/Student Submit Homework with In-House AI Auto-Grading (POST /api/homework/:id/submit)
  await test('Parent/Student Submit Homework & Receive In-House AI Evaluation', async () => {
    const res = await fetch(`${BASE_URL}/homework/${testHwId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        student_id: testStudentRealId,
        submitted_by_phone: '08031234567',
        submission_channel: 'Portal',
        submission_text: 'To add these fractions, first identify the common denominator. Then add the numerator values and simplify to the lowest term.'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.submission?.ai_score || !data.submission?.ai_feedback) {
      throw new Error(data.message || 'Homework submission AI evaluation failed');
    }
  });

  // 28. In-House AI Student Academic Progress Analysis (GET /api/progress/student/:id)
  await test('In-House AI Student Academic Trajectory & Gap Detection', async () => {
    const res = await fetch(`${BASE_URL}/progress/student/${testStudentRealId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.data?.metrics?.readiness_tier || data.data.metrics.term_average === undefined) {
      throw new Error('Student progress AI analysis failed');
    }
  });

  // 29. In-House AI Personalized Parent Recommendations (GET /api/progress/student/:id/recommendations)
  await test('In-House AI Parent Recommendations & Home Coaching Synthesis', async () => {
    const res = await fetch(`${BASE_URL}/progress/student/${testStudentRealId}/recommendations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Parent recommendations AI generation failed');
    }
  });

  // 30. School-Wide Report Card Template Selection (POST /api/reports/template)
  await test('School-Wide Report Card Template Selection Persistence', async () => {
    const res = await fetch(`${BASE_URL}/reports/template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        template: 'CHERITH',
        session: '2024/2025',
        term: 'Second Term'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success || data.template !== 'CHERITH') {
      throw new Error(data.message || 'Template persistence failed');
    }
  });

  // 31. Query Daily Student Attendance Register (GET /api/attendance/students)
  await test('Query Class Daily Attendance Register (GET /api/attendance/students)', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/attendance/students?class_id=${testStudentClassId || 1}&date=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.records)) {
      throw new Error('Attendance register query failed');
    }
  });

  // 32. Batch Save Daily Student Attendance (POST /api/attendance/students/batch)
  await test('Batch Record Student Daily Attendance (POST /api/attendance/students/batch)', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/attendance/students/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        class_id: testStudentClassId || 1,
        date: today,
        records: [
          { student_id: testStudentRealId, status: 'Present', remarks: 'Punctual' }
        ]
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Batch attendance recording failed');
    }
  });

  // 33. Security Guard: Anonymous Access to Protected Financial Data Rejected (401)
  await test('Security: Unauthenticated Access to Bursary Stats Rejected (401)', async () => {
    const res = await fetch(`${BASE_URL}/finance/stats`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 34. Security Guard: Anonymous Access to Visitor Log Rejected (401)
  await test('Security: Unauthenticated Access to Visitor Log Rejected (401)', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/visitors`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 35. Security Guard: Student IDOR Prevention on Report Cards (403)
  await test('Security: Student IDOR Access to Another Peer\'s Report Card Rejected (403)', async () => {
    // Student token belongs to ESE2009012. Attempt to query peer 2010134483.
    const res = await fetch(`${BASE_URL}/exams/report-card/2010134483`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden on peer report card, got ${res.status}`);
  });

  // 36. Security Guard: Student IDOR Prevention on Profile Lookup (403)
  await test('Security: Student IDOR Access to Another Peer\'s Profile Rejected (403)', async () => {
    const res = await fetch(`${BASE_URL}/students/lookup/2010134483`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden on peer profile lookup, got ${res.status}`);
  });

  // 37. In-House AI: Intelligent Pedagogical & Curriculum Q&A (POST /api/progress/ask-ai)
  await test('In-House AI: Intelligent Pedagogical & Curriculum Q&A (POST /api/progress/ask-ai)', async () => {
    const res = await fetch(`${BASE_URL}/progress/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        question: 'Explain the quadratic formula and common pitfalls in mathematics'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.data?.answer || !['MATH_FORMULA', 'ACADEMIC_EXPLANATION'].includes(data.data.intent)) {
      throw new Error(data.message || 'In-House AI Q&A test failed');
    }
  });

  // 37. Payroll: Get Nigerian Banks Directory
  await test('Payroll: Get Nigerian Banks Directory (GET /api/payroll/banks)', async () => {
    const res = await fetch(`${BASE_URL}/payroll/banks`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.data) || data.data.length < 5) {
      throw new Error('Failed to retrieve Nigerian banks directory');
    }
  });

  // 38. Payroll: Overview Stats & Budget
  await test('Payroll: Overview & Budget Stats (GET /api/payroll/overview)', async () => {
    const res = await fetch(`${BASE_URL}/payroll/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.stats?.active_staff === 0 || typeof data.stats?.monthly_net_payout !== 'number') {
      throw new Error('Payroll overview calculation failed');
    }
  });

  // 39. Payroll: Staff Salary Roster Listing
  await test('Payroll: Staff Salary Roster (GET /api/payroll/staff-roster)', async () => {
    const res = await fetch(`${BASE_URL}/payroll/staff-roster`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok || data.count < 5 || !data.data[0].net_salary) {
      throw new Error('Staff salary roster failed');
    }
  });

  // 40. Payroll: Generate Monthly Payroll Roll (POST /api/payroll/batches/generate)
  let testBatchId = null;
  await test('Payroll: Generate Monthly Payroll Batch (POST /api/payroll/batches/generate)', async () => {
    const res = await fetch(`${BASE_URL}/payroll/batches/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        month_year: `Test Run ${Date.now().toString().slice(-4)}`
      })
    });
    const data = await res.json();
    if (!res.ok || !data.batch?.id || data.batch.total_net_payout <= 0) {
      throw new Error(data.message || 'Batch payroll generation failed');
    }
    testBatchId = data.batch.id;
  });

  // 41. Payroll: Disburse Bulk Salary via Paystack Transfers (POST /api/payroll/batches/:id/disburse)
  await test('Payroll: Disburse Bulk Salary via Paystack (POST /api/payroll/batches/:id/disburse)', async () => {
    const res = await fetch(`${BASE_URL}/payroll/batches/${testBatchId}/disburse`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.gateway_batch_code) {
      throw new Error(data.message || 'Bulk payroll disbursement failed');
    }
  });

  // 42. In-House AI: Single Student Report Card Comments (POST /api/exams/generate-ai-comments)
  await test('In-House AI: Generate Report Card Comments for Student (POST /api/exams/generate-ai-comments)', async () => {
    const res = await fetch(`${BASE_URL}/exams/generate-ai-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        admission_no: 'ESE2009012',
        session: '2024/2025',
        term: 'Second Term'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.comments?.teacherComment || !data.comments?.principalComment) {
      throw new Error(data.message || 'Failed to generate single student AI report card comments');
    }
  });

  // 43. In-House AI: Class Batch Auto-Generate Report Card Remarks (POST /api/exams/batch-generate-ai-comments)
  await test('In-House AI: Batch Generate & Persist Class Remarks (POST /api/exams/batch-generate-ai-comments)', async () => {
    const res = await fetch(`${BASE_URL}/exams/batch-generate-ai-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        class_id: 2,
        session: '2024/2025',
        term: 'Second Term',
        overwrite: true
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success || typeof data.generated_count !== 'number') {
      throw new Error(data.message || 'Failed to batch generate AI report card remarks');
    }
  });

  // 45. Security Hardening: Active Threat Defense Blocks .env & Sensitive Probes (403)
  await test('Security: Threat Defense Blocks Malicious File Probes (GET /.env)', async () => {
    const res = await fetch(`http://localhost:5050/.env`);
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for .env probe, but got status ${res.status}`);
    }
  });

  // 46. Security Hardening: Threat Defense Blocks Automated SQLi Probes in Query (403)
  await test('Security: Threat Defense Blocks SQLi Scanners in Query (GET /api/academics/classes?probe=UNION+SELECT)', async () => {
    const res = await fetch(`${BASE_URL}/academics/classes?probe=UNION%20SELECT%201,2,3`);
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for SQLi probe, but got status ${res.status}`);
    }
  });

  // 47. Security Hardening: XSS Payload Sanitization on Intake
  await test('Security: Input Sanitizer Neutralizes Stored XSS Markup (POST /api/admissions/apply)', async () => {
    const res = await fetch(`${BASE_URL}/admissions/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: 'Sanitize Test<script>alert("xss")</script>',
        parent_name: 'Guardian Test',
        parent_phone: '08099887766',
        parent_email: 'sanitize@example.com',
        applying_class: 'JSS 1',
        gender: 'Male',
        address: '12 Test Road'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.application?.application_no) {
      throw new Error(data.message || 'Application intake failed');
    }
    // Verify applicant name was stripped of <script> tag
    const verifyRes = await fetch(`${BASE_URL}/admissions/${data.application.application_no}`);
    const verifyData = await verifyRes.json();
    if (verifyData.data?.student_name.includes('<script>')) {
      throw new Error('XSS payload was not sanitized!');
    }
  });

  // 48. Security Hardening: Path Traversal Static File Guard (403)
  await test('Security: Static Asset Path Traversal Guard (GET /../../server/src/index.js)', async () => {
    const res = await fetch(`http://localhost:5050/..%2f..%2fserver%2fsrc%2findex.js`);
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for path traversal attempt, but got status ${res.status}`);
    }
  });

  // 49. SuperAdmin: System Settings (GET /api/system/settings)
  await test('SuperAdmin: Read Institutional Parameters (GET /api/system/settings)', async () => {
    const res = await fetch(`${BASE_URL}/system/settings`);
    const data = await res.json();
    if (!res.ok || !data.data?.current_session || !data.data?.current_term) {
      throw new Error(data.message || 'Failed to read institutional settings');
    }
  });

  // 50. SuperAdmin: Update System Settings (PUT /api/system/settings)
  await test('SuperAdmin: Configure Session & Resumption (PUT /api/system/settings)', async () => {
    const res = await fetch(`${BASE_URL}/system/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({
        current_session: '2024/2025',
        current_term: 'Second Term',
        next_resumption_date: '2025-05-05',
        school_motto: 'Love, Truth & Service'
      })
    });
    const data = await res.json();
    if (!res.ok || data.data?.current_session !== '2024/2025') {
      throw new Error(data.message || 'Failed to update system settings');
    }
  });

  // 51. SuperAdmin: Database Backup Snapshot (POST /api/system/backup)
  await test('SuperAdmin: Trigger WAL Checkpoint & Backup Snapshot (POST /api/system/backup)', async () => {
    const res = await fetch(`${BASE_URL}/system/backup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !data.backup?.filename || !Array.isArray(data.recent_backups)) {
      throw new Error(data.message || 'Failed to trigger database backup');
    }
  });

  // 52. SuperAdmin IAM: User Directory (GET /api/users)
  await test('SuperAdmin IAM: User Accounts Directory with Lockout Telemetry (GET /api/users)', async () => {
    const res = await fetch(`${BASE_URL}/users?limit=10`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.data) || data.total < 5) {
      throw new Error(data.message || 'Failed to list IAM users');
    }
  });

  // 53. SuperAdmin IAM: User Status Toggle & Lockout Release (PATCH & POST /api/users/:id)
  await test('SuperAdmin IAM: Freeze Account & Release Lockout Controls', async () => {
    // Find teacher user to toggle
    const listRes = await fetch(`${BASE_URL}/users?role=teacher&limit=1`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const listData = await listRes.json();
    if (!listData.data || listData.data.length === 0) throw new Error('No teacher found for IAM status test');
    const targetUser = listData.data[0];

    // Toggle status
    const statusRes = await fetch(`${BASE_URL}/users/${targetUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({ is_active: 0 })
    });
    const statusData = await statusRes.json();
    if (!statusRes.ok || statusData.is_active !== 0) throw new Error('Failed to suspend teacher account');

    // Reactivate status
    const reactiveRes = await fetch(`${BASE_URL}/users/${targetUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({ is_active: 1 })
    });
    if (!reactiveRes.ok) throw new Error('Failed to reactivate teacher account');

    // Release lockout test
    const unlockRes = await fetch(`${BASE_URL}/users/${targetUser.id}/release-lockout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    if (!unlockRes.ok) throw new Error('Failed to release account lockout');
  });

  // 54. SuperAdmin Security: WAF Threat Radar Telemetry (GET /api/system/threat-defense)
  await test('SuperAdmin Security: Threat Defense Radar Telemetry (GET /api/system/threat-defense)', async () => {
    const res = await fetch(`${BASE_URL}/system/threat-defense`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const data = await res.json();
    if (!res.ok || typeof data.data?.totalTracked !== 'number') {
      throw new Error(data.message || 'Failed to retrieve Threat Radar telemetry');
    }
  });

  // 55. SuperAdmin Student Master: Edit Student Details (PUT /api/students/:id)
  let testStudentId = null;
  await test('SuperAdmin Student Master: Edit Student Profile (PUT /api/students/:id)', async () => {
    const listRes = await fetch(`${BASE_URL}/students?limit=1`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const listData = await listRes.json();
    if (!listData.data || listData.data.length === 0) throw new Error('No student found to test edit');
    const targetStudent = listData.data[0];
    testStudentId = targetStudent.id;

    const editRes = await fetch(`${BASE_URL}/students/${testStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({
        first_name: targetStudent.first_name,
        last_name: targetStudent.last_name,
        gender: targetStudent.gender,
        guardian_name: 'Chief Obinna Okoye',
        guardian_phone: '08033591058',
        is_active: targetStudent.is_active
      })
    });
    const editData = await editRes.json();
    if (!editRes.ok || !editData.success) {
      throw new Error(editData.message || 'Failed to edit student record');
    }
  });

  // 56. SuperAdmin Student Master: Quick Transfer & Bulk Promotion
  await test('SuperAdmin Student Master: Transfer & Bulk Promotion', async () => {
    if (!testStudentId) throw new Error('No test student id');

    // Transfer student to class 1
    const xferRes = await fetch(`${BASE_URL}/students/${testStudentId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({ target_class_id: 1 })
    });
    const xferData = await xferRes.json();
    if (!xferRes.ok || !xferData.success) {
      throw new Error(xferData.message || 'Transfer failed');
    }

    // Bulk promote array of student IDs
    const promoRes = await fetch(`${BASE_URL}/students/bulk-promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({
        student_ids: [testStudentId],
        target_class_id: 1
      })
    });
    const promoData = await promoRes.json();
    if (!promoRes.ok || !promoData.success) {
      throw new Error(promoData.message || 'Bulk promote failed');
    }
  });

  // 57. SuperAdmin Curriculum Architect: Update Class & Subject Management
  await test('SuperAdmin Curriculum: Update Class & Create/Update Subject', async () => {
    // 1. Update Class
    const classRes = await fetch(`${BASE_URL}/academics/classes/1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({
        name: 'Creche',
        division: 'Nursery',
        termly_tuition: 45000
      })
    });
    const classData = await classRes.json();
    if (!classRes.ok || !classData.success) {
      throw new Error(classData.message || 'Failed to update class');
    }

    // 2. Create Unique Test Subject
    const testCode = `TST${Date.now().toString().slice(-4)}`;
    const subCreateRes = await fetch(`${BASE_URL}/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({
        name: 'Robotics & Automation',
        code: testCode,
        division: 'Senior College',
        category: 'Vocational'
      })
    });
    const subCreateData = await subCreateRes.json();
    if (!subCreateRes.ok || !subCreateData.success) {
      throw new Error(subCreateData.message || 'Failed to create subject');
    }

    // 3. Update Subject
    const subEditRes = await fetch(`${BASE_URL}/academics/subjects/${subCreateData.subject_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({
        name: 'Advanced Robotics & AI',
        code: testCode,
        division: 'Senior College',
        category: 'Vocational'
      })
    });
    const subEditData = await subEditRes.json();
    if (!subEditRes.ok || !subEditData.success) {
      throw new Error(subEditData.message || 'Failed to update subject');
    }

    // 4. Delete Test Subject
    const subDelRes = await fetch(`${BASE_URL}/academics/subjects/${subCreateData.subject_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    if (!subDelRes.ok) throw new Error('Failed to delete test subject');
  });

  // 58. SuperAdmin System Governance: Health Status & Term-Lock Control
  await test('SuperAdmin Governance: Health Status & Term-Lock Controls', async () => {
    // Check Status
    const statusRes = await fetch(`${BASE_URL}/system/status`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const statusData = await statusRes.json();
    if (!statusRes.ok || statusData.status !== 'operational' || !statusData.database) {
      throw new Error(statusData.message || 'Failed to fetch system status');
    }

    // Toggle Term Lock ON
    const lockOnRes = await fetch(`${BASE_URL}/system/term-lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({ locked: true })
    });
    const lockOnData = await lockOnRes.json();
    if (!lockOnRes.ok || lockOnData.term_locked !== true) {
      throw new Error('Failed to lock term grade entry');
    }

    // Toggle Term Lock OFF
    const lockOffRes = await fetch(`${BASE_URL}/system/term-lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superadminToken}`
      },
      body: JSON.stringify({ locked: false })
    });
    const lockOffData = await lockOffRes.json();
    if (!lockOffRes.ok || lockOffData.term_locked !== false) {
      throw new Error('Failed to unlock term grade entry');
    }
  });

  // 59. SuperAdmin System Backup: Database Snapshot & Backups Directory
  await test('SuperAdmin System: Snapshot DB & List Backups Archive', async () => {
    // Trigger snapshot
    const backupRes = await fetch(`${BASE_URL}/system/backup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const backupData = await backupRes.json();
    if (!backupRes.ok || !backupData.backup?.filename) {
      throw new Error(backupData.message || 'Failed to create DB backup');
    }

    // Fetch backup archives
    const listRes = await fetch(`${BASE_URL}/system/backups`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });
    const listData = await listRes.json();
    if (!listRes.ok || !Array.isArray(listData.data) || listData.data.length === 0) {
      throw new Error('Failed to list backups archive');
    }
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
