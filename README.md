# AuditFlow — Mini Audit Document Review System

A production-ready working prototype of an audit document workflow and compliance platform tailored for small and mid-sized Chartered Accountant (CA) firms. Built for the OBLIQ-in Full-Stack Evaluation challenge.

---

## Key Highlights

- **Multi-Tenant Architecture** — Complete database-level isolation between CA firms (e.g. Firm A: *ABC & Co.* and Firm B: *XYZ & Co.*).
- **Server-Enforced RBAC** — Dedicated roles for **Staff / Assistant**, **Reviewer / Senior Auditor**, and **Partner / Admin**.
- **Complete Audit Document Lifecycle** — `Pending Upload` → `Uploaded` → `Under Review` → `Approved` or `Correction Required` → `Revised Upload (v2)`.
- **Integrated Inline Document Viewer** — Reviewers inspect documents directly in the workspace (split-screen with zoom and download) without leaving the interface.
- **Traceable, Tamper-Evident Audit Trail** — Append-only ledger recording actor identity, exact timestamp, affected document, action type, and revision notes.
- **One-Click Persona Quick Switcher** — Evaluators can jump between Firm A and Firm B roles in seconds from anywhere in the UI.
- **Interactive Security & Tenant Isolation Inspector** — Built-in diagnostic tool with automated live tests proving cross-tenant isolation and RBAC security.
- **Enterprise CA Aesthetic** — Designed specifically for CA auditors: crisp layout, financial year context, checklist progress bars, and tabular audit sheets.
- **Cloud Database** — Powered by serverless PostgreSQL on **Neon**.

---

## Quick Start

### Prerequisites
- **Node.js 18+**
- npm

### 1. Backend Setup

```bash
cd backend
npm install

# .env is already configured with Neon PostgreSQL:
# DATABASE_URL=postgresql://...
# JWT_SECRET=audit-workflow-secret-change-in-prod
# PORT=5000

node src/seed.js    # Initializes schema and populates demo firms (safe to run once)
node src/index.js   # Starts API server on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev         # Starts UI on http://localhost:5173
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Demo Accounts

All demo accounts share the password: **`password`**

> **Tip:** You can use the **1-Click Persona Switcher** on the login page or in the top navigation bar to test any account instantly!

### Firm A — ABC & Co. (Chartered Accountants)
| User | Email | Role | Permissions |
|---|---|---|---|
| **Priya Sharma** | `admin@abc.com` | Partner / Admin | Full control, client setup, audit checklist, upload & review |
| **Aman Verma** | `reviewer@abc.com` | Senior Reviewer | Scrutinize documents, approve, request corrections, inspect audit trail |
| **Rohit Mehta** | `staff@abc.com` | Articled Staff | Upload deliverables, view correction remarks, submit revised versions |

### Firm B — XYZ & Co. (Chartered Accountants)
| User | Email | Role | Permissions |
|---|---|---|---|
| **Sunita Rao** | `admin@xyz.com` | Partner / Admin | Full control over Firm B engagements only |
| **Karan Joshi** | `reviewer@xyz.com` | Senior Reviewer | Review Firm B deliverables only |
| **Meena Pillai** | `staff@xyz.com` | Articled Staff | Manage Firm B documents only |

---

## Evaluator Walkthrough (The Complete Core Workflow)

Follow this 3-minute sequence to test the entire audit review cycle:

1. **Sign In as Staff** (`staff@abc.com` via 1-click switcher).
2. **Open Engagement**: Click on **ABC Traders Pvt. Ltd.** from the dashboard.
3. **Inspect Document**: Select **Bank Statement** (currently `Pending Upload`).
4. **Upload File**: Click **"Select & Upload Document"** and upload any PDF, image, or spreadsheet. The status immediately moves to `Uploaded (Ready for Review)`.
5. **Switch to Reviewer**: Click the **Demo Switcher** in the top navbar and pick **Aman Verma (Reviewer — Firm A)**.
6. **Begin Audit Review**: Click **"Begin Audit Review"**. Status transitions to `Under Review`.
7. **Request Correction**: In the Review Remarks box, pick the preset:
   > *"Page 3 is missing. Please upload the complete bank statement."*
   Click **"Request Correction"**. The document status updates to `Correction Required`.
8. **Switch back to Staff**: Switch to **Rohit Mehta (Staff — Firm A)**. Notice the prominent **Defect Remark banner** explaining what needs fixing. Click **"Upload Corrected Version (v2)"** to re-upload. Status returns to `Uploaded`.
9. **Reviewer Approves**: Switch back to **Aman Verma (Reviewer)** → Begin Review → click **"Approve Document"**.
10. **Inspect Audit History**: Click the **Audit Trail** tab to view the 7 immutable events generated during this workflow (who, what, when, and why).
11. **Verify Tenant Isolation**: Click the **"Tenant Isolation & Security"** button in the top navbar and click **"Run Live Isolation Audit"** to watch live automated security probes verify that Firm B cannot touch Firm A data.

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Tailwind CSS v4 Professional B2B Accounting Theme  │
│  - Dual View: Audit Checklist Table & Card Grid        │
│  - Inline Document Viewer (Images & PDFs)              │
│  - Interactive Security & Tenant Isolation Inspector   │
└───────────────────────────┬────────────────────────────┘
                            │ /api/* (Reverse Proxy)
┌───────────────────────────▼────────────────────────────┐
│                  Backend (Node.js + Express)           │
│  - JWT Authentication (Stateless, firm_id embedded)    │
│  - Server-Enforced RBAC Middleware (requireRole)        │
│  - Streaming File Delivery with inline Content-Disp.   │
│  - Security Probe Controller (/api/security/...)       │
└───────────────────────────┬────────────────────────────┘
                            │ Parameterized SQL Pool (SSL)
┌───────────────────────────▼────────────────────────────┐
│               PostgreSQL Database (Neon Serverless)    │
│  - firms (Tenants)                                     │
│  - users (Scoped to firm_id)                           │
│  - clients (Scoped to firm_id)                         │
│  - documents (Metadata, versioning, review_comment)    │
│  - audit_log (Append-only immutable event ledger)      │
└────────────────────────────────────────────────────────┘
```

