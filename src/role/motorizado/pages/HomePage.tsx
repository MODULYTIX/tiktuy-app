import { useAuth } from '@/auth/context/useAuth';

export default function MotorizadoHomePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-black">Bienvenido Motorizado</h1>
      <p className="text-gray-700">Sesión iniciada como: {user?.email}</p>

      <div className="mt-6">
        <p className="text-lg text-black">Aquí irá el panel de Motorizado.</p>
      </div>
    </div>
  );
}
