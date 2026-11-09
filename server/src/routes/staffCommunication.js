/**
 * EAGLE POWER SCHOOLS & COLLEGES, AWKA
 * Staff Communication & Automated Messaging Routes
 */

import express from 'express';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import {
  broadcastToStaff,
  triggerAutomationRule,
  getStaffNotifications,
  markNotificationRead,
  getStaffCommunicationOverview,
  STAFF_COMMUNICATION_TEMPLATES
} from '../services/staffCommunicationService.js';

const router = express.Router();

/**
 * Helper: Find staff ID for the currently authenticated user
 */
function getStaffIdForUser(user) {
  if (!user) return null;
  if (user.reference_id) {
    const s = db.prepare('SELECT id FROM staff WHERE UPPER(staff_no) = UPPER(?)').get(user.reference_id);
    if (s) return s.id;
  }
  if (user.full_name || user.username) {
    const s = db.prepare('SELECT id FROM staff WHERE LOWER(name) = LOWER(?)').get(user.full_name || user.username);
    if (s) return s.id;
  }
  return null;
}

/**
 * GET /api/staff-communication/notifications
 * Fetch notifications for the authenticated staff/teacher
 */
router.get('/notifications', authenticate, (req, res, next) => {
  try {
    const staffId = getStaffIdForUser(req.user);
    const unreadOnly = req.query.unread === 'true';
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);

    const result = getStaffNotifications(staffId, { limit, unreadOnly });

    res.json({
      success: true,
      staffId,
      unreadCount: result.unreadCount,
      notifications: result.notifications
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/staff-communication/notifications/read-all
 * Mark all notifications as read for current staff
 */
router.post('/notifications/read-all', authenticate, (req, res, next) => {
  try {
    const staffId = getStaffIdForUser(req.user);
    const result = markNotificationRead('ALL', staffId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/staff-communication/notifications/:id/read
 * Mark a specific notification as read
 */
router.post('/notifications/:id/read', authenticate, (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const staffId = getStaffIdForUser(req.user);
    markNotificationRead(notifId, staffId);
    res.json({ success: true, notificationId: notifId });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/staff-communication/overview
 * Dashboard telemetry for admin/superadmin
 */
router.get('/overview', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const overview = getStaffCommunicationOverview();
    res.json({
      success: true,
      ...overview
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/staff-communication/templates
 * Library of ready-to-use institutional templates
 */
router.get('/templates', authenticate, (req, res) => {
  res.json({
    success: true,
    count: STAFF_COMMUNICATION_TEMPLATES.length,
    templates: STAFF_COMMUNICATION_TEMPLATES
  });
});

/**
 * GET /api/staff-communication/rules
 * List all automated communication rules
 */
router.get('/rules', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const rules = db.prepare('SELECT * FROM staff_automation_rules ORDER BY id ASC').all();
    res.json({
      success: true,
      count: rules.length,
      rules
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/staff-communication/rules/:ruleKey
 * Update or toggle an automated rule
 */
const updateRuleSchema = z.object({
  is_enabled: z.number().int().min(0).max(1).optional(),
  schedule_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:MM').optional(),
  schedule_days: z.string().optional(),
  template_title: z.string().min(3).optional(),
  template_body: z.string().min(5).optional(),
  target_audience: z.enum(['ALL_STAFF', 'TEACHERS', 'FORM_MASTERS', 'NON_TEACHING', 'MANAGEMENT']).optional(),
  channels: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  action_url: z.string().nullable().optional()
});

router.put('/rules/:ruleKey', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const parsed = updateRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }

    const { ruleKey } = req.params;
    const rule = db.prepare('SELECT * FROM staff_automation_rules WHERE rule_key = ?').get(ruleKey);
    if (!rule) {
      return res.status(404).json({ success: false, message: `Rule '${ruleKey}' not found.` });
    }

    const updates = [];
    const values = [];

    for (const [key, val] of Object.entries(parsed.data)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(ruleKey);
      db.prepare(`UPDATE staff_automation_rules SET ${updates.join(', ')} WHERE rule_key = ?`).run(...values);
    }

    logAudit(
      req.user.id,
      'UPDATE_STAFF_AUTOMATION_RULE',
      'COMMUNICATION',
      `Admin updated automated rule "${rule.name}" (${ruleKey})`,
      req.ip
    );

    const updated = db.prepare('SELECT * FROM staff_automation_rules WHERE rule_key = ?').get(ruleKey);
    res.json({
      success: true,
      message: `Rule '${rule.name}' updated successfully.`,
      rule: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/staff-communication/rules/:ruleKey/trigger
 * Manually trigger an automated rule on demand (test or instant run)
 */
router.post('/rules/:ruleKey/trigger', authenticate, requireRoles('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { ruleKey } = req.params;
    const result = await triggerAutomationRule(ruleKey, req.user.username || 'Administrator');

    logAudit(
      req.user.id,
      'TRIGGER_STAFF_AUTOMATION_RULE',
      'COMMUNICATION',
      `Admin manually triggered automated rule "${result.ruleName}" to ${result.totalRecipients} recipients`,
      req.ip
    );

    res.json({
      success: true,
      message: `Successfully triggered automated campaign '${result.ruleName}' to ${result.totalRecipients} staff members.`,
      result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/staff-communication/broadcast
 * Send a custom announcement or broadcast to staff members
 */
const broadcastSchema = z.object({
  title: z.string().min(3, 'Broadcast subject title is required'),
  message: z.string().min(5, 'Message content is required'),
  target_group: z.enum(['ALL_STAFF', 'TEACHERS', 'FORM_MASTERS', 'NON_TEACHING', 'MANAGEMENT', 'SPECIFIC_STAFF']).default('ALL_STAFF'),
  specific_staff_ids: z.array(z.number().int()).optional(),
  channels: z.string().default('IN_APP,WHATSAPP'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  action_url: z.string().nullable().optional()
});

router.post('/broadcast', authenticate, requireRoles('admin', 'superadmin'), async (req, res, next) => {
  try {
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }

    const {
      title,
      message,
      target_group,
      specific_staff_ids,
      channels,
      priority,
      action_url
    } = parsed.data;

    const result = await broadcastToStaff({
      title,
      message,
      targetGroup: target_group,
      specificStaffIds: specific_staff_ids || [],
      channels,
      dispatchedBy: req.user.username || 'SuperAdmin',
      priority,
      actionUrl: action_url,
      triggerType: 'MANUAL'
    });

    logAudit(
      req.user.id,
      'DISPATCH_STAFF_BROADCAST',
      'COMMUNICATION',
      `Admin broadcasted "${title}" to ${result.totalRecipients} staff members via [${channels}]`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: `Broadcast delivered to ${result.totalRecipients} staff members successfully.`,
      result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/staff-communication/campaigns
 * Fetch history of broadcast campaigns
 */
router.get('/campaigns', authenticate, requireRoles('admin', 'superadmin'), (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const campaigns = db.prepare('SELECT * FROM staff_broadcast_campaigns ORDER BY id DESC LIMIT ?').all(limit);
    res.json({
      success: true,
      count: campaigns.length,
      campaigns
    });
  } catch (err) {
    next(err);
  }
});

export default router;
