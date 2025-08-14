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

export default function PrivateRoute({
  children,
  allowedRoles,
  allowModulo,
}: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBouncing />;

  // 👇 Rutas públicas que SÍ pueden renderizarse aunque no haya sesión
  const PUBLIC_WITHIN_PRIVATE = ['/registro-invitacion', '/crear-password'];
  if (PUBLIC_WITHIN_PRIVATE.some(p => location.pathname.startsWith(p))) {
    return children;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = user.rol?.nombre;

  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole as Role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Validación por módulo solo para trabajadores
  if (allowModulo) {
    if (userRole !== 'trabajador') return <Navigate to="/unauthorized" replace />;

    const moduloAsignado = user.perfil_trabajador?.modulo_asignado;

    if (!moduloAsignado) return <LoadingBouncing />;

    const currentPath = location.pathname.split('/')[1];

    // Aquí usamos directamente las claves internas
    const tieneAcceso = moduloAsignado.includes(currentPath);

    if (!tieneAcceso) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
