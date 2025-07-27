import {
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { fetchMe } from '@/auth/services/auth.api';
import { AuthContext } from './AuthContext';
import type { User } from '@/auth/types/auth.types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe(token)
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // login ahora acepta token + user opcional
  const login = async (token: string, user?: User) => {
    localStorage.setItem('token', token);

    if (user) {
      setUser(user);
      return;
    }

    try {
      const userData = await fetchMe(token);
      setUser(userData);
    } catch (error) {
      logout();
      throw new Error((error as Error).message || 'Token inválido');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div>Cargando sesión...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};