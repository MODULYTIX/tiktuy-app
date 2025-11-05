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
  type ModuloAsignado,
} from '@/auth/constants/roles';

// Type guards
const isRole = (r: unknown): r is Role =>
  typeof r === 'string' && (validRoles as readonly string[]).includes(r);

const isModuloAsignado = (m: unknown): m is ModuloAsignado =>
  typeof m === 'string' && (moduloAsignadoValues as readonly string[]).includes(m);

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const currentPath =
      (typeof window !== 'undefined' ? window.location.pathname : '/')?.replace(/\/+$/, '') || '/';

    const role = user.rol?.nombre as unknown;

    // 1) Priorizar módulo si es TRABAJADOR
    if (isRole(role) && role === 'trabajador') {
      const moduloAsignado: unknown = user.perfil_trabajador?.modulo_asignado;
      if (isModuloAsignado(moduloAsignado)) {
        const target = `/${moduloAsignado}`.replace(/\/+$/, '') || '/';
        if (currentPath !== target) navigate(target, { replace: true });
        return;
      }
      // Si no tiene módulo, caerá al mapeo de rol más abajo
    }

    // 2) Rol principal (incluye representante con resolución por contexto)
    if (isRole(role)) {
      let targetPath = roleDefaultPaths[role];

      if (role === 'representante') {
        const pt = user.perfil_trabajador;
        if (user.courier || pt?.courier_id) {
          targetPath = '/courier';
        } else if (user.ecommerce || pt?.ecommerce_id || (user as any)?.ecommerce_id) {
          targetPath = '/ecommerce';
        }
      }

      const normTarget = targetPath.replace(/\/+$/, '') || '/';
      if (currentPath !== normTarget) {
        navigate(normTarget, { replace: true });
      }
      return;
    }

    // 3) Sin rol válido: no redirige (se queda en login)
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
