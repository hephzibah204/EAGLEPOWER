import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_TABS, getDashboardRole, canAccessTab, defaultTab, canLoadDashboardResource } from '../src/utils/portalPermissions.js';

test('privileged preview uses only the selected role permissions', () => {
  for (const account of ['admin', 'superadmin']) {
    for (const role of ['teacher', 'bursar', 'parent', 'student', 'frontdesk']) {
      assert.equal(getDashboardRole(account, role), role);
      assert.equal(canAccessTab(role, 'users'), false);
      assert.equal(canAccessTab(role, 'threat_radar'), false);
    }
  }
});
test('ordinary accounts cannot elevate through role or URL selection', () => {
  for (const role of ['teacher', 'bursar', 'parent', 'student', 'frontdesk']) {
    assert.equal(getDashboardRole(role, 'superadmin'), role);
    assert.equal(canAccessTab(role, 'executive_cockpit'), false);
    assert.equal(canAccessTab(role, 'system_settings'), false);
  }
  assert.equal(getDashboardRole('admin', 'superadmin'), 'admin');
  assert.equal(getDashboardRole(undefined, 'superadmin'), null);
  assert.equal(canAccessTab('unknown', 'overview'), false);
  for (const role of Object.keys(ROLE_TABS)) assert.equal(canAccessTab(role, defaultTab(role)), true);
});
test('teacher dashboard has teaching resources without finance, HR, or reception', () => {
  for (const tab of ['invoices', 'payroll', 'staff', 'visitors', 'admissions', 'users']) assert.equal(canAccessTab('teacher', tab), false);
  for (const resource of ['financeStats', 'invoices', 'payroll', 'admissions', 'frontdesk']) assert.equal(canLoadDashboardResource('teacher', resource), false);
  for (const tab of ['attendance', 'gradebook', 'homework', 'lesson_notes', 'reportcard']) assert.equal(canAccessTab('teacher', tab), true);
  assert.equal(canAccessTab('parent', 'invoices'), true);
  assert.equal(canLoadDashboardResource('parent', 'financeStats'), false);
  assert.equal(canLoadDashboardResource('bursar', 'lessonNotes'), false);
});
