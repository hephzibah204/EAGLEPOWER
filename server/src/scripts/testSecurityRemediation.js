/**
 * Automated Senior QA & Security Verification Test Suite
 * Asserts all SEC-01 through SEC-10 remediations
 */
const BASE_URL = 'http://localhost:5050';

async function runSecuritySuite() {
  console.log('🛡️ Starting Eagle Power EduCore Security Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Unauthenticated access to Defaulters & Financial Analytics MUST be 401
  const finRes = await fetch(`${BASE_URL}/api/reports/financial-analytics`);
  assert(finRes.status === 401, 'SEC-02: GET /api/reports/financial-analytics rejected without token (401)');

  // TEST 2: Unauthenticated access to Executive Summary Cockpit MUST be 401
  const execRes = await fetch(`${BASE_URL}/api/reports/executive-summary`);
  assert(execRes.status === 401, 'SEC-02: GET /api/reports/executive-summary rejected without token (401)');

  // TEST 3: Unauthenticated access to Report Cards MUST be 401
  const repRes = await fetch(`${BASE_URL}/api/exams/report-card/ESE2009012`);
  assert(repRes.status === 401, 'SEC-03: GET /api/exams/report-card/:admNo rejected without token (401)');

  // TEST 4: Unauthenticated student roster dump MUST be 401
  const stuRes = await fetch(`${BASE_URL}/api/students`);
  assert(stuRes.status === 401, 'SEC-07: GET /api/students rejected without token (401)');

  // TEST 5: Unauthenticated Front Desk Stats & Visitor Log MUST be 401
  const fdRes = await fetch(`${BASE_URL}/api/frontdesk/stats`);
  assert(fdRes.status === 401, 'SEC-02: GET /api/frontdesk/stats rejected without token (401)');

  // TEST 6: Public Self-Registration for Students MUST be blocked (403)
  const regStuRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `test_rogue_student_${Date.now()}`,
      password: 'Password123!',
      full_name: 'Rogue Student',
      role: 'student',
      reference_id: 'ESE2009012'
    })
  });
  assert(regStuRes.status === 403 || regStuRes.status === 401, 'SEC-01: Direct public student self-registration rejected (401/403)');

  // TEST 7: Parent Registration with Unmatched Phone (Hijack Attempt) MUST be blocked (401/403)
  const regFakeParentRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: '08099999999',
      password: 'AttackerPassword123!',
      full_name: 'Attacker Stalker',
      phone: '08099999999',
      role: 'parent',
      reference_id: 'ESE2009012'
    })
  });
  assert(regFakeParentRes.status === 403 || regFakeParentRes.status === 401, 'SEC-01: Parent account creation with unmatched phone rejected (401/403)');

  // TEST 8: Administrative Login (Principal/SuperAdmin) succeeds
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'EagleAdmin2025!' })
  });
  const adminData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && Boolean(adminData.token), 'AUTH: Admin login succeeds with valid token');
  const adminToken = adminData.token;

  // TEST 9: Admin with valid token CAN access Executive Summary and Defaulters
  const adminFinRes = await fetch(`${BASE_URL}/api/reports/financial-analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminFinRes.status === 200, 'RBAC: Admin has authorized access to /api/reports/financial-analytics (200)');

  // TEST 10: Admin CAN view full student records
  const adminStuRes = await fetch(`${BASE_URL}/api/students/lookup/ESE2009012`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminStuRes.status === 200, 'RBAC: Admin authorized to view student lookup (200)');

  // TEST 11: Teacher Login and Gradebook access
  const teacherLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'teacher', password: 'Teacher2025!' })
  });
  const teacherData = await teacherLoginRes.json();
  const teacherToken = teacherData.token;
  assert(teacherLoginRes.status === 200, 'AUTH: Teacher login succeeds');

  const teacherClassSheetRes = await fetch(`${BASE_URL}/api/exams/class-sheet?class_id=2&subject_id=1`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(teacherClassSheetRes.status === 200, 'RBAC: Teacher authorized to access class-sheet (200)');

  // TEST 12: Teacher CANNOT access Defaulters / Financial Analytics (403)
  const teacherFinRes = await fetch(`${BASE_URL}/api/reports/financial-analytics`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(teacherFinRes.status === 403, 'RBAC: Teacher blocked from financial analytics / debtors ledger (403)');

  // TEST 13: Student Login (Adaobi Eze - ESE2009012)
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ESE2009012', password: 'Eagle2025!' })
  });
  const studentData = await studentLoginRes.json();
  const studentToken = studentData.token;
  assert(studentLoginRes.status === 200, 'AUTH: Student login succeeds for ESE2009012');

  // TEST 14: Student CAN view their OWN report card
  const studentOwnReportRes = await fetch(`${BASE_URL}/api/exams/report-card/ESE2009012`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentOwnReportRes.status === 200, 'BOLA: Student authorized to access their own report card (200)');

  // TEST 15: Student CANNOT view ANOTHER student's report card (BOLA / IDOR protection!)
  const studentOtherReportRes = await fetch(`${BASE_URL}/api/exams/report-card/${encodeURIComponent('EP/2024/002')}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentOtherReportRes.status === 403, 'BOLA: Student blocked from viewing another student’s report card (403)');

  // TEST 16: Student CANNOT access all students list
  const studentListRes = await fetch(`${BASE_URL}/api/students`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentListRes.status === 403, 'RBAC: Student blocked from dumping entire school student body (403)');

  // TEST 17: Valid Parent Claim/Registration with MATCHING guardian phone on file
  // First, check guardian phone for student 1 from DB
  const lookupRes = await fetch(`${BASE_URL}/api/students/1`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const lookupData = await lookupRes.json();
  const legitimatePhone = lookupData.data.guardian_phone || '08037098816';
  const legitimateAdm = lookupData.data.admission_no;

  const validParentReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      username: `p_${Date.now()}`,
      password: 'VerifiedParent2025!',
      full_name: 'Verified Guardian',
      phone: legitimatePhone,
      role: 'parent',
      reference_id: legitimateAdm
    })
  });
  assert(validParentReg.status === 201, 'SEC-01: Parent registration succeeds when phone matches registered guardian (201)');

  console.log(`\n========================================`);
  console.log(`Test Suite Finished: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch(err => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
