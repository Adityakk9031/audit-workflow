/**
 * Seed script — creates two firms with users, clients, and sample documents.
 * Run once: node src/seed.js
 * Safe to re-run (checks for existing data first).
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const PASS_HASH = bcrypt.hashSync('password', 10);

async function seed() {
  await db.initSchema();

  const existing = await db.queryOne('SELECT COUNT(*) AS cnt FROM firms');
  if (parseInt(existing.cnt) > 0) {
    console.log('⚠️  Database already seeded. Skipping.');
    process.exit(0);
  }

  // ── Firms ──────────────────────────────────────────
  const firmAId = uuidv4();
  const firmBId = uuidv4();

  await db.execute(`INSERT INTO firms (id, name) VALUES ($1, $2)`, [firmAId, 'ABC & Co.']);
  await db.execute(`INSERT INTO firms (id, name) VALUES ($1, $2)`, [firmBId, 'XYZ & Co.']);

  // ── Users — Firm A ─────────────────────────────────
  const adminAId    = uuidv4();
  const reviewerAId = uuidv4();
  const staffAId    = uuidv4();

  await db.execute(
    `INSERT INTO users (id,firm_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,
    [adminAId,    firmAId, 'Priya Sharma', 'admin@abc.com',    PASS_HASH, 'admin']
  );
  await db.execute(
    `INSERT INTO users (id,firm_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,
    [reviewerAId, firmAId, 'Aman Verma',   'reviewer@abc.com', PASS_HASH, 'reviewer']
  );
  await db.execute(
    `INSERT INTO users (id,firm_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,
    [staffAId,    firmAId, 'Rohit Mehta',  'staff@abc.com',    PASS_HASH, 'staff']
  );

  // ── Users — Firm B ─────────────────────────────────
  const adminBId    = uuidv4();
  const reviewerBId = uuidv4();
  const staffBId    = uuidv4();

  await db.execute(
    `INSERT INTO users (id,firm_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,
    [adminBId,    firmBId, 'Sunita Rao',   'admin@xyz.com',    PASS_HASH, 'admin']
  );
  await db.execute(
    `INSERT INTO users (id,firm_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,
    [reviewerBId, firmBId, 'Karan Joshi',  'reviewer@xyz.com', PASS_HASH, 'reviewer']
  );
  await db.execute(
    `INSERT INTO users (id,firm_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,
    [staffBId,    firmBId, 'Meena Pillai', 'staff@xyz.com',    PASS_HASH, 'staff']
  );

  // ── Clients — Firm A ───────────────────────────────
  const clientA1Id = uuidv4();
  const clientA2Id = uuidv4();

  await db.execute(
    `INSERT INTO clients (id,firm_id,name,contact_email) VALUES ($1,$2,$3,$4)`,
    [clientA1Id, firmAId, 'ABC Traders Pvt. Ltd.', 'accounts@abctraders.com']
  );
  await db.execute(
    `INSERT INTO clients (id,firm_id,name,contact_email) VALUES ($1,$2,$3,$4)`,
    [clientA2Id, firmAId, 'XYZ Exports Ltd.', 'finance@xyzexports.com']
  );

  // ── Clients — Firm B ───────────────────────────────
  const clientB1Id = uuidv4();
  const clientB2Id = uuidv4();

  await db.execute(
    `INSERT INTO clients (id,firm_id,name,contact_email) VALUES ($1,$2,$3,$4)`,
    [clientB1Id, firmBId, 'PQR Industries', 'info@pqrindustries.com']
  );
  await db.execute(
    `INSERT INTO clients (id,firm_id,name,contact_email) VALUES ($1,$2,$3,$4)`,
    [clientB2Id, firmBId, 'LMN Solutions', 'contact@lmnsolutions.com']
  );

  // ── Documents — Client A1 ─────────────────────────
  const docNames = [
    'Bank Statement',
    'Sales Register',
    'Purchase Register',
    'GST Return',
    'Expense Summary',
  ];

  for (const docName of docNames) {
    const docId = uuidv4();
    await db.execute(
      `INSERT INTO documents (id,firm_id,client_id,name,status,uploaded_by) VALUES ($1,$2,$3,$4,'pending',$5)`,
      [docId, firmAId, clientA1Id, docName, staffAId]
    );
    await db.execute(
      `INSERT INTO audit_log (id,firm_id,document_id,client_id,performed_by,action,comment)
       VALUES ($1,$2,$3,$4,$5,'document_added',$6)`,
      [uuidv4(), firmAId, docId, clientA1Id, adminAId, `${docName} was added to the checklist`]
    );
  }

  // ── Documents — Client B1 ─────────────────────────
  for (const docName of docNames) {
    const docId = uuidv4();
    await db.execute(
      `INSERT INTO documents (id,firm_id,client_id,name,status,uploaded_by) VALUES ($1,$2,$3,$4,'pending',$5)`,
      [docId, firmBId, clientB1Id, docName, staffBId]
    );
    await db.execute(
      `INSERT INTO audit_log (id,firm_id,document_id,client_id,performed_by,action,comment)
       VALUES ($1,$2,$3,$4,$5,'document_added',$6)`,
      [uuidv4(), firmBId, docId, clientB1Id, adminBId, `${docName} was added to the checklist`]
    );
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('── Firm A: ABC & Co. ───────────────────');
  console.log('  admin@abc.com    / password  (admin)');
  console.log('  reviewer@abc.com / password  (reviewer)');
  console.log('  staff@abc.com    / password  (staff)');
  console.log('');
  console.log('── Firm B: XYZ & Co. ───────────────────');
  console.log('  admin@xyz.com    / password  (admin)');
  console.log('  reviewer@xyz.com / password  (reviewer)');
  console.log('  staff@xyz.com    / password  (staff)');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
