const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// ── File upload setup ─────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${uuidv4()}${cleanExt}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.xls', '.csv', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed. Please upload PDF, Excel, Word, or images.'));
  },
});

// ── Helper: get document metadata (excluding heavy file_data binary blob) ─────
async function getDocumentForFirm(docId, firmId) {
  return db.queryOne(
    `SELECT
       d.id, d.firm_id, d.client_id, d.name, d.file_path, d.original_filename,
       d.file_size, d.file_type, d.version, d.category, d.review_comment,
       d.uploaded_by, d.status, d.created_at, d.updated_at,
       u.name AS uploaded_by_name,
       u.role AS uploaded_by_role,
       c.name AS client_name,
       c.financial_year AS client_fy
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     LEFT JOIN clients c ON c.id = d.client_id
     WHERE d.id = $1 AND d.firm_id = $2`,
    [docId, firmId]
  );
}

// ── Helper: insert audit log entry (append-only) ──────────────────────────────
async function logAction({ firmId, documentId, clientId, performedBy, action, comment = null }) {
  await db.execute(
    `INSERT INTO audit_log (id, firm_id, document_id, client_id, performed_by, action, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), firmId, documentId, clientId, performedBy, action, comment]
  );
}

// ── POST /api/documents — Upload/Add new document ─────────────────────────────
router.post(
  '/',
  requireRole('staff', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { client_id, name, category } = req.body;
      if (!client_id || !name) {
        return res.status(400).json({ error: 'client_id and name are required' });
      }

      const client = await db.queryOne(
        'SELECT id FROM clients WHERE id = $1 AND firm_id = $2',
        [client_id, req.user.firmId]
      );
      if (!client) return res.status(404).json({ error: 'Client not found' });

      const docId = uuidv4();
      const filePath = req.file ? req.file.filename : null;
      const originalName = req.file ? req.file.originalname : null;
      const fileSize = req.file ? req.file.size : null;
      const fileType = req.file ? req.file.mimetype : null;
      const fileBuffer = req.file ? fs.readFileSync(req.file.path) : null;
      const status = req.file ? 'uploaded' : 'pending';
      const docCategory = category || 'General';

      await db.execute(
        `INSERT INTO documents (
           id, firm_id, client_id, name, file_path, original_filename,
           file_size, file_type, file_data, version, category, uploaded_by, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, $10, $11, $12)`,
        [
          docId, req.user.firmId, client_id, name.trim(), filePath,
          originalName, fileSize, fileType, fileBuffer, docCategory, req.user.id, status,
        ]
      );

      const action = req.file ? 'document_uploaded' : 'document_added';
      await logAction({
        firmId: req.user.firmId,
        documentId: docId,
        clientId: client_id,
        performedBy: req.user.id,
        action,
        comment: req.file ? `Initial upload: ${req.file.originalname} (${Math.round(fileSize / 1024)} KB)` : 'Document slot created in checklist',
      });

      const doc = await getDocumentForFirm(docId, req.user.firmId);
      res.status(201).json(doc);
    } catch (err) {
      console.error('Add document error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /api/documents/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await getDocumentForFirm(req.params.id, req.user.firmId);
    if (!doc) return res.status(404).json({ error: 'Document not found or access denied' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/documents/:id/file — Serve file inline / download ────────────────
// Serves directly from Neon PostgreSQL cloud storage (bytea), with local disk fallback.
// This guarantees files persist and display seamlessly on Render, Vercel, or any host!
router.get('/:id/file', async (req, res) => {
  try {
    const doc = await db.queryOne(
      `SELECT id, name, file_path, original_filename, file_type, file_data
       FROM documents
       WHERE id = $1 AND firm_id = $2`,
      [req.params.id, req.user.firmId]
    );

    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!doc.file_path && !doc.file_data) return res.status(404).json({ error: 'No file uploaded yet' });

    const downloadName = doc.original_filename || doc.name;
    const ext = path.extname(doc.original_filename || doc.file_path || '').toLowerCase();
    const contentType = doc.file_type || {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.csv': 'text/csv',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }[ext] || 'application/octet-stream';

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Type', contentType);

    // 1. Cloud storage (Neon PostgreSQL bytea) — Works across Render, Vercel, Localhost!
    if (doc.file_data) {
      return res.send(doc.file_data);
    }

    // 2. Fallback to local disk if file_data is not populated
    if (doc.file_path) {
      const filePath = path.join(UPLOADS_DIR, doc.file_path);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    return res.status(404).json({ error: 'File not found on cloud database or disk' });
  } catch (err) {
    console.error('File serving error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/documents/:id/upload — Upload / Re-upload file ─────────────────
router.post(
  '/:id/upload',
  requireRole('staff', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const doc = await getDocumentForFirm(req.params.id, req.user.firmId);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (!req.file) return res.status(400).json({ error: 'No file provided' });

      if (!['pending', 'correction_required'].includes(doc.status)) {
        return res.status(400).json({ error: `Cannot upload when status is '${doc.status}'` });
      }

      const isReupload = doc.status === 'correction_required';
      const action = isReupload ? 'document_reuploaded' : 'document_uploaded';
      const newVersion = (doc.version || 1) + (isReupload ? 1 : 0);
      const fileBuffer = fs.readFileSync(req.file.path);

      await db.execute(
        `UPDATE documents
         SET
           file_path = $1,
           original_filename = $2,
           file_size = $3,
           file_type = $4,
           file_data = $5,
           version = $6,
           status = 'uploaded',
           uploaded_by = $7,
           review_comment = $8,
           updated_at = NOW()
         WHERE id = $9 AND firm_id = $10`,
        [
          req.file.filename,
          req.file.originalname,
          req.file.size,
          req.file.mimetype,
          fileBuffer,
          newVersion,
          req.user.id,
          isReupload ? 'Revised version uploaded by staff' : null,
          doc.id,
          req.user.firmId,
        ]
      );

      const commentDetail = `File: ${req.file.originalname} (${Math.round(req.file.size / 1024)} KB) [v${newVersion}]`;
      await logAction({
        firmId: req.user.firmId,
        documentId: doc.id,
        clientId: doc.client_id,
        performedBy: req.user.id,
        action,
        comment: isReupload ? `Re-uploaded revised document: ${commentDetail}` : commentDetail,
      });

      const updated = await getDocumentForFirm(doc.id, req.user.firmId);
      res.json(updated);
    } catch (err) {
      console.error('Upload document error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── POST /api/documents/:id/review/start ─────────────────────────────────────
router.post('/:id/review/start', requireRole('reviewer', 'admin'), async (req, res) => {
  try {
    const doc = await getDocumentForFirm(req.params.id, req.user.firmId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.status !== 'uploaded') {
      return res.status(400).json({
        error: `Cannot start review. Document must be in 'uploaded' status, currently '${doc.status}'.`,
      });
    }

    await db.execute(
      `UPDATE documents
       SET status = 'under_review', updated_at = NOW()
       WHERE id = $1 AND firm_id = $2`,
      [doc.id, req.user.firmId]
    );

    await logAction({
      firmId: req.user.firmId,
      documentId: doc.id,
      clientId: doc.client_id,
      performedBy: req.user.id,
      action: 'review_started',
      comment: `Review begun by ${req.user.name} (${req.user.role})`,
    });

    res.json(await getDocumentForFirm(doc.id, req.user.firmId));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/documents/:id/review/approve ───────────────────────────────────
router.post('/:id/review/approve', requireRole('reviewer', 'admin'), async (req, res) => {
  try {
    const doc = await getDocumentForFirm(req.params.id, req.user.firmId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.status !== 'under_review') {
      return res.status(400).json({
        error: `Cannot approve. Document must be 'under_review', currently '${doc.status}'.`,
      });
    }

    const approvalComment = req.body.comment?.trim() || 'Document verified, reconciled, and approved for audit file.';

    await db.execute(
      `UPDATE documents
       SET status = 'approved', review_comment = $1, updated_at = NOW()
       WHERE id = $2 AND firm_id = $3`,
      [approvalComment, doc.id, req.user.firmId]
    );

    await logAction({
      firmId: req.user.firmId,
      documentId: doc.id,
      clientId: doc.client_id,
      performedBy: req.user.id,
      action: 'approved',
      comment: approvalComment,
    });

    res.json(await getDocumentForFirm(doc.id, req.user.firmId));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/documents/:id/review/correct ───────────────────────────────────
router.post('/:id/review/correct', requireRole('reviewer', 'admin'), async (req, res) => {
  try {
    const doc = await getDocumentForFirm(req.params.id, req.user.firmId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.status !== 'under_review') {
      return res.status(400).json({
        error: `Cannot request correction. Document must be 'under_review', currently '${doc.status}'.`,
      });
    }

    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        error: 'A specific review remark explaining the correction is required.',
      });
    }

    const cleanComment = comment.trim();

    await db.execute(
      `UPDATE documents
       SET status = 'correction_required', review_comment = $1, updated_at = NOW()
       WHERE id = $2 AND firm_id = $3`,
      [cleanComment, doc.id, req.user.firmId]
    );

    await logAction({
      firmId: req.user.firmId,
      documentId: doc.id,
      clientId: doc.client_id,
      performedBy: req.user.id,
      action: 'correction_requested',
      comment: cleanComment,
    });

    res.json(await getDocumentForFirm(doc.id, req.user.firmId));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
