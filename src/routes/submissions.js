const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// POST /api/submissions  (public)
router.post(
  '/',
  [
    body('form_type').isIn(['contact', 'consultation', 'support']),
    body('full_name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const {
      form_type, full_name, email, phone, company, subject, message,
      budget, preferred_date, preferred_time, service_interest, priority,
    } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO form_submissions
          (form_type, full_name, email, phone, company, subject, message,
           budget, preferred_date, preferred_time, service_interest, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          form_type, full_name, email, phone || null, company || null,
          subject || null, message || null, budget || null,
          preferred_date || null, preferred_time || null,
          service_interest || null, priority || 'normal',
        ]
      );

      const [rows] = await pool.query('SELECT * FROM form_submissions WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/submissions  (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    let query = 'SELECT * FROM form_submissions';
    const params = [];

    if (req.query.type) {
      query += ' WHERE form_type = ?';
      params.push(req.query.type);
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

// PUT /api/submissions/:id  (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM form_submissions WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    await pool.query('UPDATE form_submissions SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM form_submissions WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/submissions/:id  (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM form_submissions WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    await pool.query('DELETE FROM form_submissions WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Submission deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
