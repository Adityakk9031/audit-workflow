import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [firm, setFirm]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    // Safety timeout: Never keep loading permanently true
    const timer = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 4000);

    api.get('/auth/me')
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data);
        setFirm(data.firm);
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn('Session verification failed, clearing token');
        localStorage.removeItem('token');
        setUser(null);
        setFirm(null);
      })
      .finally(() => {
        clearTimeout(timer);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);

    // Immediately fetch full profile with firm data
    try {
      const { data: me } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      setUser(me);
      setFirm(me.firm);
      return me;
    } catch {
      setUser(data.user);
      return data.user;
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setFirm(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, firm, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
