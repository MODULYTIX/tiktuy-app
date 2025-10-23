// src/router/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import type { JSX } from 'react';
import type { Role } from '@/auth/constants/roles';
import LoadingBouncing from '@/shared/animations/LoadingBouncing';

type Props = {
  children: JSX.Element;
  allowedRoles?: Role[];
  allowModulo?: boolean;
};

// Mapeo: si el backend devuelve "representante", lo tratamos como "ecommerce"
function normalizeRole(name?: string): Role | undefined {
  if (!name) return undefined;
  if (name === 'representante') return 'ecommerce';
  const known: Role[] = ['admin', 'ecommerce', 'courier', 'motorizado', 'trabajador'];
  return known.includes(name as Role) ? (name as Role) : undefined;
}

export default function PrivateRoute({ children, allowedRoles, allowModulo }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBouncing />;

  // Rutas públicas que deben poder renderizarse aunque haya PrivateRoute envolviendo
  const PUBLIC_WITHIN_PRIVATE = [
    '/registro-invitacion',
    '/crear-password',
    '/crear-password-motorizado',
    '/invitar-sede',
  ];
  if ( PUBLIC_WITHIN_PRIVATE.some(p => location.pathname.startsWith(p)) ) {
    return children;
  }

  // Si no hay sesión, a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = normalizeRole(user.rol?.nombre);

  // Validación por roles permitidos
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Validación por módulo solo para trabajadores
  if (allowModulo) {
    if (userRole !== 'trabajador') return <Navigate to="/unauthorized" replace />;

    const moduloAsignado = user.perfil_trabajador?.modulo_asignado;
    if (!moduloAsignado) return <LoadingBouncing />;

    const currentPath = location.pathname.split('/')[1];
    const tieneAcceso = moduloAsignado.includes(currentPath);
    if (!tieneAcceso) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
