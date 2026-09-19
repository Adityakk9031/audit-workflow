/**
 * Database module — PostgreSQL via Neon (pg Pool).
 * All operations are async with parameterised queries for SQL injection security.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// ── Schema Initialization & Auto-Migration ────────────────────────────────────
async function initSchema() {
  // 1. Core tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS firms (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      firm_id       TEXT NOT NULL REFERENCES firms(id),
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK(role IN ('staff','reviewer','admin')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id             TEXT PRIMARY KEY,
      firm_id        TEXT NOT NULL REFERENCES firms(id),
      name           TEXT NOT NULL,
      contact_email  TEXT,
      financial_year TEXT DEFAULT 'FY 2025-26',
      gstin          TEXT,
      pan            TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id                TEXT PRIMARY KEY,
      firm_id           TEXT NOT NULL REFERENCES firms(id),
      client_id         TEXT NOT NULL REFERENCES clients(id),
      name              TEXT NOT NULL,
      file_path         TEXT,
      original_filename TEXT,
      file_size         INTEGER,
      file_type         TEXT,
      version           INTEGER DEFAULT 1,
      category          TEXT DEFAULT 'General',
      review_comment    TEXT,
      uploaded_by       TEXT REFERENCES users(id),
      status            TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','uploaded','under_review','approved','correction_required')),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id           TEXT PRIMARY KEY,
      firm_id      TEXT NOT NULL REFERENCES firms(id),
      document_id  TEXT NOT NULL REFERENCES documents(id),
      client_id    TEXT NOT NULL REFERENCES clients(id),
      performed_by TEXT NOT NULL REFERENCES users(id),
      action       TEXT NOT NULL CHECK(action IN (
                     'document_added',
                     'document_uploaded',
                     'review_started',
                     'approved',
                     'correction_requested',
                     'document_reuploaded'
                   )),
      comment      TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
    CREATE INDEX IF NOT EXISTS idx_documents_firm   ON documents(firm_id);
    CREATE INDEX IF NOT EXISTS idx_audit_document   ON audit_log(document_id);
    CREATE INDEX IF NOT EXISTS idx_audit_client     ON audit_log(client_id);
    CREATE INDEX IF NOT EXISTS idx_audit_firm       ON audit_log(firm_id);
  `);

  // 2. Safe in-place column migrations for existing deployments
  await pool.query(`
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_filename TEXT;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type TEXT;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_comment TEXT;

    ALTER TABLE clients ADD COLUMN IF NOT EXISTS financial_year TEXT DEFAULT 'FY 2025-26';
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS gstin TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS pan TEXT;
  `);

  console.log('✅ Database schema and migrations verified');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const db = {
  /** Returns all matching rows */
  async query(sql, params = []) {
    const res = await pool.query(sql, params);
    return res.rows;
  },

  /** Returns first row or null */
  async queryOne(sql, params = []) {
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
  },

  /** Executes a statement (INSERT/UPDATE/DELETE) */
  async execute(sql, params = []) {
    return pool.query(sql, params);
  },

  initSchema,
  pool,
};

module.exports = db;
