const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users  (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, display_name, avatar_url, created_at FROM users ORDER BY created_at DESC'
    );

    const [roles] = await pool.query('SELECT user_id, role FROM user_roles');

    const roleMap = {};
    roles.forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const data = users.map((u) => ({ ...u, roles: roleMap[u.id] || [] }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users  (admin)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'moderator', 'user']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password, display_name, role } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: 'Email already in use' });
      }

      const password_hash = await bcrypt.hash(password, 12);
      await pool.query(
        'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
        [email, password_hash, display_name || null]
      );

      const [users] = await pool.query(
        'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE email = ?',
        [email]
      );
      const user = users[0];

      await pool.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [user.id, role]);

      res.status(201).json({ success: true, data: { ...user, roles: [role] } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/users/:id/role  (admin)
router.put('/:id/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'moderator', 'user'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Replace all roles with the new one (upsert)
    await pool.query('DELETE FROM user_roles WHERE user_id = ?', [req.params.id]);
    await pool.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [req.params.id, role]);

    res.json({ success: true, data: { user_id: req.params.id, role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id/role  (admin)
router.delete('/:id/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role) {
      await pool.query('DELETE FROM user_roles WHERE user_id = ? AND role = ?', [req.params.id, role]);
    } else {
      await pool.query('DELETE FROM user_roles WHERE user_id = ?', [req.params.id]);
    }

    res.json({ success: true, data: { message: 'Role removed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
