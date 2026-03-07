const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM job_openings WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs
router.post(
  '/',
  authenticate,
  requireAdmin,
  [body('title').notEmpty().trim(), body('department').notEmpty().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { title, department, location, type, description, icon, is_active, sort_order } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO job_openings (title, department, location, type, description, icon, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, department, location || 'Remote', type || 'Full-time',
          description || null, icon || 'Briefcase', is_active ?? true, sort_order ?? 0,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM job_openings WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/jobs/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { title, department, location, type, description, icon, is_active, sort_order } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM job_openings WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await pool.query(
      `UPDATE job_openings SET title=?, department=?, location=?, type=?, description=?,
        icon=?, is_active=?, sort_order=? WHERE id=?`,
      [
        title, department, location || 'Remote', type || 'Full-time',
        description || null, icon || 'Briefcase', is_active ?? true,
        sort_order ?? 0, req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM job_openings WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM job_openings WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await pool.query('DELETE FROM job_openings WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Job deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
