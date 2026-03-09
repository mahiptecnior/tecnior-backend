const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM products';
    const params = [];

    if (req.query.active === 'true') {
      query += ' WHERE is_active = TRUE';
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty().trim(),
    body('slug').notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const {
      name, slug, tagline, description, short_description, price, price_label,
      category, icon, features, highlights, detailed_features, plans, faqs,
      image_url, is_featured, is_active, sort_order,
    } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO products (name, slug, tagline, description, short_description, price, price_label,
          category, icon, features, highlights, detailed_features, plans, faqs,
          image_url, is_featured, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, slug, tagline || null, description || null, short_description || null,
          price || null, price_label || 'Starting from', category || null,
          icon || 'Package', features ? JSON.stringify(features) : null,
          highlights ? JSON.stringify(highlights) : null,
          detailed_features ? JSON.stringify(detailed_features) : null,
          plans ? JSON.stringify(plans) : null,
          faqs ? JSON.stringify(faqs) : null,
          image_url || null, is_featured ?? false, is_active ?? true, sort_order ?? 0,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Slug already exists' });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/products/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    name, slug, tagline, description, short_description, price, price_label,
    category, icon, features, highlights, detailed_features, plans, faqs,
    image_url, is_featured, is_active, sort_order,
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await pool.query(
      `UPDATE products SET name=?, slug=?, tagline=?, description=?, short_description=?, price=?,
        price_label=?, category=?, icon=?, features=?, highlights=?, detailed_features=?,
        plans=?, faqs=?, image_url=?, is_featured=?, is_active=?, sort_order=? WHERE id=?`,
      [
        name, slug, tagline || null, description || null, short_description || null,
        price || null, price_label || 'Starting from', category || null,
        icon || 'Package', features ? JSON.stringify(features) : null,
        highlights ? JSON.stringify(highlights) : null,
        detailed_features ? JSON.stringify(detailed_features) : null,
        plans ? JSON.stringify(plans) : null,
        faqs ? JSON.stringify(faqs) : null,
        image_url || null, is_featured ?? false, is_active ?? true,
        sort_order ?? 0, req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Product deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
