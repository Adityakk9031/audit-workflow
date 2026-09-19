import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import {
  ChevronRight, Plus, FileText, Loader2, ArrowLeft,
  LayoutGrid, List, CheckCircle2, AlertOctagon, Clock,
  UploadCloud, Search, ShieldCheck, Sparkles, FolderOpen
} from 'lucide-react';

const DEFAULT_DOC_SUGGESTIONS = [
  { name: 'Bank Statement', category: 'Banking & Treasury' },
  { name: 'Sales Register', category: 'Revenue & Billing' },
  { name: 'Purchase Register', category: 'Expenditure & Payables' },
  { name: 'GST Return (GSTR-3B / 1)', category: 'Indirect Taxation' },
  { name: 'Expense Summary & Vouchers', category: 'Financial Statements' },
  { name: 'Fixed Asset Register', category: 'Statutory Books' },
  { name: 'TDS Reconciliation Statement', category: 'Direct Taxation' },
  { name: 'Board Resolution & Minutes', category: 'Corporate Governance' },
];

function AddDocumentModal({ clientId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Banking & Treasury');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Document name is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('client_id', clientId);
      formData.append('name', name.trim());
      formData.append('category', category);
      if (file) formData.append('file', file);

      const { data } = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add document to checklist');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(preset) {
    setName(preset.name);
    setCategory(preset.category);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add Audit Document</h2>
            <p className="text-xs text-slate-500">Add a required audit deliverable for this client.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Suggested CA Audit Documents
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_DOC_SUGGESTIONS.slice(0, 5).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors cursor-pointer"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="label">Document Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Bank Statement (HDFC Current A/c)"
              required
            />
          </div>

          <div>
            <label className="label">Audit Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="Banking & Treasury">Banking & Treasury</option>
              <option value="Revenue & Billing">Revenue & Billing</option>
              <option value="Expenditure & Payables">Expenditure & Payables</option>
              <option value="Indirect Taxation">Indirect Taxation</option>
              <option value="Direct Taxation">Direct Taxation</option>
              <option value="Statutory Books">Statutory Books</option>
              <option value="Financial Statements">Financial Statements</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="label">Initial File Attachment (Optional)</label>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="input py-1.5 text-xs text-slate-600"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.doc,.docx"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to create a pending document slot for staff to fulfill.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Save Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [documents, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/documents`),
    ])
      .then(([cRes, dRes]) => {
        setClient(cRes.data);
        setDocs(dRes.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleInitializeChecklist() {
    setLoading(true);
    try {
      const { data } = await api.post(`/clients/${id}/initialize-checklist`);
      setDocs(data);
    } catch (err) {
      console.error('Failed to init checklist', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !client) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">Loading audit engagement...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Client Not Found</h2>
          <p className="text-xs text-slate-500">
            This client does not exist or belongs to another firm. Tenant isolation prevents cross-firm access.
          </p>
          <Link to="/" className="btn-secondary mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const approvedCount = documents.filter((d) => d.status === 'approved').length;
  const correctionCount = documents.filter((d) => d.status === 'correction_required').length;
  const underReviewCount = documents.filter((d) => d.status === 'under_review').length;
  const uploadedCount = documents.filter((d) => d.status === 'uploaded').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const totalCount = documents.length;
  const percentComplete = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  // Filtering
  const filtered = documents.filter((doc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchCat = doc.category?.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }
    if (filter === 'correction_required') return doc.status === 'correction_required';
    if (filter === 'under_review') return doc.status === 'under_review';
    if (filter === 'uploaded') return doc.status === 'uploaded';
    if (filter === 'pending') return doc.status === 'pending';
    if (filter === 'approved') return doc.status === 'approved';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Engagements
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{client.name}</span>
        </div>

        {/* Client Engagement Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {client.financial_year || 'FY 2025-26'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                {client.contact_email && (
                  <span>Contact: <strong className="text-slate-700">{client.contact_email}</strong></span>
                )}
                {client.gstin && (
                  <span>GSTIN: <strong className="text-slate-700 font-mono">{client.gstin}</strong></span>
                )}
                {client.pan && (
                  <span>PAN: <strong className="text-slate-700 font-mono">{client.pan}</strong></span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {documents.length === 0 && (
                <button
                  onClick={handleInitializeChecklist}
                  className="btn-secondary text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Generate Standard Checklist</span>
                </button>
              )}
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <button onClick={() => setModal(true)} className="btn-primary text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document</span>
                </button>
              )}
            </div>
          </div>

          {/* Audit Progress Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Checklist Verification Progress:</span>
                <span className="text-slate-600">
                  {approvedCount} of {totalCount} documents approved
                </span>
              </div>
              <span className="font-bold text-slate-900">{percentComplete}%</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${totalCount ? (approvedCount / totalCount) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`${approvedCount} Approved`}
              />
              <div
                style={{ width: `${totalCount ? (underReviewCount / totalCount) * 100 : 0}%` }}
                className="bg-amber-400 h-full transition-all duration-300"
                title={`${underReviewCount} Under Review`}
              />
              <div
                style={{ width: `${totalCount ? (correctionCount / totalCount) * 100 : 0}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`${correctionCount} Needs Correction`}
              />
              <div
                style={{ width: `${totalCount ? (uploadedCount / totalCount) * 100 : 0}%` }}
                className="bg-sky-400 h-full transition-all duration-300"
                title={`${uploadedCount} Uploaded`}
              />
            </div>
          </div>
        </div>

        {/* Filter Controls & View Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All', count: totalCount },
              { id: 'correction_required', label: 'Action Required', count: correctionCount, alert: true },
              { id: 'under_review', label: 'Under Review', count: underReviewCount },
              { id: 'uploaded', label: 'Ready for Review', count: uploadedCount },
              { id: 'pending', label: 'Pending Upload', count: pendingCount },
              { id: 'approved', label: 'Approved', count: approvedCount },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filter === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : t.alert && t.count > 0
                    ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    filter === t.id
                      ? 'bg-slate-700 text-slate-200'
                      : t.alert && t.count > 0
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right: Search & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter documents..."
                className="input pl-8 py-1 text-xs w-48 bg-white"
              />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Detailed Audit Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Display: Table or Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No documents match this filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'Try clearing your search term.' : 'Use "Add Document" to add audit deliverables to this engagement checklist.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ── DETAILED AUDIT TABLE VIEW ────────────────────────────── */
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Audit Document</th>
                    <th className="py-3.5 px-3">Category</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Version</th>
                    <th className="py-3.5 px-3">Review Remarks / Notes</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/documents/${doc.id}`)}
                    >
                      {/* Document Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                          <span className="group-hover:text-indigo-600 transition-colors">
                            {doc.name}
                          </span>
                        </div>
                        {doc.original_filename && (
                          <span className="text-[10px] text-slate-400 font-normal block pl-6">
                            {doc.original_filename}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {doc.category || 'General'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3">
                        <StatusBadge status={doc.status} />
                      </td>

                      {/* Revision */}
                      <td className="py-3.5 px-3 text-slate-500 font-mono">
                        v{doc.version || 1}
                      </td>

                      {/* Review Remarks */}
                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                        {doc.review_comment ? (
                          <span className={doc.status === 'correction_required' ? 'text-rose-700 font-medium' : ''}>
                            {doc.review_comment}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No notes</span>
                        )}
                      </td>

                      {/* Action Link */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/documents/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-900 group-hover:underline"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── CARD GRID VIEW ───────────────────────────────────────── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="card-hover flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {doc.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {doc.category || 'General'}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>

                  {/* Remarks preview if present */}
                  {doc.review_comment && (
                    <div className={`p-2 rounded text-[11px] leading-tight ${
                      doc.status === 'correction_required' ? 'bg-rose-50 text-rose-900' : 'bg-slate-50 text-slate-600'
                    }`}>
                      <span className="font-semibold block text-[10px] uppercase opacity-70">Remark</span>
                      <p className="truncate">{doc.review_comment}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{doc.file_path ? '📎 Attachment on file' : '📭 Awaiting upload'}</span>
                  <span className="font-medium text-indigo-600 group-hover:underline flex items-center gap-0.5">
                    Open File →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Add Document Modal */}
      {showModal && (
        <AddDocumentModal
          clientId={id}
          onClose={() => setModal(false)}
          onCreated={(newDoc) => setDocs((prev) => [newDoc, ...prev])}
        />
      )}
    </div>
  );
}
