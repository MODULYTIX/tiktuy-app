import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '@/assets/logos/logo-tiktuy.webp';
import { confirmRecoverPasswordRequest } from '../services/auth.api';

export default function ChangePassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Token inválido o ausente');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmRecoverPasswordRequest({
        token,
        password,
        confirmPassword: confirm,
      });

      setSuccess(true);

      // Redirigir al login luego de 2 segundos
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen min-w-screen bg-cover bg-center"
      style={{ backgroundImage: `url(/images/login-background.webp)` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative flex items-center justify-center h-screen">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md"
        >
          {/* Header */}
          <div className="space-x-2 bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] p-12 flex justify-center items-center text-white rounded-b-full">
            <div className="flex items-center gap-2">
              <img src={Logo} alt="Tiktuy logo" className="h-14" />
              <span className="block w-[2px] h-16 bg-white"></span>
            </div>
            <div className="flex flex-col">
              <p className="text-6xl font-bold">TIKTUY</p>
              <p className="text-sm font-bold -mt-1">¡LO ENTREGO POR TI!</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            <h2 className="text-center text-xl font-bold tracking-widest text-[#1b1b77] mb-6">
              ─ CREAR NUEVA CONTRASEÑA ─
            </h2>

            {success ? (
              <p className="text-center text-sm text-green-600">
                Contraseña actualizada correctamente. Redirigiendo…
              </p>
            ) : (
              <>
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 mb-4 focus:ring-2 focus:ring-[#1b1b77]"
                  disabled={loading}
                  required
                />

                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#1b1b77]"
                  disabled={loading}
                  required
                />

                {error && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] text-white py-2 rounded shadow-md hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? 'Guardando...' : 'GUARDAR CONTRASEÑA'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
