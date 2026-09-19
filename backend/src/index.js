const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./db');

const authRoutes     = require('./routes/auth');
const clientRoutes   = require('./routes/clients');
const documentRoutes = require('./routes/documents');
const auditRoutes    = require('./routes/auditLog');
const securityRoutes = require('./routes/security');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/clients',   clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/api/security',  securityRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    service: 'AuditFlow API Engine',
    database: 'Neon PostgreSQL (Cloud)',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global Error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err.message);
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await db.initSchema();
    app.listen(PORT, () => {
      console.log(`✅ AuditFlow API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
