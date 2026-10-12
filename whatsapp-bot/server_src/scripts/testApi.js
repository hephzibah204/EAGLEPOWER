const BASE_URL = 'http://localhost:5050/api';

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
    const res = await fetch(`${BASE_URL}/academics/classes`);
    const data = await res.json();
    if (!res.ok || data.count < 10) throw new Error(`Expected at least 10 classes, got ${data.count}`);
  });

  // 5. Academics Subjects
  await test('Get Curriculum Subjects', async () => {
    const res = await fetch(`${BASE_URL}/academics/subjects`);
    const data = await res.json();
    if (!res.ok || data.count < 20) throw new Error(`Expected subjects, got ${data.count}`);
  });

  // 6. Students Directory
  await test('Search Students (96 Migrated Students)', async () => {
    const res = await fetch(`${BASE_URL}/students?limit=10`);
    const data = await res.json();
    if (!res.ok || data.total !== 96) throw new Error(`Expected 96 students, got ${data.total}`);
  });

  // 7. Student Quick Lookup
  await test('Student Quick Lookup (ESE2009012)', async () => {
    const res = await fetch(`${BASE_URL}/students/lookup/ESE2009012`);
    const data = await res.json();
    if (!res.ok || data.data.first_name !== 'Ugochi') throw new Error(`Expected Ugochi, got ${data.data?.first_name}`);
  });

  // 8. Staff Roster
  await test('Staff Roster Listing', async () => {
    const res = await fetch(`${BASE_URL}/staff`);
    const data = await res.json();
    if (!res.ok || data.count < 5) throw new Error(`Expected staff list, got ${data.count}`);
  });

  // 9. Comprehensive E-Report Card with Class Ranking
  await test('E-Report Card Generation with Computed Class Position', async () => {
    const res = await fetch(`${BASE_URL}/exams/report-card/ESE2009012`);
    const data = await res.json();
    if (!res.ok || !data.report_card?.performance_summary?.class_position) {
      throw new Error(`Report card position missing: ${JSON.stringify(data)}`);
    }
  });

  // 10. Bursary Stats
  await test('Finance / Bursary Analytics', async () => {
    const res = await fetch(`${BASE_URL}/finance/stats`);
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
    const res = await fetch(`${BASE_URL}/frontdesk/stats`);
    const data = await res.json();
    if (!res.ok || data.stats.visitors_in_campus === undefined) throw new Error('Front desk stats failed');
  });

  // 14. Front Desk Visitors Check-in & Listing
  let testVisitorId = null;
  await test('Front Desk Visitor Check-In & Security Pass Generation', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'PATCH'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('Visitor checkout failed');
  });

  // 16. Front Desk Enquiries
  await test('Front Desk Admission Enquiries & Walk-in Leads', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/enquiries`);
    const data = await res.json();
    if (!res.ok || data.count < 3) throw new Error('Enquiries list failed');
  });

  // 17. Front Desk Call Logs & Dispatch Records
  await test('Front Desk Phone Calls & Postal Dispatch Records', async () => {
    const resCalls = await fetch(`${BASE_URL}/frontdesk/calls`);
    const resDisp = await fetch(`${BASE_URL}/frontdesk/dispatch`);
    const dataCalls = await resCalls.json();
    const dataDisp = await resDisp.json();
    if (!resCalls.ok || !resDisp.ok || dataCalls.count === 0 || dataDisp.count === 0) {
      throw new Error('Call logs or dispatch failed');
    }
  });

  // 18. Front Desk Complaints / Feedback
  await test('Front Desk Stakeholder Complaints & Feedback Management', async () => {
    const res = await fetch(`${BASE_URL}/frontdesk/complaints`);
    const data = await res.json();
    if (!res.ok || data.count === 0) throw new Error('Complaints query failed');
  });

  // 19. Security Hardening Status
  await test('Security Hardening & Legacy Mitigation Status', async () => {
    const res = await fetch(`${BASE_URL}/audit/security-status`);
    const data = await res.json();
    if (!res.ok || !data.diagnostics?.legacy_php_mitigation) throw new Error('Security status check failed');
  });

  // 20. Master Class Broadsheet Matrix
  await test('Master Broadsheet Matrix with Ranking & WAEC Averages', async () => {
    const res = await fetch(`${BASE_URL}/exams/class-broadsheet?class_id=1`);
    const data = await res.json();
    if (!res.ok || !data.success || !data.students || !data.statistics) {
      throw new Error('Class broadsheet calculation failed');
    }
  });

  // 21. Bulk Class Report Cards Generation
  await test('Bulk Class Report Cards Generation for Batch Printing', async () => {
    const res = await fetch(`${BASE_URL}/exams/class-reports/1`);
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
        student_id: 1,
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

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
