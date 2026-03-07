const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/seo?path=/about  (public)
router.get('/', async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ success: false, error: 'Query param "path" is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM page_seo WHERE page_path = ? AND is_active = TRUE',
      [path]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SEO entry not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/seo/all  (admin)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM page_seo ORDER BY page_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/seo/:id  (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    page_name, page_path, meta_title, meta_description, meta_keywords,
    og_title, og_description, og_image, og_type, canonical_url,
    robots, twitter_card, json_ld, is_active,
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM page_seo WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'SEO entry not found' });
    }

    await pool.query(
      `UPDATE page_seo SET page_name=?, page_path=?, meta_title=?, meta_description=?,
        meta_keywords=?, og_title=?, og_description=?, og_image=?, og_type=?,
        canonical_url=?, robots=?, twitter_card=?, json_ld=?, is_active=? WHERE id=?`,
      [
        page_name, page_path, meta_title || null, meta_description || null,
        meta_keywords || null, og_title || null, og_description || null,
        og_image || null, og_type || 'website', canonical_url || null,
        robots || 'index, follow', twitter_card || 'summary_large_image',
        json_ld ? JSON.stringify(json_ld) : null, is_active ?? true, req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM page_seo WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
