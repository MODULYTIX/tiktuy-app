import { useState } from 'react';
import { loginRequest } from '@/auth/services/auth.api';
import { useAuth } from '@/auth/context/useAuth';
import type { LoginCredentials } from '@/auth/types/auth.types';

export function useLogin() {
  const { login: loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginRequest(credentials);
      await loginWithToken(response.token, response.user); 
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error en login:', err);
        setError(err.message || 'Error al iniciar sesión');
      } else {
        console.error('Error inesperado:', err);
        setError('Error desconocido al iniciar sesión');
      }
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