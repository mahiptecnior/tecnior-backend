const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/settings  (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    let query = 'SELECT * FROM site_settings';
    const params = [];

    if (req.query.group) {
      query += ' WHERE setting_group = ?';
      params.push(req.query.group);
    }

    query += ' ORDER BY setting_group, setting_key';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings/:key  (admin)
router.put('/:key', authenticate, requireAdmin, async (req, res) => {
  const { setting_value, setting_group, is_encrypted } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM site_settings WHERE setting_key = ?',
      [req.params.key]
    );

    if (existing.length === 0) {
      // Upsert: create if not exists
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value, setting_group, is_encrypted) VALUES (?, ?, ?, ?)',
        [req.params.key, setting_value ?? null, setting_group || 'general', is_encrypted ?? false]
      );
    } else {
      await pool.query(
        'UPDATE site_settings SET setting_value=?, setting_group=?, is_encrypted=? WHERE setting_key=?',
        [setting_value ?? null, setting_group || 'general', is_encrypted ?? false, req.params.key]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM site_settings WHERE setting_key = ?',
      [req.params.key]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
