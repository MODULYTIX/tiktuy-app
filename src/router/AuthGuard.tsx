import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import { roleDefaultPaths, validRoles } from '@/auth/constants/roles';
import type { JSX } from 'react';
import type { Role } from '@/auth/constants/roles';
import { useEffect, useState } from 'react';

// Mapeo de módulos asignados a rutas reales
const moduloRutaMap: Record<string, string> = {
  stock: 'ecommerce/stock',
  producto: 'ecommerce/stock',
  movimiento: 'ecommerce/movimientos',
  pedidos: 'ecommerce/pedidos',
  zonas: 'courier/zonas',
  entregas: 'motorizado/entregas',
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

      if (role && validRoles.includes(role)) {
        navigate(roleDefaultPaths[role as Role], { replace: true });
        setRedirected(true);
        return;
      }

      const moduloAsignado = user.trabajador?.modulo_asignado;
      if (moduloAsignado) {
        const rutaModulo = moduloRutaMap[moduloAsignado];
        if (rutaModulo) {
          navigate(`/${rutaModulo}`, { replace: true });
          setRedirected(true);
          return;
        }
      }
    }
  }, [user, redirected, navigate]);

  if (loading) return <div className="p-4">Cargando sesión...</div>;

  if (redirected) return null;

  return children;
}
