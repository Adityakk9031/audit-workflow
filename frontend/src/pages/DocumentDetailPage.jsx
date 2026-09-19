import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import ReviewPanel from '../components/ReviewPanel';
import AuditTimeline from '../components/AuditTimeline';
import {
  ChevronRight, Loader2, Clock, User, Calendar, History,
  FileText, ExternalLink, Download, Eye, ShieldAlert,
  CheckCircle2, FileSearch, Layers, Sparkles
} from 'lucide-react';

function MetaItem({ label, value, subtext }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-slate-800 mt-0.5">{value}</p>
      {subtext && <p className="text-[10px] text-slate-400">{subtext}</p>}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'history'

  const canSeeHistory = user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'staff';

  const fetchDocumentAndLogs = useCallback(async () => {
    try {
      const [docRes, logRes] = await Promise.all([
        api.get(`/documents/${id}`),
        api.get(`/audit-log?documentId=${id}`).catch(() => ({ data: [] })),
      ]);
      setDoc(docRes.data);
      setLogs(logRes.data);
    } catch (err) {
      console.error('Fetch document error:', err);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocumentAndLogs();
  }, [fetchDocumentAndLogs]);

  function handleDocUpdate(updated) {
    setDoc(updated);
    // Refresh audit trail
    api.get(`/audit-log?documentId=${id}`)
      .then(({ data }) => setLogs(data))
      .catch(() => {});
  }

  function getFileUrl() {
    if (!doc?.file_path) return null;
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || '/api';
    return `${base}/documents/${doc.id}/file?token=${encodeURIComponent(token)}`;
  }

  const fileUrl = getFileUrl();
  const isImage = doc?.file_path && (
    doc.file_type?.startsWith('image/') ||
    doc.file_path.match(/\.(png|jpe?g|webp)$/i)
  );
  const isPdf = doc?.file_path && (
    doc.file_type === 'application/pdf' ||
    doc.file_path.match(/\.pdf$/i)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">Loading document audit file...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Document Not Accessible</h2>
          <p className="text-xs text-slate-500">
            This document does not exist, or your account does not belong to the firm managing this engagement.
          </p>
          <Link to="/" className="btn-secondary mt-2 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Engagements
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to={`/clients/${doc.client_id}`} className="hover:text-slate-900 transition-colors font-medium">
            {doc.client_name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{doc.name}</span>
        </nav>

        {/* Engagement Title Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{doc.name}</h1>
              <StatusBadge status={doc.status} size="lg" />
              {doc.version > 1 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Revision v{doc.version}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Client: <strong className="text-slate-700">{doc.client_name}</strong>
              {doc.category && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Category: {doc.category}</span>}
              {doc.client_fy && <span className="ml-2 text-slate-400 font-mono">[{doc.client_fy}]</span>}
            </p>
          </div>

          {/* Quick Actions Header */}
          {fileUrl && (
            <div className="flex items-center gap-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
              <a
                href={fileUrl}
                download={doc.original_filename || doc.name}
                className="btn-secondary text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>

        {/* Main Split Layout: Left Preview & Remarks (60%), Right Workflow & Audit (40%) */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN: VIEWER & REVIEW REMARKS ─────────────────────── */}
          <div className="lg:col-span-7 space-y-5">
            {/* LATEST REVIEW REMARK BANNER (High Visibility) */}
            {doc.review_comment && (
              <div
                className={`rounded-xl p-4 border text-xs space-y-1 ${
                  doc.status === 'correction_required'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : doc.status === 'approved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    {doc.status === 'correction_required' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {doc.status === 'correction_required'
                      ? 'Reviewer Defect Note / Correction Requested'
                      : 'Audit Reviewer Sign-Off Note'}
                  </span>
                  <span className="text-[10px] opacity-70">Latest Remark</span>
                </div>
                <p className="font-medium whitespace-pre-wrap text-xs pt-1">{doc.review_comment}</p>
              </div>
            )}

            {/* INTEGRATED DOCUMENT PREVIEWER */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">
                    {doc.original_filename || doc.name}
                  </span>
                  {doc.file_size && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({formatFileSize(doc.file_size)})
                    </span>
                  )}
                </div>

                {fileUrl && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    File Attached
                  </span>
                )}
              </div>

              {/* Viewer Window */}
              <div className="p-4 flex items-center justify-center min-h-[380px] max-h-[600px] overflow-auto bg-slate-100/60">
                {fileUrl ? (
                  isImage ? (
                    <div className="relative group max-w-full">
                      <img
                        src={fileUrl}
                        alt={doc.name}
                        className="max-h-[520px] w-auto object-contain rounded-lg border border-slate-200 shadow-sm mx-auto bg-white"
                      />
                    </div>
                  ) : isPdf ? (
                    <iframe
                      src={fileUrl}
                      title={doc.name}
                      className="w-full h-[520px] rounded-lg border border-slate-200 bg-white"
                    />
                  ) : (
                    <div className="text-center py-16 px-4 space-y-3">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {doc.original_filename || 'Audit Document File'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Binary file ({formatFileSize(doc.file_size) || 'Attachment'}). Preview not supported inline.
                        </p>
                      </div>
                      <a href={fileUrl} download className="btn-primary text-xs inline-flex">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download File
                      </a>
                    </div>
                  )
                ) : (
                  <div className="text-center py-16 px-4 space-y-2 text-slate-400">
                    <FileSearch className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No document uploaded yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Use the upload action on the right to upload the {doc.name} for audit review.
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata strip footer */}
              <div className="px-5 py-3.5 border-t border-slate-200/80 bg-white grid grid-cols-3 gap-4">
                <MetaItem
                  label="Submitted By"
                  value={doc.uploaded_by_name || 'Pending assignment'}
                  subtext={doc.uploaded_by_role ? `Role: ${doc.uploaded_by_role}` : ''}
                />
                <MetaItem
                  label="Last Updated"
                  value={new Date(doc.updated_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  subtext={new Date(doc.updated_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
                <MetaItem
                  label="Audit Version"
                  value={`v${doc.version || 1}.0`}
                  subtext={doc.version > 1 ? 'Corrected copy' : 'Initial upload'}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: AUDIT WORKFLOW & TIMELINE ──────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tab switch for Review Action vs Full Audit Trail */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('review')}
                  className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'review'
                      ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/30'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Review Workflow</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'history'
                      ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/30'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Trail ({logs.length})</span>
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'review' ? (
                  <div className="space-y-4">
                    <ReviewPanel document={doc} onUpdate={handleDocUpdate} />

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Recent Trail</span>
                        <button
                          onClick={() => setActiveTab('history')}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px] cursor-pointer"
                        >
                          View all ({logs.length}) →
                        </button>
                      </div>
                      <AuditTimeline logs={logs.slice(-3)} documentName={doc.name} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Immutable Audit Ledger
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Traceable history of all upload, review, and verification events.
                      </p>
                    </div>
                    <AuditTimeline logs={logs} documentName={doc.name} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
