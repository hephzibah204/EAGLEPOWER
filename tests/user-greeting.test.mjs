import test from 'node:test';
import assert from 'node:assert/strict';
import { getFirstName, formatRoleWelcome } from '../src/utils/userGreeting.js';

test('getFirstName extracts clean first name from full names and titles', () => {
  assert.equal(getFirstName('Mrs. Blessing Adeyemi'), 'Blessing');
  assert.equal(getFirstName('Dr. Emeka Okafor'), 'Emeka');
  assert.equal(getFirstName('Barr. (Mrs.) Chinyere Nwoye'), 'Chinyere');
  assert.equal(getFirstName('Mr. Kenechukwu Eze'), 'Kenechukwu');
  assert.equal(getFirstName('Engr. Chukwudi Okeke'), 'Chukwudi');
  assert.equal(getFirstName('Pastor Sunday Uche'), 'Sunday');
  assert.equal(getFirstName('Prof. Chinua Achebe'), 'Chinua');
  assert.equal(getFirstName('Amaka Igwe'), 'Amaka');
  assert.equal(getFirstName('Somtochukwu'), 'Somtochukwu');
  assert.equal(getFirstName(null, 'Educator'), 'Educator');
  assert.equal(getFirstName(undefined, 'Parent'), 'Parent');
  assert.equal(getFirstName('', 'Guest'), 'Guest');
  assert.equal(getFirstName(''), '');
});

test('getFirstName extracts first name from user profile objects', () => {
  assert.equal(getFirstName({ full_name: 'Mrs. Blessing Adeyemi', role: 'teacher' }), 'Blessing');
  assert.equal(getFirstName({ name: 'Chukwuemeka Okonkwo', role: 'teacher' }), 'Chukwuemeka');
  assert.equal(getFirstName({ staff: { name: 'Dr. Stella Obi' } }), 'Stella');
  assert.equal(getFirstName({ guardian_name: 'Chief Obinna Nnamdi' }), 'Obinna');
  assert.equal(getFirstName({ username: 'superadmin', role: 'superadmin' }), 'superadmin');
});

test('formatRoleWelcome mentions teacher, parent, or admin with first name', () => {
  // Teacher
  const teacherUser = { full_name: 'Mrs. Blessing Adeyemi', role: 'teacher' };
  assert.equal(formatRoleWelcome(teacherUser), 'Teacher Blessing');
  assert.equal(formatRoleWelcome(teacherUser, 'teacher'), 'Teacher Blessing');

  // Parent
  const parentUser = { full_name: 'Barr. (Mrs.) Chinyere Nwoye', role: 'parent' };
  assert.equal(formatRoleWelcome(parentUser), 'Parent Chinyere');
  assert.equal(formatRoleWelcome('Chief Emeka Okafor', 'parent'), 'Parent Emeka');

  // Admin / SuperAdmin
  const adminUser = { full_name: 'Engr. Kenechukwu Eze', role: 'admin' };
  assert.equal(formatRoleWelcome(adminUser), 'Admin Kenechukwu');

  const superAdminUser = { full_name: 'Dr. Obinna Okafor', role: 'superadmin' };
  assert.equal(formatRoleWelcome(superAdminUser), 'Admin Obinna');

  // Bursar & Student
  assert.equal(formatRoleWelcome({ full_name: 'Mr. David Adeleke', role: 'bursar' }), 'Bursar David');
  assert.equal(formatRoleWelcome({ full_name: 'Ngozi Chimamanda', role: 'student' }), 'Student Ngozi');

  // Fallbacks
  assert.equal(formatRoleWelcome(null, 'teacher'), 'Teacher');
  assert.equal(formatRoleWelcome(null, 'parent'), 'Parent');
  assert.equal(formatRoleWelcome(null, 'admin'), 'Admin');
});
