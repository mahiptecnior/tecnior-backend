const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/blog
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM blog_posts';
    const conditions = [];
    const params = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }
    if (req.query.category) {
      conditions.push('category = ?');
      params.push(req.query.category);
    }
    if (req.query.featured === 'true') {
      conditions.push('is_featured = TRUE');
    }
    // Public access only sees published posts unless admin
    if (req.query.published === 'true') {
      conditions.push("status = 'published'");
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/blog/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/blog
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
      title, slug, excerpt, content, cover_image, author, category, tags,
      status, published_at, is_featured,
    } = req.body;

    const resolvedStatus = status || 'draft';
    const resolvedPublishedAt = resolvedStatus === 'published'
      ? (published_at || new Date())
      : published_at || null;

    try {
      await pool.query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, author, category,
          tags, status, published_at, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, slug, excerpt || null, content || null, cover_image || null,
          author || null, category || null,
          tags ? JSON.stringify(tags) : null,
          resolvedStatus, resolvedPublishedAt,
          is_featured ?? false,
        ]
      );

      const [rows] = await pool.query('SELECT * FROM blog_posts WHERE slug = ?', [slug]);
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'Slug already exists' });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/blog/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    title, slug, excerpt, content, cover_image, author, category, tags,
    status, published_at, is_featured,
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT id, status FROM blog_posts WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const resolvedStatus = status || existing[0].status;
    const resolvedPublishedAt = resolvedStatus === 'published'
      ? (published_at || new Date())
      : published_at || null;

    await pool.query(
      `UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, cover_image=?, author=?,
        category=?, tags=?, status=?, published_at=?, is_featured=? WHERE id=?`,
      [
        title, slug, excerpt || null, content || null, cover_image || null,
        author || null, category || null,
        tags ? JSON.stringify(tags) : null,
        resolvedStatus, resolvedPublishedAt,
        is_featured ?? false, req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/blog/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM blog_posts WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    await pool.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: 'Blog post deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
