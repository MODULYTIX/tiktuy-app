import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import type { JSX } from 'react';

export const RoleGuard = ({ children, role }: { children: JSX.Element; role: string }) => {
  const { user } = useAuth();

  // Si user.rol.nombre no coincide con el role esperado → redirige
  if (!user || user.rol?.nombre !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
