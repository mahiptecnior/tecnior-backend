const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const [rows] = await pool.query(
      "SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { authenticate, requireAdmin };
