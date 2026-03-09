const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/portfolio
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM portfolio';
    if (req.query.active === 'true') {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY sort_order ASC, created_at DESC';
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/portfolio/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM portfolio WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/portfolio
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty().trim(),
    body('slug').notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const {
      title, slug, client, category, description, challenge, solution, results,
      technologies, metrics, image_url, is_active, is_featured, sort_order,
    } = req.body;

    try {
      await pool.query(
        `INSERT INTO portfolio (title, slug, client, category, description, challenge, solution,
          results, technologies, metrics, image_url, is_active, is_featured, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, slug, client || null, category || null, description || null,
          challenge || null, solution || null, results || null,
          technologies ? JSON.stringify(technologies) : null,
          metrics ? JSON.stringify(metrics) : null,
          image_url || null, is_active ?? true, is_featured ?? false, sort_order ?? 0,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM portfolio WHERE slug = ?', [slug]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Slug already exists' });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/portfolio/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    title, slug, client, category, description, challenge, solution, results,
    technologies, metrics, image_url, is_active, is_featured, sort_order,
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM portfolio WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }

    await pool.query(
      `UPDATE portfolio SET title=?, slug=?, client=?, category=?, description=?, challenge=?,
        solution=?, results=?, technologies=?, metrics=?, image_url=?, is_active=?,
        is_featured=?, sort_order=? WHERE id=?`,
      [
        title, slug, client || null, category || null, description || null,
        challenge || null, solution || null, results || null,
        technologies ? JSON.stringify(technologies) : null,
        metrics ? JSON.stringify(metrics) : null,
        image_url || null, is_active ?? true, is_featured ?? false,
        sort_order ?? 0, req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM portfolio WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/portfolio/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM portfolio WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Portfolio item not found' });
    }

    await pool.query('DELETE FROM portfolio WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Portfolio item deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
