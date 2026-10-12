import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eaglepower_secure_jwt_token_secret_key_2025_amikwo';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or admission number is required'),
  password: z.string().min(1, 'Password is required')
});

/**
 * POST /api/auth/login
 * User & Student Portal Login
 */
router.post('/login', (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const { username, password } = parseResult.data;

    // Search user by username OR email
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? OR email = ?
    `).get(username.trim(), username.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username/admission number and password.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently disabled. Please contact the school administrative office.'
      });
    }

    // Verify bcrypt hash
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      logAudit(user.id, 'LOGIN_FAILED', 'AUTH', `Failed login attempt from IP ${req.ip}`, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your password.'
      });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Sign JWT (valid for 7 days)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        reference_id: user.reference_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logAudit(user.id, 'LOGIN_SUCCESS', 'AUTH', `User logged in successfully via ${user.role} role`, req.ip);

    // If student, attach student profile info
    let studentDetails = null;
    if (user.role === 'student' && user.reference_id) {
      studentDetails = db.prepare(`
        SELECT s.*, c.name as class_name, sec.name as section_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE s.admission_no = ?
      `).get(user.reference_id);
    }

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        reference_id: user.reference_id,
        student: studentDetails
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Retrieve current authenticated session
 */
router.get('/me', authenticate, (req, res) => {
  let studentDetails = null;
  if (req.user.role === 'student' && req.user.reference_id) {
    studentDetails = db.prepare(`
      SELECT s.*, c.name as class_name, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.admission_no = ?
    `).get(req.user.reference_id);
  }

  res.json({
    success: true,
    user: {
      ...req.user,
      student: studentDetails
    }
  });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticate, (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(old_password, user.password_hash)) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    logAudit(req.user.id, 'PASSWORD_CHANGED', 'AUTH', 'Password updated', req.ip);

    res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
