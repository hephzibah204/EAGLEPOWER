import db from '../config/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

async function runTests() {
  console.log('🧪 Starting SuperAdmin Omni-Control Center Comprehensive Tests...\n');

  const BASE_URL = 'http://localhost:5050/api';

  // 1. Authenticate as SuperAdmin
  console.log('1️⃣ Testing SuperAdmin Executive Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/executive-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: 'EagleSuperAdmin2025!'
    })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log('   ✅ SuperAdmin authenticated successfully. Token received.\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Test Master Telemetry
  console.log('2️⃣ Testing GET /api/executive/stats...');
  const statsRes = await fetch(`${BASE_URL}/executive/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  if (!statsRes.ok || !statsData.success) {
    throw new Error(`Stats endpoint failed: ${JSON.stringify(statsData)}`);
  }
  console.log(`   ✅ Stats verified: ${statsData.users.total} total users, ${statsData.users.enrolled_students} students, Threat Level: ${statsData.security.threat_level}\n`);

  // 3. Test All Modules Data Aggregator
  console.log('3️⃣ Testing GET /api/executive/all-modules-data...');
  const omniRes = await fetch(`${BASE_URL}/executive/all-modules-data`, { headers: authHeaders });
  const omniData = await omniRes.json();
  if (!omniRes.ok || !omniData.success) {
    throw new Error(`All modules endpoint failed: ${JSON.stringify(omniData)}`);
  }
  console.log(`   ✅ Omni data received:`);
  console.log(`      - Academic Classes: ${omniData.classes.length}`);
  console.log(`      - Subjects: ${omniData.subjects.length}`);
  console.log(`      - Students: ${omniData.students.total}`);
  console.log(`      - Staff: ${omniData.staff.total}`);
  console.log(`      - Total Invoiced: ₦${omniData.finance.stats.total_invoiced.toLocaleString()}`);
  console.log(`      - Monthly Payroll: ₦${omniData.payroll.total_monthly_payroll.toLocaleString()}\n`);

  // 4. Test Score Override
  console.log('4️⃣ Testing POST /api/executive/scores/override...');
  const student = omniData.students.list[0];
  const subject = omniData.subjects[0];
  const overrideRes = await fetch(`${BASE_URL}/executive/scores/override`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      student_id: student.id,
      subject_id: subject.id,
      session: '2024/2025',
      term: 'Second Term',
      ca1: 14,
      ca2: 15,
      exam: 58
    })
  });
  const overrideData = await overrideRes.json();
  if (!overrideRes.ok || !overrideData.success) {
    throw new Error(`Score override failed: ${JSON.stringify(overrideData)}`);
  }
  console.log(`   ✅ Score override committed: Total=${overrideData.score.total}/100, Grade=${overrideData.score.grade}\n`);

  // 5. Test Payment Recording
  console.log('5️⃣ Testing POST /api/executive/finance/record-payment...');
  const invoice = omniData.finance.invoices[0];
  if (invoice) {
    const payRes = await fetch(`${BASE_URL}/executive/finance/record-payment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        invoice_id: invoice.id,
        amount: 5000,
        payment_method: 'Bank Transfer',
        reference: `TEST-REF-${Date.now()}`
      })
    });
    const payData = await payRes.json();
    if (!payRes.ok || !payData.success) {
      throw new Error(`Payment record failed: ${JSON.stringify(payData)}`);
    }
    console.log(`   ✅ Payment recorded: ${payData.message}\n`);
  }

  // 6. Test Class Promotion
  console.log('6️⃣ Testing POST /api/executive/promote-students...');
  const targetClass = omniData.classes[1] || omniData.classes[0];
  const promoteRes = await fetch(`${BASE_URL}/executive/promote-students`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      to_class_id: targetClass.id,
      student_ids: [student.id]
    })
  });
  const promoteData = await promoteRes.json();
  if (!promoteRes.ok || !promoteData.success) {
    throw new Error(`Promote failed: ${JSON.stringify(promoteData)}`);
  }
  console.log(`   ✅ Promotion executed: ${promoteData.message}\n`);

  // 7. Verify Audit Log Trail
  console.log('7️⃣ Verifying Audit Log Entries...');
  const auditRes = await fetch(`${BASE_URL}/executive/audit-logs?limit=5`, { headers: authHeaders });
  const auditData = await auditRes.json();
  if (!auditRes.ok || !auditData.success) {
    throw new Error(`Audit logs failed: ${JSON.stringify(auditData)}`);
  }
  console.log(`   ✅ Recent audit entries recorded:`);
  auditData.logs.slice(0, 3).forEach(l => {
    console.log(`      - [${l.action}] ${l.details}`);
  });

  console.log('\n🎉 ALL SUPERADMIN OMNI-CONTROL TESTS PASSED GLORIOUSLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
