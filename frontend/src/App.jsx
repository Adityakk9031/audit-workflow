import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientDetailPage from './pages/ClientDetailPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import { Loader2, FileCheck2, AlertOctagon, RotateCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AuditFlow UI Error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Error</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected UI issue occurred. You can clear session data and reload.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-700 font-mono break-all text-left">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="btn-primary w-full py-2.5 text-xs"
            >
              <RotateCw className="w-4 h-4 mr-1.5" />
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoading({ message = 'Loading AuditFlow...' }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm">
          <FileCheck2 className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <PageLoading message="Verifying audit credentials..." />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <PageLoading message="Preparing login portal..." />;
  }
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
