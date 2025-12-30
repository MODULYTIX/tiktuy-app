import BackgroundImage from '@/assets/images/login-background.webp';
import RecoverPasswordForm from '../components/RecoverPasswordForm';

export default function RecoverPasswordPage() {
  return (
    <div
      className="min-h-screen min-w-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex items-center justify-center h-screen">
        <RecoverPasswordForm />
      </div>
    </div>
  );
}
