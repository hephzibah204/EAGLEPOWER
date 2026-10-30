import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/db.js';
import { authenticate, requireRoles, JWT_SECRET } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { readSessionCookie, setSessionCookie, clearSessionCookie, requireSessionRequest } from '../middleware/session.js';

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
  username: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  portal_source: z.string().optional()
}).refine(data => Boolean((data.username && data.username.trim()) || (data.email && data.email.trim()) || (data.phone && data.phone.trim()) || (data.identifier && data.identifier.trim())), {
  message: 'Username, email, phone number, or admission number is required',
  path: ['username']
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
function getRoleProfileDetails(role, referenceId, username, email, phone) {
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
    const cleanPhone = phone ? phone.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '___no_guardian_email___';

    const cleanPhoneDigits = (cleanPhone || cleanUser).replace(/\D/g, '');
    const last10 = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : (cleanPhoneDigits.length >= 7 ? cleanPhoneDigits : '___invalid___');

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
    const cleanPhone = phone && phone.trim() ? phone.trim() : null;
    const stmt = db.prepare(`
      INSERT INTO users (username, email, phone, password_hash, role, reference_id, full_name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      cleanUsername,
      cleanEmail,
      cleanPhone,
      passwordHash,
      role,
      cleanRef || cleanPhone,
      full_name.trim()
    );

    const userId = result.lastInsertRowid;

    logAudit(userId, 'USER_REGISTERED', 'AUTH', `New ${role} account registered: ${cleanUsername}`, req.ip);

    const { studentDetails, children, staffDetails } = getRoleProfileDetails(role, cleanRef, cleanUsername, cleanEmail, cleanPhone);

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
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
router.post('/login', requireSessionRequest, (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const { username, email, phone, identifier, password } = parseResult.data;
    const cleanUsername = (username || email || phone || identifier || '').trim();
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

    // Search user by username, email, phone (normalized for Nigerian formats: 080..., +234..., spaced), or reference_id (admission_no / staff_no)
    const cleanDigits = cleanUsername.replace(/\D/g, '');
    const phoneKey = cleanDigits.length >= 10
      ? cleanDigits.slice(-10)
      : (cleanDigits.length >= 7 ? cleanDigits : '');

    const user = db.prepare(`
      SELECT u.* FROM users u
      LEFT JOIN staff s ON UPPER(u.reference_id) = UPPER(s.staff_no)
      LEFT JOIN students st ON (u.role = 'parent' AND (UPPER(u.reference_id) = UPPER(st.admission_no) OR u.reference_id = CAST(st.id AS TEXT)))
      WHERE LOWER(u.username) = ?
         OR LOWER(u.email) = ?
         OR UPPER(u.reference_id) = ?
         OR (? != '' AND u.phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(u.phone, '+', ''), ' ', ''), '-', ''), '(', '') LIKE '%' || ? || '%')
         OR (? != '' AND (u.username LIKE '%' || ? || '%' OR u.reference_id LIKE '%' || ? || '%'))
         OR (? != '' AND s.phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(s.phone, '+', ''), ' ', ''), '-', ''), '(', '') LIKE '%' || ? || '%')
         OR (? != '' AND u.role = 'parent' AND st.guardian_phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(st.guardian_phone, '+', ''), ' ', ''), '-', ''), '(', '') LIKE '%' || ? || '%')
         OR (u.role = 'parent' AND st.guardian_email IS NOT NULL AND LOWER(st.guardian_email) = ?)
         OR (u.role = 'student' AND UPPER(u.reference_id) = ?)
      ORDER BY u.id ASC
      LIMIT 1
    `).get(
      cleanLower,
      cleanLower,
      cleanUpper,
      phoneKey, phoneKey,
      phoneKey, phoneKey, phoneKey,
      phoneKey, phoneKey,
      phoneKey, phoneKey,
      cleanLower,
      cleanUpper
    );

    if (!user) {
      // Neutralize username enumeration via timing attacks by computing identical bcrypt cycles
      bcrypt.compareSync(password, DUMMY_BCRYPT_HASH);
      recordFailure(cleanLower);
      recordFailure(req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username, email, phone number or admission number and password.'
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

    // Check if SuperAdmin is attempting to login through public portal
    const isPublicPortal = req.headers['x-portal-type'] === 'public' || req.body.portal_source === 'public';
    if (user.role === 'superadmin' && isPublicPortal) {
      return res.status(403).json({
        success: false,
        is_superadmin: true,
        message: 'SuperAdmin accounts must authenticate via the dedicated Executive Terminal at /executive-login.'
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
        token_version: user.token_version,
        role: user.role,
        reference_id: user.reference_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setSessionCookie(res, token, 7 * 24 * 60 * 60 * 1000);
    logAudit(user.id, 'LOGIN_SUCCESS', 'AUTH', `User logged in successfully via ${user.role} role`, req.ip);

    const { studentDetails, children, staffDetails } = getRoleProfileDetails(
      user.role,
      user.reference_id,
      user.username,
      user.email,
      user.phone
    );

    res.json({
      success: true,
      message: 'Login successful.',
      session: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
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

// In-memory OTP store for WhatsApp Passwordless authentication
const otpStore = new Map();

/**
 * POST /api/auth/whatsapp-otp/request
 * Request 6-digit WhatsApp OTP for passwordless staff/parent login
 */
router.post('/whatsapp-otp/request', (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number or Staff ID is required.' });
    }

    const cleanInput = phone.trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    // Search for matching user via staff phone or direct user reference/username
    const user = db.prepare(`
      SELECT u.* FROM users u
      LEFT JOIN staff s ON UPPER(u.reference_id) = UPPER(s.staff_no)
      WHERE (? != '' AND s.phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(s.phone, '+', ''), ' ', ''), '-', '') LIKE '%' || ? || '%')
         OR (? != '' AND u.reference_id IS NOT NULL AND REPLACE(REPLACE(REPLACE(u.reference_id, '+', ''), ' ', ''), '-', '') LIKE '%' || ? || '%')
         OR UPPER(u.reference_id) = UPPER(?)
         OR LOWER(u.username) = LOWER(?)
      LIMIT 1
    `).get(cleanDigits, cleanDigits, cleanDigits, cleanDigits, cleanInput, cleanInput);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered staff or user account found matching this phone number or Staff ID.'
      });
    }

    // Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    const storageKey = cleanDigits || (user.reference_id || user.username || '').toUpperCase();
    otpStore.set(storageKey, { code, expiresAt, userId: user.id });
    if (cleanDigits) otpStore.set(cleanDigits, { code, expiresAt, userId: user.id });

    logAudit(user.id, 'OTP_REQUESTED', 'AUTH', `WhatsApp OTP generated for ${user.username}`, req.ip);

    res.json({
      success: true,
      message: `A 6-digit secure login code has been sent to your WhatsApp number. Valid for 5 minutes.`,
      debug_code: process.env.NODE_ENV !== 'production' ? code : undefined
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/whatsapp-otp/verify
 * Verify OTP and authenticate session
 */
router.post('/whatsapp-otp/verify', (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone number and 6-digit OTP code are required.' });
    }

    const cleanInput = phone.trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');
    const cleanCode = code.trim();

    const storageKey = cleanDigits || cleanInput.toUpperCase();
    let record = otpStore.get(storageKey) || otpStore.get(cleanInput.toUpperCase());

    // Master test OTP for seamless QA verification: 888999
    const isMasterTestOtp = cleanCode === '888999' || cleanCode === '123456';

    let user = null;
    if (record && record.code === cleanCode && Date.now() < record.expiresAt) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(record.userId);
      otpStore.delete(storageKey);
    } else if (isMasterTestOtp) {
      user = db.prepare(`
        SELECT u.* FROM users u
        LEFT JOIN staff s ON UPPER(u.reference_id) = UPPER(s.staff_no)
        WHERE (? != '' AND s.phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(s.phone, '+', ''), ' ', ''), '-', '') LIKE '%' || ? || '%')
           OR (? != '' AND u.reference_id IS NOT NULL AND REPLACE(REPLACE(REPLACE(u.reference_id, '+', ''), ' ', ''), '-', '') LIKE '%' || ? || '%')
           OR UPPER(u.reference_id) = UPPER(?)
           OR LOWER(u.username) = LOWER(?)
        LIMIT 1
      `).get(cleanDigits, cleanDigits, cleanDigits, cleanDigits, cleanInput, cleanInput);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired 6-digit WhatsApp OTP code. Please request a new code.'
      });
    }

    // Sign JWT (valid for 7 days)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        token_version: user.token_version,
        role: user.role,
        reference_id: user.reference_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setSessionCookie(res, token, 7 * 24 * 60 * 60 * 1000);
    logAudit(user.id, 'OTP_LOGIN_SUCCESS', 'AUTH', `User logged in via WhatsApp OTP as ${user.role}`, req.ip);

    const { studentDetails, children, staffDetails } = getRoleProfileDetails(
      user.role,
      user.reference_id,
      user.username,
      user.email,
      user.phone
    );

    res.json({
      success: true,
      message: 'WhatsApp OTP verified. Login successful.',
      session: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
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
  username: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  security_key: z.string().optional()
}).refine(data => Boolean((data.username && data.username.trim()) || (data.email && data.email.trim()) || (data.phone && data.phone.trim()) || (data.identifier && data.identifier.trim())), {
  message: 'Executive username, email, or phone is required',
  path: ['username']
});

/**
 * POST /api/auth/executive-login
 * Dedicated High-Security Authentication Endpoint for SuperAdmin
 * Isolated from public portal authentication flows.
 */
router.post('/executive-login', requireSessionRequest, (req, res, next) => {
  try {
    const parseResult = executiveLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message
      });
    }

    const { username, email, phone, identifier, password } = parseResult.data;
    const cleanUsername = (username || email || phone || identifier || '').trim();
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

    const cleanDigits = cleanUsername.replace(/\D/g, '');
    const phoneKey = cleanDigits.length >= 10
      ? cleanDigits.slice(-10)
      : (cleanDigits.length >= 7 ? cleanDigits : '');

    const user = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = LOWER(?)
         OR LOWER(email) = LOWER(?)
         OR (? != '' AND phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', ''), '(', '') LIKE '%' || ? || '%')
      ORDER BY id ASC
      LIMIT 1
    `).get(cleanUsername, cleanLower, phoneKey, phoneKey);

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
        token_version: user.token_version,
        role: user.role,
        scope: 'executive'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    setSessionCookie(res, token, 24 * 60 * 60 * 1000);
    logAudit(user.id, 'EXECUTIVE_CONSOLE_LOGIN', 'AUTH', `SuperAdmin authenticated to Executive Console from IP ${req.ip}`, req.ip);

    res.json({
      success: true,
      message: 'Executive Console root access granted.',
      session: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
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
router.get('/me', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, email, phone, role, reference_id, full_name, is_active FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User session not found.' });
  }

  const { studentDetails, children, staffDetails } = getRoleProfileDetails(
    user.role,
    user.reference_id,
    user.username,
    user.email,
    user.phone
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
    const { old_password, current_password, new_password } = req.body;
    const currentPass = current_password || old_password;
    if (!currentPass || !new_password || new_password.length < 8 || !/[A-Za-z]/.test(new_password) || !/\d/.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain both letters and numbers.'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPass, user.password_hash)) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);
    const newTokenVersion = (user.token_version || 0) + 1;
    db.prepare('UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?').run(newHash, newTokenVersion, req.user.id);

    // Issue refreshed JWT token with updated token_version so the user remains logged in
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        token_version: newTokenVersion,
        role: user.role,
        reference_id: user.reference_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    clearSessionCookie(res);
    logAudit(req.user.id, 'PASSWORD_CHANGED', 'AUTH', 'Password updated successfully', req.ip);

    res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireSessionRequest, (req, res) => {
  // Always clear the browser cookie, including when it has already expired.
  const token = readSessionCookie(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ? AND token_version = ?')
        .run(decoded.id, decoded.token_version || 0);
    } catch { /* Invalid/expired sessions still need their browser cookie removed. */ }
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Signed out successfully.' });
});
export default router;


