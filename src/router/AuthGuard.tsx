import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import { roleDefaultPaths } from '@/auth/constants/roles';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import LoadingBouncing from '@/shared/animations/LoadingBouncing';

// Mapeo de módulos asignados a rutas reales (para trabajador)
const moduloRutaMap: Record<string, string> = {
  stock: '/stock',
  producto: '/producto',
  movimiento: '/movimiento',
  pedidos: '/pedidos',
  zonas: '/courier/zonas',
  entregas: '/motorizado/entregas',
};

type Props = {
  children: JSX.Element;
};

export default function AuthGuard({ children }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (loading || !user || redirected) return;

    const role = user.rol?.nombre;

    // ✅ Roles con home por defecto
    if (
      role === 'admin' ||
      role === 'ecommerce' ||
      role === 'courier' ||
      role === 'motorizado' ||
      role === 'representante' // 👈 NUEVO: se trata como ecommerce
    ) {
      const target =
        role === 'representante'
          ? roleDefaultPaths['ecommerce'] // alias
          : roleDefaultPaths[role];

      if (target) {
        navigate(target, { replace: true });
        setRedirected(true);
        return;
      }
    }

    // ✅ Redirección por módulo (trabajador)
    if (role === 'trabajador') {
      const modulos = user.perfil_trabajador?.modulo_asignado?.split(',') || [];
      const primerModulo = modulos[0]?.trim();
      const rutaModulo = moduloRutaMap[primerModulo || ''];

      if (rutaModulo) {
        navigate(rutaModulo, { replace: true });
        setRedirected(true);
        return;
      } else {
        // si no hay módulo, manda a unauthorized (o a un onboarding si tienes)
        navigate('/unauthorized', { replace: true });
        setRedirected(true);
        return;
      }
    }

    // Rol desconocido: bloquea
    navigate('/unauthorized', { replace: true });
    setRedirected(true);
  }, [user, loading, redirected, navigate]);

  if (loading) return <div className=""><LoadingBouncing /></div>;
  if (redirected) return null;

  return children;
}