---

## Security & Tenant Isolation Design

> **"Authentication ≠ Authorization. Frontend hiding a button ≠ Security."**

### 1. How Firm A Stays Isolated From Firm B
- **No Client-Supplied Tenant IDs:** The API never trusts a `firm_id` provided in query strings or JSON request bodies.
- **Cryptographic Token Binding:** When a user logs in, their verified `firm_id` is encoded into their HMAC-SHA256 signed JWT.
- **Mandatory SQL Isolation:** All database controllers extract `req.user.firmId` from the verified token and enforce parameterized filtering:
  ```sql
  SELECT * FROM clients WHERE id = $1 AND firm_id = $2;
  ```
- **IDOR Protection:** Even if a user from Firm B guesses or intercepts a UUID belonging to a Firm A client or document, the query returns `404 Not Found` because `firm_id` does not match.

### 2. Role-Based Access Control (RBAC)
Role checks are enforced server-side on route handlers via `requireRole(...)`:
- Only `staff` and `admin` can submit initial uploads and revised documents.
- Only `reviewer` and `admin` can invoke `/review/start`, `/review/approve`, and `/review/correct`.
- Normal staff attempts to approve documents are rejected with `403 Forbidden`.

### 3. Audit Trail Immutability
- The `audit_log` table is **strictly append-only**.
- There are **zero `UPDATE` or `DELETE` API endpoints** anywhere in the system.
- Audit events are emitted exclusively through internal server-side transactions (`logAction()`) triggered by valid state transitions.

---

## Document Status Lifecycle

```
           ┌──────────────────────┐
           │    Pending Upload    │
           └──────────┬───────────┘
                      │ Staff uploads file
                      ▼
           ┌──────────────────────┐
           │  Uploaded (Ready)    │
           └──────────┬───────────┘
                      │ Reviewer begins review
                      ▼
           ┌──────────────────────┐
           │     Under Review     │
           └────┬────────────┬────┘
                │            │
 Reviewer signs │            │ Reviewer requests correction
 off & approves │            │ ("Page 3 is missing...")
                ▼            ▼
   ┌────────────────┐   ┌───────────────────────────┐
   │    Approved    │   │    Correction Required    │
   └────────────────┘   └────────────┬──────────────┘
                                     │ Staff re-uploads revised
                                     │ document (Version 2)
                                     ▼
                        ┌───────────────────────────┐
                        │   Uploaded (Ready Rev 2)  │
                        └───────────────────────────┘
```

