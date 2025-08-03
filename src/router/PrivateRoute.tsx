import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import type { JSX } from 'react';
import type { Role } from '@/auth/constants/roles';

type Props = {
  children: JSX.Element;
  allowedRoles?: Role[];
  allowModulo?: boolean;
};

export default function PrivateRoute({ children, allowedRoles, allowModulo }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-4">Cargando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = user.rol?.nombre;

  // Validar acceso por rol si se especifica
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Validar acceso por módulo asignado si se especifica
  if (allowModulo) {
    if (user.trabajador?.modulo_asignado) {
      return children;
    }
    return <div className="p-4">Cargando módulo asignado...</div>;
  }

  // Si no se especifica ninguna restricción, permitir acceso
  return children;
}
