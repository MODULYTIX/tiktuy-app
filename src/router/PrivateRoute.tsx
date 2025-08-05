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
    return <div className="flex justify-center items-center align-middle">Cargando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = user.rol?.nombre;

  // Validar acceso por rol si se especifica
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole as Role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Validar acceso por módulo si se especifica (para trabajadores)
  if (allowModulo) {
    if (userRole !== 'trabajador') {
      return <Navigate to="/unauthorized" replace />;
    }

    const moduloAsignado = user.perfil_trabajador?.modulo_asignado;

    if (!moduloAsignado) {
      console.log('❌ Módulo asignado no disponible:', user);
      return <div className="p-4">Cargando módulos asignados...</div>;
    }

    const currentPath = location.pathname.split('/')[1]; // ej: 'stock', 'movimiento'

    const moduloPaths: Record<string, string[]> = {
      stock: ['Stock de productos'],
      movimiento: ['Movimientos'],
      pedidos: ['Gestion de pedidos'],
      producto: ['Producto'],
      // Agrega más si es necesario
    };

    const modulosPermitidos = moduloPaths[currentPath] || [];

    const tieneAcceso = modulosPermitidos.some((m) =>
      moduloAsignado.includes(m)
    );

    if (!tieneAcceso) {
      console.warn(`🔒 Acceso denegado al módulo: ${currentPath}`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
