// src/pages/CrearPasswordSedePage.tsx
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { aceptarInvitacionSede } from '@/services/ecommerce/almacenamiento/almacenamiento.api';

export default function CrearPasswordSedePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const nav = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const minLen = 6;
  const canSubmit = useMemo(
    () => password.length >= minLen && password === confirm,
    [password, confirm]
  );

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr('Enlace inválido o token ausente.');
      return;
    }
    if (!canSubmit) {
      setErr('La contraseña no cumple los requisitos o no coincide.');
      return;
    }

    try {
      setLoading(true);
      const res = await aceptarInvitacionSede({
        token,
        password,
        passwordConfirm: confirm,
      });

      setMsg(res.message || '¡Contraseña creada correctamente!');
      // Redirige al login o dashboard
      setTimeout(() => nav('/', { replace: true }), 1500);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo completar el proceso.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-red-600">Enlace inválido o falta el token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/bg-courier.jpg')] bg-cover bg-center">
      <div className="min-h-screen backdrop-brightness-50 grid place-items-center px-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8"
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo-tiktuy.svg"
              alt="Tiktuy"
              className="h-8"
              onError={(e) => ((e.currentTarget.style.display = 'none'))}
            />
          </div>

          <h1 className="text-center text-xl md:text-2xl font-extrabold text-[#1A237E]">
            CREAR CONTRASEÑA — REPRESENTANTE DE SEDE
          </h1>

          <p className="mt-2 text-center text-sm text-gray-600">
            Establece tu contraseña para gestionar tu sede en Tiktuy.
          </p>

          {err && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {err}
            </div>
          )}
          {msg && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {msg}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Escribe aquí"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Requisitos</p>
              <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
                <li>Mínimo {minLen} caracteres</li>
                <li>Las contraseñas deben coincidir</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Repetir contraseña</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Escribe aquí"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="mt-6 w-full rounded-lg bg-[#1A237E] text-white py-2.5 text-sm font-semibold hover:bg-[#10195b] disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'REGISTRAR CONTRASEÑA'}
          </button>
        </form>
      </div>
    </div>
  );
}
