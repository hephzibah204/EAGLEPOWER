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
  username: z.string().min(1, 'Username, phone or admission number is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
    // Match by reference_id (admission number) or guardian phone / email
    const cleanRef = referenceId ? referenceId.trim().toUpperCase() : '';
    const cleanUser = username ? username.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    const cleanPhoneDigits = cleanUser.replace(/\D/g, '');
    const last10 = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : '___invalid___';

    children = db.prepare(`
      SELECT s.*, c.name as class_name, c.division, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE UPPER(s.admission_no) = ?
         OR (s.guardian_phone IS NOT NULL AND (
             s.guardian_phone = ? 
             OR REPLACE(s.guardian_phone, ' ', '') = ?
             OR REPLACE(REPLACE(s.guardian_phone, '+', ''), ' ', '') LIKE ?
         ))
         OR (s.guardian_email IS NOT NULL AND LOWER(s.guardian_email) = ?)
      ORDER BY s.id ASC
    `).all(cleanRef, cleanUser, cleanUser.replace(/\s+/g, ''), `%${last10}%`, cleanEmail);
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
 * Public & Admin Portal Registration
 * Allows Parents, Students, and Staff to create portal accounts.
 */
router.post('/register', (req, res, next) => {
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

    // Prevent unauthorized privilege escalation: public self-registration is strictly for parents and students
    if (['admin', 'superadmin', 'bursar', 'teacher'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Registration for administrative and faculty roles cannot be done publicly. Please contact the Principal or IT administrator.'
      });
    }

    // 2. Validate reference_id if provided for parent / student
    if (role === 'parent' && cleanRef) {
      const student = db.prepare('SELECT id, first_name, last_name, admission_no FROM students WHERE UPPER(admission_no) = ?').get(cleanRef);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Child with Admission Number '${cleanRef}' not found in school records.`
        });
      }
    } else if (role === 'student' && cleanRef) {
      const student = db.prepare('SELECT id, first_name, last_name, admission_no FROM students WHERE UPPER(admission_no) = ?').get(cleanRef);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Admission Number '${cleanRef}' does not exist in student registry.`
        });
      }
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
      logAudit(user.id, 'LOGIN_FAILED', 'AUTH', `Failed login attempt for ${cleanUsername} from IP ${req.ip}`, req.ip);
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
