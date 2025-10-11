import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import { roleDefaultPaths } from '@/auth/constants/roles';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import LoadingBouncing from '@/shared/animations/LoadingBouncing';

// Mapeo de módulos asignados a rutas reales
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
    if (user && !redirected) {
      const role = user.rol?.nombre;

      if (
        role === 'admin' ||
        role === 'ecommerce' ||
        role === 'courier' ||
        role === 'motorizado'
      ) {
        navigate(roleDefaultPaths[role], { replace: true });
        setRedirected(true);
        return;
      }

      if (role === 'trabajador') {
        const modulos = user.perfil_trabajador?.modulo_asignado?.split(',') || [];
        const primerModulo = modulos[0]?.trim();

        const rutaModulo = moduloRutaMap[primerModulo || ''];
        if (rutaModulo) {
          navigate(rutaModulo, { replace: true });
          setRedirected(true);
          return;
        }
      }
    }
  }, [user, redirected, navigate]);

  if (loading) return <div className=""><LoadingBouncing /></div>;

  if (redirected) return null;

  return children;
}
