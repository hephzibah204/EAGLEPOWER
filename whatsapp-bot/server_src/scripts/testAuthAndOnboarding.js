/**
 * EaglePower EduCore Comprehensive Authentication & Onboarding Test Suite
 * Tests all login endpoints, registration endpoints, adding staff, teachers, bursars, students & parents.
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5050/api';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('\n🦅 ========================================================');
  console.log('🧪 Starting EaglePower Authentication & Onboarding Test Suite');
  console.log(`🌐 Target Base URL: ${BASE_URL}`);
  console.log('🦅 ========================================================\n');

  // 1. Health Check
  const health = await request('/health');
  assert(health.ok && health.data.status === 'healthy', 'Health Check endpoint responding');

  // 2. Pre-seeded Logins for All Institutional Roles
  console.log('\n--- 1. Testing Pre-seeded Login Endpoints ---');

  // 2a. SuperAdmin Login
  const superLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'superadmin', password: 'EagleSuperAdmin2025!' })
  });
  assert(superLogin.ok && superLogin.data.user.role === 'superadmin', 'SuperAdmin Login (superadmin)');
  const superToken = superLogin.data.token;

  // 2b. Principal / Admin Login
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'EagleAdmin2025!' })
  });
  assert(adminLogin.ok && adminLogin.data.user.role === 'admin', 'Principal / Admin Login (admin)');
  const adminToken = adminLogin.data.token;

  // 2c. Teacher Login
  const teacherLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'teacher', password: 'Teacher2025!' })
  });
  assert(teacherLogin.ok && teacherLogin.data.user.role === 'teacher', 'Teacher Login (teacher)');

  // 2d. Bursar Login
  const bursarLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'bursar', password: 'Bursar2025!' })
  });
  assert(bursarLogin.ok && bursarLogin.data.user.role === 'bursar', 'Bursar Login (bursar)');

  // 2e. Student Login (Migrated student ESE2009012)
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'ESE2009012', password: 'Eagle2025!' })
  });
  assert(
    studentLogin.ok &&
    studentLogin.data.user.role === 'student' &&
    studentLogin.data.user.student?.admission_no === 'ESE2009012',
    'Student Portal Login (ESE2009012) with student record attached'
  );

  // 3. Parent Self-Registration
  console.log('\n--- 2. Testing Registration Endpoint (POST /api/auth/register) ---');

  const testParentUsername = `parent_test_${Date.now()}`;
  const parentReg = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: testParentUsername,
      password: 'SecureParent2025!',
      full_name: 'Chief Emeka Nnamdi',
      email: `${testParentUsername}@gmail.com`,
      phone: '07066397577', // Verified guardian phone for ESE2009012 in database
      role: 'parent',
      reference_id: 'ESE2009012' // Linked child admission number
    })
  });

  assert(
    parentReg.status === 201 &&
    parentReg.data.user.role === 'parent' &&
    parentReg.data.token,
    'Register Parent linked to student ESE2009012'
  );

  // Verify child was attached upon registration
  assert(
    Array.isArray(parentReg.data.user.children) && parentReg.data.user.children.length > 0,
    `Parent account linked to child: ${parentReg.data.user.children[0]?.first_name || 'Child'}`
  );

  // 4. Parent Login using the newly created credentials
  const parentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: testParentUsername,
      password: 'SecureParent2025!'
    })
  });
  assert(
    parentLogin.ok &&
    parentLogin.data.user.role === 'parent' &&
    parentLogin.data.user.children?.length > 0,
    'Seamless Parent Login with verified child report attachment'
  );

  // 5. Admin Onboarding New Staff Members
  console.log('\n--- 3. Testing Staff Onboarding (POST /api/staff) ---');

  // 5a. Add New Teacher
  const newTeacherUsername = `mr_okafor_${Date.now()}`;
  const newTeacherRes = await request('/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Mr. Jude Okafor',
      role: 'Senior Physics Teacher',
      email: `${newTeacherUsername}@eaglepowerschools.com.ng`,
      phone: '08098877665',
      qualification: 'B.Sc Physics, PGDE',
      assigned_class: 'Senior College (SS2)',
      username: newTeacherUsername,
      password: 'PhysicsPassword2025!'
    })
  });

  assert(
    newTeacherRes.status === 201 &&
    newTeacherRes.data.staff?.staff_no &&
    newTeacherRes.data.portal_account?.username === newTeacherUsername,
    `Admin Added Teacher: ${newTeacherRes.data.staff?.name} (${newTeacherRes.data.staff?.staff_no})`
  );

  // Immediately test login for the newly onboarded teacher!
  const newTeacherLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: newTeacherUsername,
      password: 'PhysicsPassword2025!'
    })
  });
  assert(
    newTeacherLogin.ok &&
    newTeacherLogin.data.user.role === 'teacher' &&
    newTeacherLogin.data.user.staff?.assigned_class === 'Senior College (SS2)',
    'Seamless Login for Newly Onboarded Teacher with staff profile attached'
  );

  // 5b. Add New Bursar / Accountant
  const newBursarUsername = `bursar_amaka_${Date.now()}`;
  const newBursarRes = await request('/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${superToken}` },
    body: JSON.stringify({
      name: 'Mrs. Amaka Chukwuma',
      role: 'Chief Bursar & Accounts Head',
      email: `${newBursarUsername}@eaglepowerschools.com.ng`,
      phone: '08123456789',
      qualification: 'B.Sc Accounting, ICAN',
      username: newBursarUsername,
      password: 'AccountsPassword2025!'
    })
  });

  assert(
    newBursarRes.status === 201 &&
    newBursarRes.data.portal_account?.role === 'bursar',
    `SuperAdmin Added Bursar: ${newBursarRes.data.staff?.name}`
  );

  // Test login for newly onboarded bursar!
  const newBursarLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: newBursarUsername,
      password: 'AccountsPassword2025!'
    })
  });
  assert(
    newBursarLogin.ok && newBursarLogin.data.user.role === 'bursar',
    'Seamless Login for Newly Onboarded Bursar'
  );

  // 6. Admin Enrolling New Student + Auto-Provisioning Parent Account
  console.log('\n--- 4. Testing Student & Parent Dual Enrollment (POST /api/students) ---');

  const testAdmNo = `EPS/2026/${Math.floor(100 + Math.random() * 900)}`;
  const parentPhone = `0803${Math.floor(1000000 + Math.random() * 9000000)}`;

  const enrollRes = await request('/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      admission_no: testAdmNo,
      first_name: 'Chidubem',
      last_name: 'Ezeani',
      gender: 'Male',
      dob: '2016-05-12',
      class_id: 1,
      section_id: 1,
      guardian_name: 'Barrister Nnamdi Ezeani',
      guardian_phone: parentPhone,
      guardian_email: `nnamdi_${Date.now()}@gmail.com`,
      address: 'Plot 15, Ziks Avenue, Awka'
    })
  });

  assert(
    enrollRes.status === 201 &&
    enrollRes.data.student?.admission_no === testAdmNo,
    `Admin Enrolled Student: Chidubem Ezeani (${testAdmNo})`
  );

  assert(
    enrollRes.data.student_credentials?.username === testAdmNo,
    'Student Portal Account auto-provisioned'
  );

  assert(
    enrollRes.data.parent_credentials?.username === parentPhone,
    `Parent Portal Account auto-provisioned (Username: ${parentPhone})`
  );

  // Test login for the newly enrolled student
  const newStudentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: testAdmNo,
      password: 'Eagle2025!'
    })
  });
  assert(
    newStudentLogin.ok && newStudentLogin.data.user.role === 'student',
    'Seamless Login for Newly Enrolled Student'
  );

  // Test login for the newly provisioned parent
  const newParentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: parentPhone,
      password: 'EagleParent2025!'
    })
  });
  assert(
    newParentLogin.ok &&
    newParentLogin.data.user.role === 'parent' &&
    newParentLogin.data.user.children?.some(c => c.admission_no === testAdmNo),
    'Seamless Login for Newly Provisioned Parent (Linked child auto-detected)'
  );

  // 7. Testing Session Profile (/api/auth/me)
  console.log('\n--- 5. Testing Session Verification (/api/auth/me) ---');

  const meStudent = await request('/auth/me', {
    headers: { Authorization: `Bearer ${newStudentLogin.data.token}` }
  });
  assert(meStudent.ok && meStudent.data.user.role === 'student', 'Token verification for Student session');

  const meParent = await request('/auth/me', {
    headers: { Authorization: `Bearer ${newParentLogin.data.token}` }
  });
  assert(meParent.ok && meParent.data.user.role === 'parent', 'Token verification for Parent session');

  const meTeacher = await request('/auth/me', {
    headers: { Authorization: `Bearer ${newTeacherLogin.data.token}` }
  });
  assert(meTeacher.ok && meTeacher.data.user.role === 'teacher', 'Token verification for Teacher session');

  // 8. Negative & Security Validations
  console.log('\n--- 6. Testing Negative Security Scenarios ---');

  // Wrong password
  const badPass = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'WrongPassword999!' })
  });
  assert(badPass.status === 401, 'Rejection of incorrect password (401 Unauthorized)');

  // Unknown username
  const unknownUser = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'non_existent_user_9999', password: 'AnyPassword123!' })
  });
  assert(unknownUser.status === 401, 'Rejection of unknown username (401 Unauthorized)');

  // Duplicate registration
  const dupReg = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: testParentUsername,
      password: 'AnotherPassword123!',
      full_name: 'Duplicate Test',
      role: 'parent'
    })
  });
  assert(dupReg.status === 409, 'Rejection of duplicate username registration (409 Conflict)');

  // Registering parent with non-existent student admission number
  const fakeChild = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: `parent_fake_${Date.now()}`,
      password: 'AnotherPassword123!',
      full_name: 'Fake Child Parent',
      role: 'parent',
      reference_id: 'NON_EXISTENT_ADM_99999'
    })
  });
  assert(fakeChild.status === 404, 'Rejection of parent registration for non-existent child (404 Not Found)');

  console.log('\n========================================');
  console.log(`📊 Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('========================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
