import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'eaglepower_secure_jwt_token_secret_key_2025_amikwo');

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('eaglepower_secure_jwt')) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing, too short (< 32 characters), or using default development secret in production.');
  }
}

/**
 * Authentication Middleware: Verifies Bearer JWT token
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No Bearer token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    
    // Check if user is still active in DB
    const user = db.prepare('SELECT id, username, email, role, full_name, reference_id, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated or no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} roles Allowed roles
 */
export function requireRoles(...roles) {
  const allowedRoles = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // superadmin always has access
    if (req.user.role === 'superadmin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

/**
 * Object-Level Authorization (BOLA/IDOR Prevention)
 * Verifies that the authenticated user has legitimate institutional or familial ownership over the student record
 * @param {string} paramKey Request param or query key containing student ID or Admission No
 * @param {'id' | 'admission_no' | 'auto'} lookupType Lookup identifier type
 */
export function requireStudentAccess(paramKey = 'id', lookupType = 'auto') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { role, reference_id, username, email } = req.user;

    // 1. SuperAdmin, Admin, Bursar, and Faculty have institutional clearance
    if (['superadmin', 'admin', 'bursar', 'teacher'].includes(role)) {
      return next();
    }

    // Extract target identifier from params or query
    const targetValue = req.params[paramKey] || req.query[paramKey] || req.body[paramKey];
    if (!targetValue) {
      return res.status(400).json({ success: false, message: `Missing student identifier parameter: ${paramKey}` });
    }

    // Find student in DB
    let student = null;
    const isNumeric = /^\d+$/.test(String(targetValue).trim());
    if (lookupType === 'id' || (lookupType === 'auto' && isNumeric)) {
      student = db.prepare('SELECT id, admission_no, guardian_phone, guardian_email FROM students WHERE id = ?').get(parseInt(targetValue));
    } else {
      student = db.prepare('SELECT id, admission_no, guardian_phone, guardian_email FROM students WHERE UPPER(admission_no) = UPPER(?)').get(String(targetValue).trim());
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Target student record was not found.' });
    }

    // 2. Student Self-Access Check
    if (role === 'student') {
      const cleanRef = (reference_id || username || '').trim().toUpperCase();
      if (cleanRef === student.admission_no.toUpperCase() || String(student.id) === String(reference_id)) {
        req.targetStudent = student;
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Students are strictly restricted to their own individual records.'
      });
    }

    // 3. Parent Child-Access Check
    if (role === 'parent') {
      const cleanRef = (reference_id || '').trim().toUpperCase();
      const cleanUser = (username || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhoneDigits = cleanUser.replace(/\D/g, '');
      const last10 = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : '___invalid___';

      // Check if this student is linked to the parent
      const isLinkedChild = (cleanRef && cleanRef === student.admission_no.toUpperCase()) ||
        (student.guardian_phone && (
          student.guardian_phone === cleanUser ||
          student.guardian_phone.replace(/\s+/g, '') === cleanUser.replace(/\s+/g, '') ||
          student.guardian_phone.replace(/\D/g, '').includes(last10)
        )) ||
        (student.guardian_email && student.guardian_email.toLowerCase() === cleanEmail);

      if (isLinkedChild) {
        req.targetStudent = student;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Security Violation: Parents may only access records of their officially enrolled children.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have authorization to view this student profile.'
    });
  };
}
