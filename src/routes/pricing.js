const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const PRICING_KEY = 'pricing_page';

// GET /api/pricing
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      [PRICING_KEY]
    );

    if (rows.length === 0 || !rows[0].setting_value) {
      return res.json({ success: true, data: { plans: [], guarantees: [], addOns: [] } });
    }

    res.json({ success: true, data: JSON.parse(rows[0].setting_value) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/pricing
router.put('/', authenticate, requireAdmin, async (req, res) => {
  const { plans, guarantees, addOns } = req.body;

  try {
    const value = JSON.stringify({ plans: plans || [], guarantees: guarantees || [], addOns: addOns || [] });

    await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value, setting_group)
       VALUES (?, ?, 'pricing')
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [PRICING_KEY, value]
    );

    res.json({ success: true, data: JSON.parse(value) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
