import PrivateLayout from '@/shared/layout/PrivateLayout';
import { useAuth } from '@/auth/context/AuthProvider';

export default function EcommerceHomePage() {
  const { user } = useAuth();

  return (
    <PrivateLayout>
      <h1 className="text-3xl font-bold mb-4 text-black">Bienvenido Ecommerce</h1>
      <p className="text-gray-700">Sesión iniciada como: {user?.email}</p>

      <div className="mt-6">
        <p className="text-lg text-black">Aquí irá el panel de Ecommerce.</p>
      </div>
    </PrivateLayout>
  );
}
