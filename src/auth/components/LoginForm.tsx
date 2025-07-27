import { useState } from 'react';
import { useLogin } from '@/auth/hooks/useLogin';
import Logo from '@/assets/logos/logo-tiktuy.webp';

export default function LoginForm() {
  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
      {/* Encabezado con logo y fondo curvo */}
      <div className="space-x-2 bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] p-12 flex justify-center items-center text-white rounded-b-full">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="Tiktuy logo" className="h-14" />
          <span className="block w-[2px] h-16 bg-white"></span>
        </div>
        <div className="flex flex-col">
          <p className="text-6xl font-bold">TIKTUY</p>
          <p className="text-sm font-bold -mt-1 ">¡LO ENTREGO POR TI!</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="p-8">
        <h2 className="text-center text-xl font-bold tracking-widest text-[#1b1b77] mb-6">
          ─ INICIAR SESIÓN ─
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1b1b77] text-black"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1b1b77] text-black"
            required
          />

          <div className="flex items-center justify-between text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Recuérdame
            </label>
            <a href="#" className="text-[#1b1b77] hover:underline">
              ¿Problemas para iniciar sesión?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-4 bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] text-white py-2 rounded shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Entrando...' : 'INGRESAR'}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </div>
      </div>
    </form>
  );
}
