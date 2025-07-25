import { useAuth } from '@/auth/context/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '@/auth/services/auth.api';

type PrivateRouteProps = {
  children: ReactNode;
  allowedRoles?: Role[];
};

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirige según rol si intenta entrar donde no debe
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}
