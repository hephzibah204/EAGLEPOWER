import db from '../config/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

async function testUpgrade() {
  console.log('🚀 Running SuperAdmin Omni-Control Center Comprehensive Verification Suite...\n');

  // Generate valid SuperAdmin JWT
  const superadminUser = db.prepare("SELECT * FROM users WHERE role = 'superadmin' AND is_active = 1").get();
  if (!superadminUser) {
    throw new Error('No active superadmin user found in database.');
  }

  const superadminToken = jwt.sign(
    { id: superadminUser.id, username: superadminUser.username, role: 'superadmin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const teacherUser = db.prepare("SELECT * FROM users WHERE role = 'teacher' AND is_active = 1").get();
  const teacherToken = jwt.sign(
    { id: teacherUser.id, username: teacherUser.username, role: 'teacher' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

// Configure test port before starting server
const TEST_PORT = process.env.TEST_PORT || '5058';
process.env.PORT = TEST_PORT;

// Dynamically start server
await import('../index.js');
await new Promise(resolve => setTimeout(resolve, 800));

const BASE_URL = `http://localhost:${TEST_PORT}/api`;

  console.log('1️⃣ Verifying SuperAdmin authentication barrier & RBAC...');
  // A non-superadmin MUST receive 403 Forbidden
  const forbiddenRes = await fetch(`${BASE_URL}/executive/stats`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected HTTP 403 for non-superadmin access, got ${forbiddenRes.status}`);
  }
  console.log('   ✅ Non-superadmin access strictly blocked with HTTP 403 Forbidden.\n');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${superadminToken}`
  };

  console.log('2️⃣ Testing SuperAdmin IAM & User Provisioning (/api/executive/users)...');
  const testUsername = `test_operator_${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/executive/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      username: testUsername,
      password: 'TemporaryPass123!',
      full_name: 'Test Executive Operator',
      role: 'admin',
      email: 'operator@eaglepowerschools.com.ng',
      reference_id: 'EPS-OP-01'
    })
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Failed to create user: ${JSON.stringify(createData)}`);
  }
  const createdUserId = createData.user.id;
  console.log(`   ✅ User provisioned: ID ${createdUserId} (@${testUsername}), Role: ${createData.user.role}`);

  // Test Editing User
  const editRes = await fetch(`${BASE_URL}/executive/users/${createdUserId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      full_name: 'Updated Executive Operator',
      role: 'bursar'
    })
  });
  const editData = await editRes.json();
  if (!editRes.ok || editData.user.role !== 'bursar') {
    throw new Error(`Failed to edit user: ${JSON.stringify(editData)}`);
  }
  console.log(`   ✅ User updated: Role elevated to ${editData.user.role}, Name: ${editData.user.full_name}`);

  // Test Password Reset
  const resetRes = await fetch(`${BASE_URL}/executive/users/${createdUserId}/reset-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ new_password: 'SuperSecureNewPass2026!' })
  });
  const resetData = await resetRes.json();
  if (!resetRes.ok || !resetData.success) {
    throw new Error(`Failed to reset password: ${JSON.stringify(resetData)}`);
  }
  console.log(`   ✅ Direct password reset verified.`);

  // Test Status Toggle
  const toggleRes = await fetch(`${BASE_URL}/executive/users/${createdUserId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_active: 0 })
  });
  const toggleData = await toggleRes.json();
  if (!toggleRes.ok || toggleData.is_active !== 0) {
    throw new Error(`Failed to toggle status: ${JSON.stringify(toggleData)}`);
  }
  console.log(`   ✅ User status toggled to Suspended (is_active: 0)`);

  // Test Deleting User
  const deleteRes = await fetch(`${BASE_URL}/executive/users/${createdUserId}`, {
    method: 'DELETE',
    headers
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok || !deleteData.success) {
    throw new Error(`Failed to delete user: ${JSON.stringify(deleteData)}`);
  }
  console.log(`   ✅ User account permanently deleted.\n`);

  console.log('3️⃣ Testing Academic Architecture Management (Classes & Subjects)...');
  // Create Class
  const testClassName = `Test Division ${Date.now().toString().slice(-4)}`;
  const classRes = await fetch(`${BASE_URL}/executive/classes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: testClassName,
      division: 'Junior College',
      termly_tuition: 42000
    })
  });
  const classData = await classRes.json();
  if (!classRes.ok || !classData.success) {
    throw new Error(`Failed to create class: ${JSON.stringify(classData)}`);
  }
  const createdClassId = classData.class.id;
  console.log(`   ✅ Academic class created: ID ${createdClassId} (${testClassName})`);

  // Delete Class
  const delClassRes = await fetch(`${BASE_URL}/executive/classes/${createdClassId}`, {
    method: 'DELETE',
    headers
  });
  const delClassData = await delClassRes.json();
  if (!delClassRes.ok || !delClassData.success) {
    throw new Error(`Failed to delete class: ${JSON.stringify(delClassData)}`);
  }
  console.log(`   ✅ Academic class successfully deleted.`);

  // Create Subject
  const testSubCode = `TST${Date.now().toString().slice(-3)}`;
  const subRes = await fetch(`${BASE_URL}/executive/subjects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Applied Robotics & Automation',
      code: testSubCode,
      division: 'Senior College',
      category: 'Vocational'
    })
  });
  const subData = await subRes.json();
  if (!subRes.ok || !subData.success) {
    throw new Error(`Failed to create subject: ${JSON.stringify(subData)}`);
  }
  const createdSubId = subData.subject.id;
  console.log(`   ✅ Curriculum subject created: ID ${createdSubId} (${testSubCode} - ${subData.subject.name})`);

  // Delete Subject
  const delSubRes = await fetch(`${BASE_URL}/executive/subjects/${createdSubId}`, {
    method: 'DELETE',
    headers
  });
  const delSubData = await delSubRes.json();
  if (!delSubRes.ok || !delSubData.success) {
    throw new Error(`Failed to delete subject: ${JSON.stringify(delSubData)}`);
  }
  console.log(`   ✅ Curriculum subject successfully deleted.\n`);

  console.log('4️⃣ Testing WhatsApp Bot Status & Broadcaster Station...');
  const waStatusRes = await fetch(`${BASE_URL}/executive/whatsapp/status`, { headers });
  const waStatus = await waStatusRes.json();
  if (!waStatusRes.ok || !waStatus.success) {
    throw new Error(`Failed to fetch whatsapp status: ${JSON.stringify(waStatus)}`);
  }
  console.log(`   ✅ WhatsApp Bot Health: ${waStatus.bot.status} (${waStatus.bot.platform} ${waStatus.bot.region})`);
  console.log(`   ✅ Verified Contact Reach: ${waStatus.reach.total_unique_recipients} recipients (${waStatus.reach.parent_contacts} parents, ${waStatus.reach.staff_contacts} staff)`);

  // Dispatch Test Broadcast
  const broadcastRes = await fetch(`${BASE_URL}/executive/whatsapp/broadcast`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      broadcast_type: 'ALL',
      title: 'Institutional Term Resumption Notice',
      message: 'Eagle Power Schools welcomes all students and faculty for the upcoming academic session. Resumption is mandatory on May 5th.'
    })
  });
  const broadcastData = await broadcastRes.json();
  if (!broadcastRes.ok || !broadcastData.success) {
    throw new Error(`Failed to dispatch broadcast: ${JSON.stringify(broadcastData)}`);
  }
  console.log(`   ✅ WhatsApp broadcast logged: ID ${broadcastData.broadcast.id}, Reach: ${broadcastData.broadcast.recipient_count} verified numbers\n`);

  console.log('5️⃣ Testing School System Settings Configuration...');
  const settingsRes = await fetch(`${BASE_URL}/executive/settings`, { headers });
  const settingsData = await settingsRes.json();
  if (!settingsRes.ok || !settingsData.success) {
    throw new Error(`Failed to fetch settings: ${JSON.stringify(settingsData)}`);
  }
  console.log(`   ✅ Current settings retrieved: School="${settingsData.settings.school_name}", Session="${settingsData.settings.current_session}", Term="${settingsData.settings.current_term}"`);

  // Update Settings
  const updateSettingsRes = await fetch(`${BASE_URL}/executive/settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      school_motto: 'Love, Truth & Service — Excellence in Action'
    })
  });
  const updatedSettings = await updateSettingsRes.json();
  if (!updateSettingsRes.ok || !updatedSettings.success) {
    throw new Error(`Failed to update settings: ${JSON.stringify(updatedSettings)}`);
  }
  console.log(`   ✅ Updated Motto: "${updatedSettings.settings.school_motto}"\n`);

  console.log('6️⃣ Testing Database Vault Snapshot & Direct Download...');
  const bkRes = await fetch(`${BASE_URL}/executive/backup`, { method: 'POST', headers });
  const bkData = await bkRes.json();
  if (!bkRes.ok || !bkData.success) {
    throw new Error(`Failed to create snapshot: ${JSON.stringify(bkData)}`);
  }
  console.log(`   ✅ Atomic snapshot created: ${bkData.backup.filename} (${bkData.backup.size_kb} KB)`);

  const dlRes = await fetch(`${BASE_URL}/executive/backups/${bkData.backup.filename}/download`, { headers });
  if (!dlRes.ok) {
    throw new Error(`Failed to download backup snapshot: HTTP ${dlRes.status}`);
  }
  const buffer = await dlRes.arrayBuffer();
  console.log(`   ✅ Snapshot downloaded successfully: ${Math.round(buffer.byteLength / 1024)} KB verified stream.\n`);

  console.log('✨ ALL 6 MODULE UPGRADE TESTS PASSED WITH 100% SUCCESS! SUPERADMIN COCKPIT FULLY VERIFIED.');
  process.exit(0);
}

testUpgrade().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
