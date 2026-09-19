import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ACCOUNTS } from '../constants';
import {
  FileCheck2, Loader2, ShieldCheck, Building2,
  Lock, ArrowRight, CheckCircle2, User
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setLoading(true);
    try {
      await login(acc.email, acc.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  }

  const firmAGroup = DEMO_ACCOUNTS.filter((a) => a.firm.includes('Firm A'));
  const firmBGroup = DEMO_ACCOUNTS.filter((a) => a.firm.includes('Firm B'));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AuditFlow</h1>
        <p className="text-xs text-slate-500">
          Statutory Audit & Document Review Platform for Chartered Accountants
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl space-y-6 px-4">
        {/* Sign In Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Sign In</h2>
            <span className="text-[11px] text-slate-400">Default password: <code className="text-indigo-600 font-mono font-semibold">password</code></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="e.g. reviewer@abc.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Sign In to Audit Engagement</span>
            </button>
          </form>
        </div>

        {/* 1-Click Evaluation Persona Switcher */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1-Click Evaluation Personas
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any role to test multi-firm isolation and role permissions instantly.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Multi-Tenant</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            {/* Firm A */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Firm A: ABC & Co.</span>
              </div>
              <div className="space-y-1.5">
                {firmAGroup.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-700">
                        {acc.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${acc.badge}`}>
                        {acc.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Firm B */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Firm B: XYZ & Co.</span>
              </div>
              <div className="space-y-1.5">
                {firmBGroup.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-700">
                        {acc.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${acc.badge}`}>
                        {acc.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
