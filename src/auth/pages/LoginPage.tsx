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

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const currentPath = window.location.pathname;

    // Redirección para roles principales
    const role = user.rol?.nombre;
    if (role && validRoles.includes(role)) {
      const targetPath = roleDefaultPaths[role as Role];
      if (currentPath !== targetPath) {
        navigate(targetPath, { replace: true });
      }
      return;
    }

    // Redirección para trabajadores con módulo asignado
    const moduloAsignado = user.trabajador?.perfil?.modulo_asignado;
    if (
      moduloAsignado &&
      moduloAsignadoValues.includes(moduloAsignado as ModuloAsignado) &&
      currentPath !== `/${moduloAsignado}`
    ) {
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
