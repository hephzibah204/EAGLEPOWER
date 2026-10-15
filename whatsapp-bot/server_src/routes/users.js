import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { clearFailure, failedLoginTracker } from './auth.js';

const router = express.Router();

/**
 * 1. GET /api/users
 * SuperAdmin Master User Directory
 */
router.get('/', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const { role, status, q, page = 1, limit = 50 } = req.query;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (safePage - 1) * safeLimit;

    let conditions = [];
    const params = [];

    if (role && role !== 'All') {
      conditions.push('role = ?');
      params.push(role);
    }

    if (status === 'active') {
      conditions.push('is_active = 1');
    } else if (status === 'suspended') {
      conditions.push('is_active = 0');
    }

    if (q) {
      conditions.push('(username LIKE ? OR full_name LIKE ? OR email LIKE ? OR reference_id LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`);
    const total = countStmt.get(...params).total;

    const users = db.prepare(`
      SELECT id, username, email, role, reference_id, full_name, is_active, last_login, created_at
      FROM users
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(...params, safeLimit, offset);

    // Annotate with lockout status
    const now = Date.now();
    const enrichedUsers = users.map(u => {
      const lockKey = u.username.toLowerCase();
      const lockRecord = failedLoginTracker.get(lockKey);
      const isLocked = Boolean(lockRecord?.lockedUntil && lockRecord.lockedUntil > now);
      return {
        ...u,
        is_locked: isLocked,
        lockout_minutes: isLocked ? Math.ceil((lockRecord.lockedUntil - now) / 60000) : 0
      };
    });

    res.json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: enrichedUsers
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. PATCH /api/users/:id/status
 * SuperAdmin freeze / unfreeze account
 */
router.patch('/:id/status', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const { is_active } = req.body;

    if (typeof is_active !== 'number' && typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be 1/0 or true/false.' });
    }

    const newStatus = is_active ? 1 : 0;

    // Prevent superadmin from disabling their own active account
    if (targetId === req.user.id && newStatus === 0) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot deactivate your own active SuperAdmin account.'
      });
    }

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, targetId);

    logAudit(
      req.user.id,
      newStatus === 1 ? 'ACTIVATE_USER' : 'SUSPEND_USER',
      'IAM',
      `SuperAdmin ${newStatus === 1 ? 'activated' : 'suspended'} account for ${user.username} (ID ${targetId})`,
      req.ip
    );

    res.json({
      success: true,
      message: `User account '${user.username}' has been ${newStatus === 1 ? 'activated' : 'suspended'}.`,
      is_active: newStatus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/users/:id/reset-password
 * SuperAdmin direct password reset
 */
router.post('/:id/reset-password', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8 || !/[A-Za-z]/.test(new_password) || !/\d/.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain both letters and digits.'
      });
    }

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, targetId);

    // Clear any lockout state
    clearFailure(user.username.toLowerCase());

    logAudit(
      req.user.id,
      'RESET_USER_PASSWORD',
      'IAM',
      `SuperAdmin reset password for ${user.username} (ID ${targetId})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Password for user '${user.username}' was updated successfully.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. POST /api/users/:id/release-lockout
 * SuperAdmin instant release of brute-force lockout
 */
router.post('/:id/release-lockout', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    clearFailure(user.username.toLowerCase());

    logAudit(
      req.user.id,
      'RELEASE_LOCKOUT',
      'IAM',
      `SuperAdmin released account lockout for ${user.username}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Lockout for '${user.username}' has been successfully lifted.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. PATCH /api/users/:id/role
 * SuperAdmin change user role
 */
router.patch('/:id/role', authenticate, requireRoles('superadmin'), (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const { role } = req.body;

    const allowedRoles = ['superadmin', 'admin', 'teacher', 'bursar', 'parent', 'student'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` });
    }

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId);

    logAudit(
      req.user.id,
      'UPDATE_USER_ROLE',
      'IAM',
      `Changed role for ${user.username} from ${user.role} to ${role}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Role for '${user.username}' updated to ${role}.`,
      role
    });
  } catch (err) {
    next(err);
  }
});

export default router;
