import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ACCOUNTS } from '../constants';
import SecurityModal from './SecurityModal';
import {
  FileCheck2, Building2, ChevronDown, ShieldCheck, LogOut,
  User, Check, Sparkles, ArrowRightLeft
} from 'lucide-react';

export default function Navbar() {
  const { user, firm, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switching, setSwitching] = useState(false);

  async function handleQuickSwitch(account) {
    if (account.email === user?.email) {
      setShowRoleMenu(false);
      return;
    }
    setSwitching(true);
    try {
      await login(account.email, account.password);
      setShowRoleMenu(false);
      navigate('/');
    } catch (err) {
      console.error('Quick switch failed', err);
    } finally {
      setSwitching(false);
    }
  }

  const roleBadges = {
    admin:    'bg-purple-50 text-purple-700 border-purple-200',
    reviewer: 'bg-amber-50 text-amber-800 border-amber-200',
    staff:    'bg-sky-50 text-sky-800 border-sky-200',
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Firm Context */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none block">
                  AuditFlow
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  By OBLIQ-in
                </span>
              </div>
            </Link>

            <span className="text-slate-300 hidden sm:inline">/</span>

            {/* Current Firm Tag */}
            {firm && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 text-xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="font-semibold">{firm.name}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                  [{firm.id.slice(0, 8)}]
                </span>
              </div>
            )}
          </div>

          {/* Center / Actions: Quick Role Switcher + Security Audit */}
          <div className="flex items-center gap-2.5">
            {/* Live Security Inspector Button */}
            <button
              onClick={() => setShowSecurityModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
              title="Inspect multi-tenant isolation and security proofs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Tenant Isolation & Security</span>
              <span className="sm:hidden">Security</span>
            </button>

            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                disabled={switching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Instant Demo Persona Switcher
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1 space-y-1">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user?.email === acc.email;
                      return (
                        <button
                          key={acc.email}
                          onClick={() => handleQuickSwitch(acc)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-100 font-semibold text-slate-900'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 truncate">{acc.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${acc.badge}`}>
                                {acc.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {acc.firm} · <span className="font-mono">{acc.email}</span>
                            </p>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Badge & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
                </div>
                <span className={`badge capitalize ${roleBadges[user.role] || ''}`}>
                  {user.role}
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Security Diagnostics Modal */}
      <SecurityModal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} />
    </>
  );
}
