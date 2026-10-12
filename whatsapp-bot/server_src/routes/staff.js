import express from 'express';
import db from '../config/db.js';

const router = express.Router();

/**
 * GET /api/staff
 * Public & authenticated staff roster
 */
router.get('/', (req, res, next) => {
  try {
    const staff = db.prepare(`
      SELECT id, staff_no, name, role, email, phone, qualification, assigned_class
      FROM staff
      WHERE is_active = 1
      ORDER BY id ASC
    `).all();

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    next(err);
  }
});

export default router;
