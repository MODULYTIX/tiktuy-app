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

    const currentPath = window.location.pathname;

    // Rol principal
    const role = user.rol?.nombre; // viene del backend como string
    if (isRole(role)) {
      const targetPath = roleDefaultPaths[role]; // role ahora es Role
      if (currentPath !== targetPath) {
        navigate(targetPath, { replace: true });
      }
      return;
    }

    // Trabajador con módulo asignado
    const moduloAsignado = user.perfil_trabajador?.modulo_asignado;
    if (isModuloAsignado(moduloAsignado) && currentPath !== `/${moduloAsignado}`) {
      navigate(`/${moduloAsignado}`, { replace: true });
    }
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
