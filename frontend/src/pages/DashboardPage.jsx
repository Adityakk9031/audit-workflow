import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import {
  Users, FileText, CheckCircle2, AlertOctagon,
  ChevronRight, Plus, Loader2, Building2, Search,
  ArrowUpRight, ShieldCheck, Sparkles, FolderKanban,
  CheckCircle, FileSearch, Filter
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtext, alert = false, color = 'bg-slate-100 text-slate-700' }) {
  return (
    <div className={`card p-5 space-y-2 transition-all ${alert ? 'border-rose-200 bg-rose-50/40' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        {subtext && <p className="text-[11px] text-slate-500 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

function NewClientModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [financialYear, setFinancialYear] = useState('FY 2025-26');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [initializeChecklist, setInitializeChecklist] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client legal name is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/clients', {
        name: name.trim(),
        contact_email: email.trim() || undefined,
        financial_year: financialYear,
        gstin: gstin.trim() || undefined,
        pan: pan.trim() || undefined,
        initializeChecklist,
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create client engagement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create New Audit Client</h2>
            <p className="text-xs text-slate-500">Initiate an audit engagement for a CA firm client.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="label">Client Legal Entity Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Apex Industrial Solutions Pvt. Ltd."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Financial Year</label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="input"
              >
                <option value="FY 2025-26">FY 2025-26</option>
                <option value="FY 2024-25">FY 2024-25</option>
                <option value="FY 2023-24">FY 2023-24</option>
              </select>
            </div>

            <div>
              <label className="label">Accounts Contact Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                type="email"
                placeholder="accounts@client.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">GSTIN (Optional)</label>
              <input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="input font-mono text-xs uppercase"
                placeholder="27AABCA1234F1Z5"
              />
            </div>

            <div>
              <label className="label">PAN (Optional)</label>
              <input
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="input font-mono text-xs uppercase"
                placeholder="AABCA1234F"
              />
            </div>
          </div>

          {/* Standard Checklist Toggle */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="initChecklist"
              checked={initializeChecklist}
              onChange={(e) => setInitializeChecklist(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="initChecklist" className="text-xs text-indigo-950 font-medium cursor-pointer">
              Auto-generate Standard CA Audit Checklist
              <span className="block text-[11px] text-indigo-700/80 font-normal mt-0.5">
                Automatically provisions Bank Statement, Sales Register, Purchase Register, GST Return, and Expense Summary slots.
              </span>
            </label>
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
              Create Engagement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, firm } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'needs_action' | 'in_review' | 'completed'

  useEffect(() => {
    api.get('/clients')
      .then(({ data }) => setClients(data))
      .finally(() => setLoading(false));
  }, []);

  const totalDocs = clients.reduce((s, c) => s + (c.total_documents || 0), 0);
  const approvedDocs = clients.reduce((s, c) => s + (c.approved_documents || 0), 0);
  const correctionDocs = clients.reduce((s, c) => s + (c.correction_documents || 0), 0);
  const underReviewDocs = clients.reduce((s, c) => s + (c.under_review_documents || 0), 0);
  const overallProgress = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

  // Search & Filter
  const filteredClients = clients.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.contact_email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    if (filterTab === 'needs_action') return (c.correction_documents || 0) > 0;
    if (filterTab === 'in_review') return (c.under_review_documents || 0) > 0;
    if (filterTab === 'completed') return c.total_documents > 0 && c.approved_documents === c.total_documents;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Executive Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Dashboard</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                {firm?.name || 'CA Firm'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Managing {clients.length} active audit engagements.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Engagement</span>
              </button>
            )}
          </div>
        </div>

        {/* Audit KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={FolderKanban}
            label="Active Engagements"
            value={clients.length}
            subtext="Assigned CA clients"
            color="bg-indigo-50 text-indigo-700 border border-indigo-200"
          />

          <StatCard
            icon={CheckCircle2}
            label="Audit Checklist Progress"
            value={`${overallProgress}%`}
            subtext={`${approvedDocs} of ${totalDocs} verified`}
            color="bg-emerald-50 text-emerald-700 border border-emerald-200"
          />

          <StatCard
            icon={FileSearch}
            label="In Review Queue"
            value={underReviewDocs}
            subtext="Awaiting reviewer scrutiny"
            color="bg-amber-50 text-amber-800 border border-amber-200"
          />

          <StatCard
            icon={AlertOctagon}
            label="Action Required"
            value={correctionDocs}
            subtext="Corrections flagged by reviewers"
            alert={correctionDocs > 0}
            color="bg-rose-50 text-rose-700 border border-rose-200"
          />
        </div>

        {/* Engagements Section Header & Filter Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Audit Engagements ({filteredClients.length})
              </h2>
            </div>

            {/* Search + Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="input pl-8 py-1.5 text-xs w-48 sm:w-60 bg-white"
                />
              </div>

              {/* Quick Filter Tabs */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'needs_action', label: 'Needs Action' },
                  { id: 'in_review', label: 'In Review' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterTab === tab.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client Cards List */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading engagements...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No clients found</p>
              <p className="text-xs text-slate-400">
                {searchQuery ? 'Try adjusting your search query.' : 'Click "New Engagement" to create your first client.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredClients.map((client) => {
                const total = client.total_documents || 0;
                const approved = client.approved_documents || 0;
                const corrections = client.correction_documents || 0;
                const review = client.under_review_documents || 0;
                const progress = total > 0 ? Math.round((approved / total) * 100) : 0;

                return (
                  <Link
                    key={client.id}
                    to={`/clients/${client.id}`}
                    className="card-hover flex flex-col justify-between group space-y-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Client Name & Financial Year */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                              {client.name}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {client.contact_email || 'No contact email configured'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                          {client.financial_year || 'FY 2025-26'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Checklist Verification:</span>
                          <span className="font-semibold text-slate-900">{approved} / {total} ({progress}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${progress}%` }}
                            className="bg-emerald-500 h-full transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Pills Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {corrections > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {corrections} need correction
                          </span>
                        )}
                        {review > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {review} in review
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {total} documents total
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-indigo-600 group-hover:underline flex items-center gap-0.5">
                        Open File <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* New Client Modal */}
      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={(newClient) =>
            setClients((prev) => [
              {
                ...newClient,
                total_documents: 5,
                approved_documents: 0,
                correction_documents: 0,
                under_review_documents: 0,
              },
              ...prev,
            ])
          }
        />
      )}
    </div>
  );
}
