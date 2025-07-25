import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/AuthProvider';

// images
import BackgroundImage from '@/assets/images/login-background.webp';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  return (
    <div
      className="min-h-screen min-w-screen bg-cover bg-center "
      style={{ backgroundImage: `url(${BackgroundImage})` }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative  flex items-center justify-center h-screen ">
        <LoginForm />
      </div>
    </div>
  );
}
