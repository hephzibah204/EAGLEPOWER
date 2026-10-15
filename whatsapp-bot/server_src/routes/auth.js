import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles, JWT_SECRET } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// Constant-time dummy hash to neutralize user enumeration timing attacks
const DUMMY_BCRYPT_HASH = '$2a$10$wN1rUvS49yJ8p2NqT4N67.a7PzD0f/3lH8xLzKjN3k6J0qGvN5qWy';

// Track failed login attempts per account/IP: key -> { count: number, lockedUntil: number }
export const failedLoginTracker = new Map();

export function checkLockout(key) {
  if (!key) return null;
  const record = failedLoginTracker.get(key);
  if (!record) return null;
  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    return Math.ceil((record.lockedUntil - now) / 60000);
  }
  if (record.lockedUntil && record.lockedUntil <= now) {
    failedLoginTracker.delete(key);
  }
  return null;
}

export function recordFailure(key) {
  if (!key) return;
  const now = Date.now();
  const record = failedLoginTracker.get(key) || { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
  }
  failedLoginTracker.set(key, record);
}

export function clearFailure(key) {
  if (key) failedLoginTracker.delete(key);
}

const loginSchema = z.object({
  username: z.string().min(1, 'Username, phone or admission number is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .refine(val => /[A-Za-z]/.test(val) && /\d/.test(val), {
      message: 'Password must contain at least one letter and one number'
    }),
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(['parent', 'student', 'teacher', 'bursar', 'admin']).default('parent'),
  reference_id: z.string().optional().or(z.literal('')) // Student admission number for parents/students, or staff number
});

/**
 * Helper to retrieve rich role-specific profile details
 */
function getRoleProfileDetails(role, referenceId, username, email) {
  let studentDetails = null;
  let children = [];
  let staffDetails = null;

  if (role === 'student' && referenceId) {
    studentDetails = db.prepare(`
      SELECT s.*, c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE UPPER(s.admission_no) = UPPER(?)
    `).get(referenceId);
  }

  if (role === 'parent') {
    // Match children strictly by verified guardian phone / email or matched admission number with guardian check
    const cleanRef = referenceId ? referenceId.trim().toUpperCase() : '';
    const cleanUser = username ? username.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    const cleanPhoneDigits = cleanUser.replace(/\D/g, '');
    const last10 = cleanPhoneDigits.length >= 7 ? cleanPhoneDigits.slice(-10) : '___invalid___';

    children = db.prepare(`
      SELECT s.*, c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE (? != '' AND UPPER(s.admission_no) = ?)
         OR (s.guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(s.guardian_phone, '+', ''), ' ', ''), '-', '') LIKE ?)
         OR (s.guardian_email IS NOT NULL AND LOWER(s.guardian_email) = ?)
      ORDER BY s.id ASC
    `).all(cleanRef, cleanRef, `%${last10}%`, cleanEmail);
  }

  if (['teacher', 'bursar', 'admin'].includes(role) && referenceId) {
    staffDetails = db.prepare(`
      SELECT * FROM staff WHERE UPPER(staff_no) = UPPER(?)
    `).get(referenceId);
  }

  return { studentDetails, children, staffDetails };
}

/**
 * POST /api/auth/register
 * Institutional Account Provisioning
 * Strictly restricted to School Administrators. Public self-registration is permanently disabled.
 */