---

## REST API Reference

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch current profile & firm metadata |
| `GET` | `/api/clients` | All Roles | List firm's client engagements |
| `POST` | `/api/clients` | Admin | Create client & auto-provision checklist |
| `GET` | `/api/clients/:id` | All Roles | Fetch single client details |
| `GET` | `/api/clients/:id/documents` | All Roles | List audit checklist documents for client |
| `POST` | `/api/clients/:id/initialize-checklist` | Staff, Admin | Populate standard 5-document audit checklist |
| `POST` | `/api/documents` | Staff, Admin | Add new document deliverable to checklist |
| `GET` | `/api/documents/:id` | All Roles | Fetch document metadata & review remarks |
| `GET` | `/api/documents/:id/file` | All Roles | Stream document file inline (supports `?token=`) |
| `POST` | `/api/documents/:id/upload` | Staff, Admin | Upload or re-upload revised document |
| `POST` | `/api/documents/:id/review/start` | Reviewer, Admin | Transition document to `under_review` |
| `POST` | `/api/documents/:id/review/approve` | Reviewer, Admin | Approve document & record sign-off note |
| `POST` | `/api/documents/:id/review/correct` | Reviewer, Admin | Request correction & record defect note |
| `GET` | `/api/audit-log` | Reviewer, Admin (Staff for docId) | Query immutable audit history |
| `GET` | `/api/security/test-isolation` | All Roles | Execute live multi-tenant isolation diagnostics |

---

## One Important Question

### *"What would you improve if you had one more week?"*

If I had one more week, the highest-leverage improvement would be **Real-Time Synchronous Audit Collaboration (WebSockets & In-App Activity Stream)**.

In a real CA firm during peak tax and statutory audit seasons, the biggest friction is the **communication gap** between Articled Staff (who gather and scan client records) and Senior Reviewers (who scrutinize them). Today, when a reviewer requests a correction, staff members typically only find out when they are chased on WhatsApp or manually reload their browser tabs.

With an extra week, I would implement:
1. **WebSocket-Powered Live State Updates (Socket.io)**: Push document status changes and reviewer remarks instantaneously to active staff screens. When a reviewer marks *"Page 3 is missing"*, the staff workspace immediately flags the document with an audible/visual badge without requiring page refreshes.
2. **Side-by-Side Document Diff & Visual Annotations**: Enable auditors to drop highlighted pins and notes directly onto specific pages of uploaded PDFs and images (e.g. highlighting missing stamp on Page 3).
3. **Role-Based Notification Bell & Daily Audit Digest**: An in-app notifications center with consolidated daily email summaries via Nodemailer for pending audit items.

**Secondary Polish Items:**
- Document multi-version comparison (side-by-side v1 vs v2 visual diff).
- Custom engagement checklist templates (e.g. "Tax Audit u/s 44AB", "Company Statutory Audit", "GST Annual Audit").
- Bulk document download / export as a signed Audit Dossier ZIP.

---

## AI Usage Disclosure

- **Claude / Gemini (Antigravity)**:
  - Guided initial project scaffolding and schema modeling.
  - Implemented the migration from SQLite to Neon PostgreSQL.
  - Developed the UI overhaul from generic dark theme to a professional light B2B CA audit workspace.
  - Built the live Security & Tenant Isolation inspector and automated end-to-end PowerShell integration test suite.

**How AI was used:**
AI acted as an interactive pair-programmer throughout the build. All architecture decisions (JWT claims with `firm_id`, parameterized query isolation, append-only ledger design, server-side RBAC middleware, and document versioning) were explicitly engineered, code-reviewed, and verified through live integration tests against the cloud Neon PostgreSQL database.
