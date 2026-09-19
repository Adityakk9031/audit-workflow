const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/audit-log
 * Query params: documentId, clientId, limit (default 150)
 *
 * RBAC Rules:
 * - Reviewer & Admin: Full access across entire firm, client, or document.
 * - Staff: Allowed to view audit history for a specific document (documentId required),
 *          allowing them to trace reviewer remarks and previous revision notes.
 *          Firm-wide audit logs remain restricted to Reviewer & Admin.
 *
 * Immutability:
 * - Read-only route. No POST, PUT, PATCH, or DELETE endpoints exist for audit_log.
 */
router.get('/', async (req, res) => {
  try {
    const { documentId, clientId, limit = 150 } = req.query;
    const userRole = req.user.role;

    // Staff role check: Must specify documentId
    if (userRole === 'staff' && !documentId) {
      return res.status(403).json({
        error: 'Access denied. Staff members may only inspect audit trails for specific assigned documents.',
      });
    }

    const params = [req.user.firmId];
    const conditions = ['al.firm_id = $1'];

    if (documentId) {
      params.push(documentId);
      conditions.push(`al.document_id = $${params.length}`);
    }

    if (clientId) {
      params.push(clientId);
      conditions.push(`al.client_id = $${params.length}`);
    }

    params.push(Math.min(Number(limit) || 150, 500));
    const limitParam = `$${params.length}`;

    const sql = `
      SELECT
        al.id,
        al.action,
        al.comment,
        al.created_at,
        al.document_id,
        al.client_id,
        d.name   AS document_name,
        d.status AS document_status,
        c.name   AS client_name,
        u.name   AS performed_by_name,
        u.role   AS performed_by_role,
        u.email  AS performed_by_email
      FROM audit_log al
      JOIN documents d ON d.id = al.document_id
      JOIN clients   c ON c.id = al.client_id
      JOIN users     u ON u.id = al.performed_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY al.created_at ASC
      LIMIT ${limitParam}
    `;

    const logs = await db.query(sql, params);
    res.json(logs);
  } catch (err) {
    console.error('Audit log query error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
