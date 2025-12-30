import { useState } from 'react';
import Logo from '@/assets/logos/logo-tiktuy.webp';
import { recoverPasswordRequest } from '../services/auth.api';
import { Link } from 'react-router';

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError(null);

    try {
      await recoverPasswordRequest({ email });
      setSent(true); // respuesta neutra
    } catch (err: any) {
      // En recuperación no mostramos errores sensibles
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          ─ RECUPERAR CONTRASEÑA ─
        </h2>

        {sent ? (
          <p className="text-center text-sm text-gray-700">
            Si el correo existe, te enviaremos un enlace para recuperar tu contraseña.
          </p>
        ) : (
          <>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#1b1b77]"
              required
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] text-white py-2 rounded shadow-md hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'ENVIAR ENLACE'}
            </button>
          </>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-[#1b1b77] hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </form>
  );
}
