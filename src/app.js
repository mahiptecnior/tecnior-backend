require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS
app.use(
  cors({
    origin: ['https://tecnior.com', 'https://www.tecnior.com', 'https://tecnior.lovable.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/socials', require('./routes/socials'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/case-studies', require('./routes/caseStudies'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/pricing', require('./routes/pricing'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Tecnior API running on http://localhost:${PORT}`);
});

module.exports = app;
