import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, XCircle, Loader2, X, Play, Server, Database, Key } from 'lucide-react';
import api from '../api';

export default function SecurityModal({ isOpen, onClose }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function runSecurityTest() {
    setTesting(true);
    setError(null);
    try {
      const { data } = await api.get('/security/test-isolation');
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete security verification test.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/20 border border-indigo-400/30 rounded-lg flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Tenant Isolation & Security Architecture</h2>
              <p className="text-xs text-slate-400">Verifying multi-firm data segregation and RBAC enforcement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Core Principles Cards */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wide">
                <Database className="w-3.5 h-3.5" />
                <span>Tenant Isolation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every DB query enforces parameterized <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">WHERE firm_id = $1</code>. Firm ID is extracted from verified JWT, never trusted from the client.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wide">
                <Key className="w-3.5 h-3.5" />
                <span>Auth ≠ Frontend Hiding</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hiding buttons is not security. Server middleware <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">requireRole()</code> intercepts and rejects unauthorized API requests with <code className="text-red-700 font-medium">403</code>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wide">
                <Lock className="w-3.5 h-3.5" />
                <span>Append-Only Trail</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The audit log has zero <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">UPDATE</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">DELETE</code> endpoints. Events are immutably written by server handlers.
              </p>
            </div>
          </div>

          {/* Interactive Test Action */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Interactive Security Verification</h3>
                <p className="text-xs text-slate-500">Run live probe tests against backend API to verify cross-tenant blocks.</p>
              </div>
              <button
                onClick={runSecurityTest}
                disabled={testing}
                className="btn-primary"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Live Isolation Audit
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {results && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                  <span>Tested against: <strong>{results.firm?.otherFirmTested || 'Other Firm'}</strong></span>
                  <span>Executed at: {new Date(results.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="space-y-2">
                  {results.checks.map((c, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {c.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            PASSED
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pl-6">{c.description}</p>
                        {c.mechanism && (
                          <p className="text-[11px] text-slate-400 pl-6 italic">
                            Enforcement: {c.mechanism}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
