// src/auth/hooks/useLogin.ts
import { useState } from 'react';
import { loginRequest } from '@/auth/services/auth.api';
import { useAuth } from '@/auth/context/AuthProvider';

type LoginCredentials = {
  email: string;
  password: string;
};

export function useLogin() {
  const { login: setUserInContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const user = await loginRequest(credentials); // llama a auth.api.ts
      setUserInContext(user); // guarda el user en el contexto
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
}
