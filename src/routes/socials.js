const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/socials  (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM social_links WHERE is_active = TRUE ORDER BY sort_order ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/socials  (admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [body('platform').notEmpty().trim(), body('url').isURL()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { platform, url, icon_svg, sort_order, is_active } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO social_links (platform, url, icon_svg, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
        [platform, url, icon_svg || null, sort_order ?? 0, is_active ?? true]
      );

      const [rows] = await pool.query('SELECT * FROM social_links WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/socials/:id  (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { platform, url, icon_svg, sort_order, is_active } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM social_links WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Social link not found' });
    }

    await pool.query(
      'UPDATE social_links SET platform=?, url=?, icon_svg=?, sort_order=?, is_active=? WHERE id=?',
      [platform, url, icon_svg || null, sort_order ?? 0, is_active ?? true, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM social_links WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/socials/:id  (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM social_links WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Social link not found' });
    }

    await pool.query('DELETE FROM social_links WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Social link deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
