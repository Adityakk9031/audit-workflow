import { useState } from 'react';
import { ACTION_CONFIG } from '../constants';
import { Download, ShieldCheck, Clock, UserCheck, MessageSquareQuote } from 'lucide-react';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function TimelineItem({ log, isLast }) {
  const config = ACTION_CONFIG[log.action] || {
    label: log.action,
    icon: '📄',
    colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  const roleStyles = {
    admin:    'bg-purple-50 text-purple-700 border-purple-200',
    reviewer: 'bg-amber-50 text-amber-800 border-amber-200',
    staff:    'bg-sky-50 text-sky-800 border-sky-200',
  };

  const isCorrection = log.action === 'correction_requested';
  const isApproval = log.action === 'approved';

  return (
    <div className="relative flex gap-3.5 group">
      {/* Vertical Spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm shadow-2xs z-10 ${config.colorClass}`}
        >
          {config.icon}
        </div>
        {!isLast && <div className="w-0.5 bg-slate-200 flex-1 my-1" />}
      </div>

      {/* Event Details Card */}
      <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
        <div className="bg-slate-50/70 group-hover:bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 transition-colors">
          {/* Top Row: Event Title & Timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">{config.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border capitalize ${roleStyles[log.performed_by_role] || 'bg-slate-100 text-slate-700'}`}>
                {log.performed_by_role}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatDateTime(log.created_at)}</span>
              <span className="text-slate-400">({getRelativeTime(log.created_at)})</span>
            </div>
          </div>

          {/* Actor Info */}
          <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-2">
            <span className="font-medium text-slate-900">{log.performed_by_name}</span>
            {log.performed_by_email && (
              <span className="text-slate-400 text-[11px] hidden sm:inline">({log.performed_by_email})</span>
            )}
          </div>

          {/* Comment / Remarks Box */}
          {log.comment && (
            <div
              className={`mt-2 rounded-lg p-3 text-xs leading-relaxed border ${
                isCorrection
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : isApproval
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider mb-1 opacity-75">
                <MessageSquareQuote className="w-3.5 h-3.5" />
                <span>{isCorrection ? 'Correction Reason / Defect Note' : 'Audit Remark'}</span>
              </div>
              <p className="whitespace-pre-wrap">{log.comment}</p>
            </div>
          )}

          {/* Event ID Chip (Proof of Ledger) */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Immutable Audit Record
            </span>
            <span title={`Full ID: ${log.id}`}>#EVT-{log.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditTimeline({ logs = [], documentName = '' }) {
  const [filter, setFilter] = useState('all');

  function exportLogsAsJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `audit_trail_${documentName || 'report'}_${Date.now()}.json`);
    dlAnchor.click();
  }

  const filtered = logs.filter((log) => {
    if (filter === 'corrections') return log.action === 'correction_requested';
    if (filter === 'reviews') return ['review_started', 'approved', 'correction_requested'].includes(log.action);
    if (filter === 'uploads') return ['document_uploaded', 'document_reuploaded'].includes(log.action);
    return true;
  });

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200/80 rounded-xl">
        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="text-xs font-medium text-slate-600">No audit trail records generated yet.</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Every upload, review, and status shift is recorded immutably.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls: Filter chips + Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: `All (${logs.length})` },
            { id: 'reviews', label: 'Reviews' },
            { id: 'corrections', label: 'Corrections' },
            { id: 'uploads', label: 'Uploads' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                filter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={exportLogsAsJson}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-slate-200"
          title="Export audit log data as JSON"
        >
          <Download className="w-3 h-3 text-slate-500" />
          <span>Export Trail</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-0.5">
        {filtered.map((log, i) => (
          <TimelineItem key={log.id} log={log} isLast={i === filtered.length - 1} />
        ))}
      </div>
    </div>
  );
}
