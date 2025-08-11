import { useState, useEffect, type ReactNode } from 'react';
import { fetchMe } from '@/auth/services/auth.api';
import { AuthContext } from './AuthContext';
import type { User } from '@/auth/types/auth.types';
import LoadingBouncing from '@/shared/animations/LoadingBouncing';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetchMe(storedToken)
      .then((userData) => {
        setUser(userData);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);

    try {
      const userData = await fetchMe(newToken);
      setUser(userData);
    } catch (error) {
      logout();
      throw new Error((error as Error).message || 'Token inválido');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  if (loading)
    return (
      <div>
        <LoadingBouncing />
      </div>
    );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
