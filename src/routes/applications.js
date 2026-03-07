const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/applications  (public)
router.post(
  '/',
  upload.single('resume'),
  [
    body('job_title').notEmpty().trim(),
    body('full_name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const {
      job_id, job_title, full_name, email, phone,
      cover_letter, portfolio_url, linkedin_url,
    } = req.body;

    const resume_url = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.resume_url || null;

    try {
      const [result] = await pool.query(
        `INSERT INTO job_applications
          (job_id, job_title, full_name, email, phone, resume_url, cover_letter, portfolio_url, linkedin_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job_id || null, job_title, full_name, email,
          phone || null, resume_url, cover_letter || null,
          portfolio_url || null, linkedin_url || null,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM job_applications WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/applications  (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    let query = 'SELECT * FROM job_applications';
    const params = [];

    if (req.query.job_id) {
      query += ' WHERE job_id = ?';
      params.push(req.query.job_id);
    }

    if (req.query.status) {
      query += params.length ? ' AND' : ' WHERE';
      query += ' status = ?';
      params.push(req.query.status);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/applications/:id  (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'reviewing', 'shortlisted', 'rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM job_applications WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    await pool.query('UPDATE job_applications SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM job_applications WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/applications/:id  (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM job_applications WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    await pool.query('DELETE FROM job_applications WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Application deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
