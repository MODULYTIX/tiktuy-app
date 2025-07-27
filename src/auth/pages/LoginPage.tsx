import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundImage from '@/assets/images/login-background.webp';
import LoginForm from '@/auth/components/LoginForm';
import { useAuth } from '@/auth/context/useAuth';
import { validRoles, roleDefaultPaths } from '@/auth/constants/roles';

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || typeof user.role !== 'string') return;

    const role = user.role;
    const targetPath = roleDefaultPaths[role];
    const currentPath = window.location.pathname;

    if (validRoles.includes(role) && currentPath !== targetPath) {
      navigate(targetPath, { replace: true });
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
