// src/auth/pages/LoginPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundImage from '@/assets/images/login-background.webp';
import LoginForm from '@/auth/components/LoginForm';
import { useAuth } from '@/auth/context/useAuth';
import {
  validRoles,
  roleDefaultPaths,
  type Role,
  moduloAsignadoValues,
} from '@/auth/constants/roles';

// Type guard de rol
const isRole = (r: unknown): r is Role =>
  typeof r === 'string' && (validRoles as readonly string[]).includes(r as Role);

// Helper: toma el primer módulo válido desde una cadena con comas o un string simple
function getPrimerModuloValido(moduloAsignado?: unknown): string | null {
  if (typeof moduloAsignado !== 'string' || moduloAsignado.trim() === '') return null;

  // Puede venir "stock, movimiento, pedidos" → tomamos el primero válido
  const partes = moduloAsignado
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const p of partes) {
    if ((moduloAsignadoValues as readonly string[]).includes(p as any)) {
      return p;
    }
  }
  return null;
}

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const currentPath =
      (typeof window !== 'undefined' ? window.location.pathname : '/')?.replace(/\/+$/, '') || '/';

    // Normaliza el nombre del rol a minúsculas
    const roleName: unknown =
      typeof user?.rol?.nombre === 'string' ? user.rol.nombre.toLowerCase() : undefined;

    // 1) Priorizar módulo si es TRABAJADOR (usa el primer módulo válido)
    if (isRole(roleName) && roleName === 'trabajador') {
      const primerModulo = getPrimerModuloValido(user?.perfil_trabajador?.modulo_asignado);
      if (primerModulo) {
        const target = (`/${primerModulo}`).replace(/\/+$/, '') || '/';
        if (currentPath !== target) navigate(target, { replace: true });
        return;
      }
      // si no tiene módulo válido, caerá al mapeo por rol (abajo) o se quedará en login si no hay ruta
    }

    // 2) Rol principal
    if (isRole(roleName)) {
      // roleDefaultPaths ya contempla:
      // - admin → /admin
      // - ecommerce → /ecommerce
      // - courier → /courier
      // - motorizado → /motorizado
      // - trabajador → /trabajador (si no tiene módulo)
      // - representante → '/'
      // - representante_ecommerce → '/ecommerce'
      // - representante_courier → '/courier'
      const targetPath = roleDefaultPaths[roleName];
      const normTarget = targetPath.replace(/\/+$/, '') || '/';
      if (currentPath !== normTarget) {
        navigate(normTarget, { replace: true });
      }
      return;
    }

    // 3) Sin rol válido: permanece en login
  }, [user, navigate]);

  return (
    <div
      className="min-h-screen min-w-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex items-center justify-center h-screen">
        <LoginForm />
      </div>
    </div>
  );
}
