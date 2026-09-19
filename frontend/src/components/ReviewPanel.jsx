import { useState, useRef } from 'react';
import {
  UploadCloud, CheckCircle2, AlertOctagon, Loader2,
  FileCheck, ShieldAlert, Sparkles, MessageSquare, ArrowUpRight
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { CORRECTION_PRESETS } from '../constants';

export default function ReviewPanel({ document: doc, onUpdate }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef();

  const isStaff    = user?.role === 'staff';
  const isAdmin    = user?.role === 'admin';
  const isReviewer = user?.role === 'reviewer' || isAdmin;
  const canUpload  = isStaff || isAdmin;

  async function handleAction(action) {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post(`/documents/${doc.id}/review/${action}`, {
        comment: comment.trim() || undefined,
      });
      setSuccess(
        action === 'approve'
          ? 'Document verified and approved for audit file.'
          : 'Correction request submitted. Staff notified.'
      );
      setComment('');
      onUpdate(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Review action failed. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartReview() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post(`/documents/${doc.id}/review/start`);
      setSuccess('Audit review in progress.');
      onUpdate(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start review.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/documents/${doc.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(
        doc.status === 'correction_required'
          ? 'Revised document uploaded successfully. Status moved to Uploaded.'
          : 'Document uploaded successfully.'
      );
      onUpdate(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Document upload failed.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.doc,.docx"
      />

      {/* ── Status Feedback Alert ────────────────────────────────────────── */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{success}</div>
        </div>
      )}

      {/* ── STAFF / ADMIN ACTIONS: UPLOAD & RE-UPLOAD ─────────────────────── */}
      {canUpload && (doc.status === 'pending' || doc.status === 'correction_required') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>{doc.status === 'correction_required' ? 'Upload Revised Document' : 'Document Submission'}</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-400">PDF, XLSX, DOCX, PNG, JPG (Max 20MB)</span>
          </div>

          {doc.status === 'correction_required' && (
            <div className="p-3 bg-rose-50 border border-rose-200/90 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Correction Action Required</span>
              </div>
              <p className="text-rose-700">
                The reviewer identified issues with the submitted file. Please review the remark above and submit a corrected version.
              </p>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full btn-primary py-2.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>
              {doc.status === 'correction_required' ? 'Upload Corrected Version (v2)' : 'Select & Upload Document'}
            </span>
          </button>
        </div>
      )}

      {/* ── REVIEWER / ADMIN ACTIONS ──────────────────────────────────────── */}
      {isReviewer && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>Audit Review & Verification</span>
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Role: {user?.role}
            </span>
          </div>

          {/* State 1: Uploaded -> Can Start Review */}
          {doc.status === 'uploaded' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Document has been submitted by staff. Click below to begin audit scrutiny.
              </p>
              <button
                onClick={handleStartReview}
                disabled={loading}
                className="w-full btn-secondary py-2.5 text-slate-900 font-semibold hover:bg-slate-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 text-amber-600" />}
                <span>Begin Audit Review</span>
              </button>
            </div>
          )}

          {/* State 2: Under Review -> Approve or Request Correction */}
          {doc.status === 'under_review' && (
            <div className="space-y-3">
              <div>
                <label className="label">
                  Audit Review Remarks <span className="text-slate-400 font-normal">(Required for Correction)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="e.g. Page 3 is missing. Please upload the complete bank statement."
                  className="input resize-none text-xs"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Quick CA Review Remarks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CORRECTION_PRESETS.slice(0, 4).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setComment(preset)}
                      className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left truncate max-w-full cursor-pointer"
                    >
                      "{preset.slice(0, 38)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="btn-success py-2.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Approve Document</span>
                </button>

                <button
                  onClick={() => handleAction('correct')}
                  disabled={loading || !comment.trim()}
                  className="btn-danger py-2.5"
                  title={!comment.trim() ? 'Enter a review comment first' : ''}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
                  <span>Request Correction</span>
                </button>
              </div>

              {!comment.trim() && (
                <p className="text-[11px] text-slate-400 italic text-center">
                  Enter or select a comment above to enable "Request Correction".
                </p>
              )}
            </div>
          )}

          {/* State 3: Pending */}
          {doc.status === 'pending' && (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              ⏳ Awaiting document upload before review can commence.
            </p>
          )}

          {/* State 4: Correction Required */}
          {doc.status === 'correction_required' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900">
              <span className="font-semibold block mb-0.5">Awaiting Revised Upload:</span>
              Correction has been dispatched to staff. Once re-uploaded, you can scrutinize the revised copy.
            </div>
          )}

          {/* State 5: Approved */}
          {doc.status === 'approved' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>This document has been verified and closed for the audit file.</span>
            </div>
          )}
        </div>
      )}

      {/* ── STAFF INFORMATIVE CARDS FOR NON-ACTIONABLE STATES ─────────────── */}
      {isStaff && !isAdmin && (
        <>
          {doc.status === 'uploaded' && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>Document is in the reviewer's queue. You will be notified if corrections are required.</span>
            </div>
          )}

          {doc.status === 'under_review' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
              <span>The audit reviewer is currently inspecting this document.</span>
            </div>
          )}

          {doc.status === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>This document has been signed off and approved. No further action needed.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
