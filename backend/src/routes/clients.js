const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// Standard audit document package for CA firms
const STANDARD_CHECKLIST = [
  { name: 'Bank Statement', category: 'Banking & Treasury' },
  { name: 'Sales Register', category: 'Revenue & Billing' },
  { name: 'Purchase Register', category: 'Expenditure & Payables' },
  { name: 'GST Return (GSTR-3B / 1)', category: 'Indirect Taxation' },
  { name: 'Expense Summary & Vouchers', category: 'Financial Statements' },
];

// ── GET /api/clients ──────────────────────────────────────────────────────────
// Returns all clients belonging to the authenticated user's firm only
router.get('/', async (req, res) => {
  try {
    const clients = await db.query(
      `SELECT
         c.id, c.name, c.contact_email, c.financial_year, c.gstin, c.pan, c.created_at,
         COUNT(DISTINCT d.id)::int                                                  AS total_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'approved')::int            AS approved_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'under_review')::int        AS under_review_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'uploaded')::int            AS uploaded_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'correction_required')::int AS correction_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'pending')::int             AS pending_documents
       FROM clients c
       LEFT JOIN documents d ON d.client_id = c.id AND d.firm_id = c.firm_id
       WHERE c.firm_id = $1
       GROUP BY c.id
       ORDER BY c.name`,
      [req.user.firmId]
    );
    res.json(clients);
  } catch (err) {
    console.error('List clients error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/clients/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const client = await db.queryOne(
      `SELECT c.*,
         COUNT(DISTINCT d.id)::int                                                  AS total_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'approved')::int            AS approved_documents,
         COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'correction_required')::int AS correction_documents
       FROM clients c
       LEFT JOIN documents d ON d.client_id = c.id AND d.firm_id = c.firm_id
       WHERE c.id = $1 AND c.firm_id = $2
       GROUP BY c.id`,
      [req.params.id, req.user.firmId]
    );
    if (!client) return res.status(404).json({ error: 'Client not found or access denied' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/clients ─────────────────────────────────────────────────────────
// Admin creates client with optional auto-initialization of standard audit checklist
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const {
      name,
      contact_email,
      financial_year = 'FY 2025-26',
      gstin,
      pan,
      initializeChecklist = true,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const clientId = uuidv4();
    await db.execute(
      `INSERT INTO clients (id, firm_id, name, contact_email, financial_year, gstin, pan)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        clientId,
        req.user.firmId,
        name.trim(),
        contact_email?.trim() || null,
        financial_year.trim(),
        gstin?.trim() || null,
        pan?.trim() || null,
      ]
    );

    // Auto-create standard audit document slots if requested
    if (initializeChecklist) {
      for (const item of STANDARD_CHECKLIST) {
        const docId = uuidv4();
        await db.execute(
          `INSERT INTO documents (id, firm_id, client_id, name, category, status, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
          [docId, req.user.firmId, clientId, item.name, item.category, req.user.id]
        );

        await db.execute(
          `INSERT INTO audit_log (id, firm_id, document_id, client_id, performed_by, action, comment)
           VALUES ($1, $2, $3, $4, $5, 'document_added', $6)`,
          [
            uuidv4(),
            req.user.firmId,
            docId,
            clientId,
            req.user.id,
            `${item.name} (${item.category}) added to initial audit checklist`,
          ]
        );
      }
    }

    const client = await db.queryOne('SELECT * FROM clients WHERE id = $1', [clientId]);
    res.status(201).json(client);
  } catch (err) {
    console.error('Create client error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/clients/:id/initialize-checklist ───────────────────────────────
// Quick helper to populate audit checklist for clients that don't have any documents
router.post('/:id/initialize-checklist', requireRole('admin', 'staff'), async (req, res) => {
  try {
    const client = await db.queryOne(
      'SELECT id, name FROM clients WHERE id = $1 AND firm_id = $2',
      [req.params.id, req.user.firmId]
    );
    if (!client) return res.status(404).json({ error: 'Client not found' });

    for (const item of STANDARD_CHECKLIST) {
      // Check if document with same name already exists for client
      const existing = await db.queryOne(
        'SELECT id FROM documents WHERE client_id = $1 AND name = $2 AND firm_id = $3',
        [client.id, item.name, req.user.firmId]
      );
      if (!existing) {
        const docId = uuidv4();
        await db.execute(
          `INSERT INTO documents (id, firm_id, client_id, name, category, status, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
          [docId, req.user.firmId, client.id, item.name, item.category, req.user.id]
        );

        await db.execute(
          `INSERT INTO audit_log (id, firm_id, document_id, client_id, performed_by, action, comment)
           VALUES ($1, $2, $3, $4, $5, 'document_added', $6)`,
          [
            uuidv4(),
            req.user.firmId,
            docId,
            client.id,
            req.user.id,
            `${item.name} added to engagement checklist`,
          ]
        );
      }
    }

    const documents = await db.query(
      `SELECT
         d.id, d.firm_id, d.client_id, d.name, d.file_path, d.original_filename,
         d.file_size, d.file_type, d.version, d.category, d.review_comment,
         d.uploaded_by, d.status, d.created_at, d.updated_at,
         u.name AS uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.client_id = $1 AND d.firm_id = $2
       ORDER BY d.created_at ASC`,
      [client.id, req.user.firmId]
    );

    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/clients/:id/documents ───────────────────────────────────────────
router.get('/:id/documents', async (req, res) => {
  try {
    const client = await db.queryOne(
      'SELECT id FROM clients WHERE id = $1 AND firm_id = $2',
      [req.params.id, req.user.firmId]
    );
    if (!client) return res.status(404).json({ error: 'Client not found or access denied' });

    const documents = await db.query(
      `SELECT
         d.id, d.firm_id, d.client_id, d.name, d.file_path, d.original_filename,
         d.file_size, d.file_type, d.version, d.category, d.review_comment,
         d.uploaded_by, d.status, d.created_at, d.updated_at,
         u.name AS uploaded_by_name,
         u.role AS uploaded_by_role
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.client_id = $1 AND d.firm_id = $2
       ORDER BY
         CASE d.status
           WHEN 'correction_required' THEN 1
           WHEN 'under_review' THEN 2
           WHEN 'uploaded' THEN 3
           WHEN 'pending' THEN 4
           WHEN 'approved' THEN 5
         END ASC,
         d.created_at ASC`,
      [req.params.id, req.user.firmId]
    );
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
