// src/auth/context/AuthProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { fetchMe } from '@/auth/services/auth.api';
import type { User } from '@/auth/services/auth.api';

import type { ReactNode } from'react';

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 🔄 para no renderizar antes de verificar

  // Al iniciar, intenta restaurar sesión
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
        localStorage.removeItem('token'); // sesión inválida
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  // Espera a validar la sesión antes de renderizar la app
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
};
