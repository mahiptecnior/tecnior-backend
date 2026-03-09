const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/case-studies
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM case_studies';
    const conditions = [];
    const params = [];

    if (req.query.active === 'true') {
      conditions.push('is_active = TRUE');
    }
    if (req.query.category) {
      conditions.push('category = ?');
      params.push(req.query.category);
    }
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/case-studies/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM case_studies WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/case-studies
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
      title, slug, client, industry, category, product_used, icon,
      challenge, solution, image_url, results, testimonial, tags,
      is_active, is_featured, sort_order,
    } = req.body;

    try {
      await pool.query(
        `INSERT INTO case_studies (title, slug, client, industry, category, product_used, icon,
          challenge, solution, image_url, results, testimonial, tags, is_active, is_featured, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, slug, client || null, industry || null,
          category || 'client-project', product_used || null, icon || 'Briefcase',
          challenge || null, solution || null, image_url || null,
          results ? JSON.stringify(results) : null,
          testimonial ? JSON.stringify(testimonial) : null,
          tags ? JSON.stringify(tags) : null,
          is_active ?? true, is_featured ?? false, sort_order ?? 0,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM case_studies WHERE slug = ?', [slug]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Slug already exists' });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/case-studies/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    title, slug, client, industry, category, product_used, icon,
    challenge, solution, image_url, results, testimonial, tags,
    is_active, is_featured, sort_order,
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM case_studies WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }

    await pool.query(
      `UPDATE case_studies SET title=?, slug=?, client=?, industry=?, category=?, product_used=?,
        icon=?, challenge=?, solution=?, image_url=?, results=?, testimonial=?, tags=?,
        is_active=?, is_featured=?, sort_order=? WHERE id=?`,
      [
        title, slug, client || null, industry || null,
        category || 'client-project', product_used || null, icon || 'Briefcase',
        challenge || null, solution || null, image_url || null,
        results ? JSON.stringify(results) : null,
        testimonial ? JSON.stringify(testimonial) : null,
        tags ? JSON.stringify(tags) : null,
        is_active ?? true, is_featured ?? false, sort_order ?? 0, req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM case_studies WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/case-studies/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM case_studies WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }

    await pool.query('DELETE FROM case_studies WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Case study deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
