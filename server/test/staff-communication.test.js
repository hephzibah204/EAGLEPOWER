import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import db from '../src/config/db.js';
import {
  initStaffCommunicationSchema,
  broadcastToStaff,
  triggerAutomationRule,
  getStaffNotifications,
  markNotificationRead,
  getStaffCommunicationOverview,
  resolveTargetStaff,
  STAFF_COMMUNICATION_TEMPLATES
} from '../src/services/staffCommunicationService.js';

describe('Staff Communication & Automated Messaging Engine', () => {
  before(() => {
    initStaffCommunicationSchema();
  });

  test('Target resolution identifies staff cohorts accurately', () => {
    const allStaff = resolveTargetStaff('ALL_STAFF');
    assert.ok(allStaff.length > 0, 'Active staff should be resolved');

    const teachers = resolveTargetStaff('TEACHERS');
    assert.ok(teachers.length > 0, 'Teachers should be resolved');
    assert.ok(teachers.length <= allStaff.length, 'Teachers subset should not exceed all staff');

    const formMasters = resolveTargetStaff('FORM_MASTERS');
    assert.ok(formMasters.length > 0, 'Form masters should be resolved');

    const specific = resolveTargetStaff('SPECIFIC_STAFF', [allStaff[0].id]);
    assert.equal(specific.length, 1);
    assert.equal(specific[0].id, allStaff[0].id);
  });

  test('Broadcasts to staff create notifications and record campaign log', async () => {
    const result = await broadcastToStaff({
      title: 'Emergency Faculty Briefing',
      message: 'Staff meeting today at 2:00 PM in the staff room.',
      targetGroup: 'ALL_STAFF',
      channels: 'IN_APP,WHATSAPP',
      dispatchedBy: 'Principal Test',
      priority: 'HIGH',
      actionUrl: 'overview'
    });

    assert.equal(result.success, true);
    assert.ok(result.totalRecipients > 0);
    assert.equal(result.inAppDelivered, result.totalRecipients);
    assert.ok(result.campaignId > 0);

    // Verify campaign record in db
    const campaign = db.prepare('SELECT * FROM staff_broadcast_campaigns WHERE id = ?').get(result.campaignId);
    assert.ok(campaign);
    assert.equal(campaign.title, 'Emergency Faculty Briefing');
    assert.equal(campaign.target_group, 'ALL_STAFF');
  });

  test('Staff can read their notifications and mark as read', async () => {
    const allStaff = resolveTargetStaff('ALL_STAFF');
    const testStaff = allStaff[0];

    const { notifications, unreadCount } = getStaffNotifications(testStaff.id);
    assert.ok(notifications.length > 0, 'Staff should have notifications');
    assert.ok(unreadCount > 0, 'Unread count should be positive');

    const firstNotif = notifications[0];
    const markRes = markNotificationRead(firstNotif.id, testStaff.id);
    assert.equal(markRes.success, true);

    const updated = db.prepare('SELECT * FROM staff_notifications WHERE id = ?').get(firstNotif.id);
    assert.equal(updated.is_read, 1);
    assert.ok(updated.read_at);

    // Test mark all read
    const markAllRes = markNotificationRead('ALL', testStaff.id);
    assert.equal(markAllRes.success, true);

    const { unreadCount: afterCount } = getStaffNotifications(testStaff.id, { unreadOnly: true });
    assert.equal(afterCount, 0);
  });

  test('Automated rules trigger successfully on demand', async () => {
    const result = await triggerAutomationRule('DAILY_MORNING_DUTY_REMINDER', 'Automated Test Runner');
    assert.equal(result.success, true);
    assert.equal(result.ruleKey, 'DAILY_MORNING_DUTY_REMINDER');
    assert.ok(result.totalRecipients > 0);

    const rule = db.prepare('SELECT * FROM staff_automation_rules WHERE rule_key = ?').get('DAILY_MORNING_DUTY_REMINDER');
    assert.ok(rule.last_run_at);
  });

  test('Overview provides accurate metrics and template bank is loaded', () => {
    const overview = getStaffCommunicationOverview();
    assert.ok(overview.totalStaff > 0);
    assert.ok(overview.totalTeachers > 0);
    assert.ok(overview.totalCampaigns > 0);
    assert.ok(overview.rules.length >= 4);

    assert.ok(STAFF_COMMUNICATION_TEMPLATES.length >= 6);
    const morningTpl = STAFF_COMMUNICATION_TEMPLATES.find(t => t.id === 'morning_rollcall');
    assert.ok(morningTpl);
    assert.equal(morningTpl.actionUrl, 'attendance');
  });
});