router.post('/register', authenticate, requireRoles('superadmin', 'admin'), (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const { username, password, full_name, email, phone, role, reference_id } = parseResult.data;
    const cleanUsername = username.trim();
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    const cleanRef = reference_id && reference_id.trim() ? reference_id.trim().toUpperCase() : null;

    // 1. Verify username or email uniqueness
    const existing = db.prepare(`
      SELECT id, username, email FROM users
      WHERE LOWER(username) = LOWER(?) OR (email IS NOT NULL AND LOWER(email) = LOWER(?))
    `).get(cleanUsername, cleanEmail || '___none___');

    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.username.toLowerCase() === cleanUsername.toLowerCase()
          ? `Username '${cleanUsername}' is already taken.`
          : `Email '${cleanEmail}' is already registered.`
      });
    }

    // 2. Validate reference_id if provided for parent / student
    if (role === 'parent') {
      if (!cleanRef) {
        return res.status(400).json({
          success: false,
          message: 'Child Admission Number is required for Parent Portal account creation.'
        });
      }

      const student = db.prepare('SELECT id, first_name, last_name, admission_no, guardian_phone, guardian_email FROM students WHERE UPPER(admission_no) = ?').get(cleanRef);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Child with Admission Number '${cleanRef}' not found in school records.`
        });
      }

      // Strict Guardian Match: Registrant's phone or email must match emergency guardian contact on file!
      const regPhoneDigits = (phone || cleanUsername).replace(/\D/g, '');
      const regLast7 = regPhoneDigits.length >= 7 ? regPhoneDigits.slice(-7) : regPhoneDigits;
      const guardianPhoneDigits = (student.guardian_phone || '').replace(/\D/g, '');
      const guardianLast7 = guardianPhoneDigits.length >= 7 ? guardianPhoneDigits.slice(-7) : guardianPhoneDigits;

      const phoneMatches = Boolean(regLast7 && guardianLast7 && (regPhoneDigits.includes(guardianLast7) || guardianPhoneDigits.includes(regLast7)));
      const emailMatches = Boolean(cleanEmail && student.guardian_email && cleanEmail.toLowerCase() === student.guardian_email.toLowerCase());

      if (!phoneMatches && !emailMatches) {
        return res.status(403).json({
          success: false,
          message: `Verification failed: The provided contact phone (${phone || cleanUsername}) does not match the registered guardian records on file for ${cleanRef}. Please contact the school administrative desk.`
        });
      }
    } else if (role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Direct self-registration for students is disabled for institutional integrity. Student accounts are officially provisioned upon school enrollment. Please obtain your login credentials from your Class Teacher or the School Administrator.'
      });
    }

    // 3. Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 4. Insert into users table
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, reference_id, full_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      cleanUsername,
      cleanEmail,
      passwordHash,
      role,
      cleanRef || (phone ? phone.trim() : null),
      full_name.trim()
    );

    const userId = result.lastInsertRowid;

    // 5. Generate signed JWT token
    const token = jwt.sign(
      {
        id: userId,
        username: cleanUsername,
        role,
        reference_id: cleanRef
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logAudit(userId, 'USER_REGISTERED', 'AUTH', `New ${role} account registered: ${cleanUsername}`, req.ip);

    const { studentDetails, children, staffDetails } = getRoleProfileDetails(role, cleanRef, cleanUsername, cleanEmail);

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        role,
        full_name: full_name.trim(),
        reference_id: cleanRef,
        student: studentDetails,
        children: children,
        staff: staffDetails
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * User, Parent, Teacher, Staff & Student Portal Login
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
    const cleanUsername = username.trim();
    const cleanLower = cleanUsername.toLowerCase();
    const cleanUpper = cleanUsername.toUpperCase();

    // Check for active lockout against targeted account or client IP
    const accountLockMinutes = checkLockout(cleanLower);
    const ipLockMinutes = checkLockout(req.ip);
    const activeLock = accountLockMinutes || ipLockMinutes;
    if (activeLock) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Access is temporarily locked for security. Please try again in ${activeLock} minute(s).`
      });
    }

    // Search user by username, email, or reference_id (admission_no / staff_no / phone)
    const user = db.prepare(`
      SELECT * FROM users
      WHERE username = ?
         OR LOWER(email) = ?
         OR UPPER(reference_id) = ?
         OR (role = 'parent' AND (reference_id = ? OR username = ?))
         OR (role = 'student' AND UPPER(reference_id) = ?)
    `).get(cleanUsername, cleanLower, cleanUpper, cleanUsername, cleanUsername, cleanUpper);

    if (!user) {
      // Neutralize username enumeration via timing attacks by computing identical bcrypt cycles
      bcrypt.compareSync(password, DUMMY_BCRYPT_HASH);
      recordFailure(cleanLower);
      recordFailure(req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username, admission number, or phone and password.'
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
      recordFailure(cleanLower);
      recordFailure(req.ip);
      logAudit(user.id, 'LOGIN_FAILED', 'AUTH', `Failed login attempt for ${cleanUsername} from IP ${req.ip}`, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your password.'
      });
    }

    // Reset failed attempt counters on successful authentication
    clearFailure(cleanLower);
    clearFailure(req.ip);

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

    const { studentDetails, children, staffDetails } = getRoleProfileDetails(
      user.role,
      user.reference_id,
      user.username,
      user.email
    );

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
        student: studentDetails,
        children: children,
        staff: staffDetails
      }
    });
  } catch (err) {
    next(err);
  }
});

const executiveLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  security_key: z.string().optional()
});

/**
 * POST /api/auth/executive-login
 * Dedicated High-Security Authentication Endpoint for SuperAdmin
 * Isolated from public portal authentication flows.
 */
router.post('/executive-login', (req, res, next) => {
  try {
    const parseResult = executiveLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const { username, password } = parseResult.data;
    const cleanUsername = username.trim();
    const cleanLower = cleanUsername.toLowerCase();

    // Check for active lockout against executive account or IP
    const accountLockMinutes = checkLockout(cleanLower);
    const ipLockMinutes = checkLockout(req.ip);
    const activeLock = accountLockMinutes || ipLockMinutes;
    if (activeLock) {
      return res.status(429).json({
        success: false,
        message: `Executive Console is temporarily locked due to excessive failed attempts. Please retry in ${activeLock} minute(s).`
      });
    }

    const user = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
    `).get(cleanUsername, cleanLower);

    if (!user) {
      bcrypt.compareSync(password, DUMMY_BCRYPT_HASH);
      recordFailure(cleanLower);
      recordFailure(req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid executive credentials.'
      });
    }

    if (user.role !== 'superadmin') {
      logAudit(user.id, 'UNAUTHORIZED_EXECUTIVE_ACCESS_ATTEMPT', 'SECURITY', `Unauthorized non-superadmin (${user.username}, role: ${user.role}) attempted executive login from ${req.ip}`, req.ip);
      return res.status(403).json({
        success: false,
        message: 'Access Denied: The Executive Security Console is strictly reserved for SuperAdmin personnel.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin account has been deactivated. Please contact root database administration.'
      });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      recordFailure(cleanLower);
      recordFailure(req.ip);
      logAudit(user.id, 'EXECUTIVE_LOGIN_FAILED', 'SECURITY', `Failed executive login attempt for ${cleanUsername} from IP ${req.ip}`, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid executive credentials.'
      });
    }

    clearFailure(cleanLower);
    clearFailure(req.ip);

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Issue root executive JWT token with executive scope
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        scope: 'executive'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit(user.id, 'EXECUTIVE_CONSOLE_LOGIN', 'AUTH', `SuperAdmin authenticated to Executive Console from IP ${req.ip}`, req.ip);

    res.json({
      success: true,
      message: 'Executive Console root access granted.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        reference_id: user.reference_id
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
  const user = db.prepare('SELECT id, username, email, role, reference_id, full_name, is_active FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User session not found.' });
  }

  const { studentDetails, children, staffDetails } = getRoleProfileDetails(
    user.role,
    user.reference_id,
    user.username,
    user.email
  );

  res.json({
    success: true,
    user: {
      ...user,
      student: studentDetails,
      children: children,
      staff: staffDetails
    }
  });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticate, (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password || new_password.length < 8 || !/[A-Za-z]/.test(new_password) || !/\d/.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain both letters and numbers.'
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
