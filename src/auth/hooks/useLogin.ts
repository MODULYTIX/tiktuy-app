import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '@/auth/services/auth.api';
import { useAuth } from '@/auth/context/useAuth';
import type { LoginCredentials } from '@/auth/types/auth.types';
import { roleDefaultPaths } from '@/auth/constants/roles';

export function useLogin() {
  const { login: loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginRequest(credentials);
      await loginWithToken(response.token, response.user);

      const rolNombre = response.user.rol?.nombre;

      // Redirige según el rol
      setTimeout(() => {
        if (
          rolNombre === 'admin' ||
          rolNombre === 'ecommerce' ||
          rolNombre === 'courier' ||
          rolNombre === 'motorizado'
        ) {
          navigate(roleDefaultPaths[rolNombre], { replace: true });
        } else if (rolNombre === 'trabajador') {
          const modulos = response.user.trabajador?.modulo_asignado?.split(',') || [];

          const moduloPaths: Record<string, string> = {
            'Stock de productos': '/stock',
            'Movimientos': '/movimiento',
            'Gestion de pedidos': '/pedidos',
            'Producto': '/producto', // si usas esta ruta
            // puedes agregar más según tus módulos
          };

          const primerModulo = modulos[0]?.trim();
          const path = moduloPaths[primerModulo] || '/unauthorized';
          navigate(path, { replace: true });
        } else {
          navigate('/unauthorized');
        }
      }, 0);
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
