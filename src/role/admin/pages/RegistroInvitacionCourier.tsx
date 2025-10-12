// src/pages/RegistroInvitacionCourier.tsx
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackgroundImage from '@/assets/images/login-background.webp';

export default function RegistroInvitacionCourier() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const token = sp.get('token') || '';
  const name = sp.get('name') || 'Tu cuenta';

  // UI state
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => password.length >= 6 && password === confirm, [password, confirm]);

  const onSubmit = useCallback(async () => {
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('Enlace inválido o falta el token de invitación.');
      return;
    }
    if (!canSubmit) {
      setErrorMsg('Verifica tu contraseña (mín. 6 caracteres y deben coincidir).');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/admin/solicitudes/courier/confirmar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          contrasena: password,
          confirmar_contrasena: confirm,
        }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        /* respuesta vacía o no-JSON */
      }

      if (!res.ok || !json?.ok) {
        setErrorMsg(json?.error || json?.message || 'No se pudo crear la contraseña.');
        return;
      }

      // ✅ Éxito: redirigir directamente al login
      navigate('/login', { replace: true });
    } catch {
      setErrorMsg('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }, [token, password, confirm, canSubmit, navigate]);

  // Guard clause: si no hay token, mostrar mensaje de error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded shadow p-6">
          <p className="text-red-600">Enlace inválido o falta el token de invitación.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4
                 bg-center bg-cover bg-no-repeat relative"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 z-10">
        <h1 className="text-xl font-bold text-[#1A237E] text-center mb-1 uppercase">
          Crear contraseña
        </h1>
        <p className="text-center text-sm text-gray-600 mb-2">
          Activa tu cuenta para <span className="font-semibold text-blue-700">{name}</span>
        </p>
        <p className="text-center text-xs text-gray-400 mb-5">La contraseña debe tener al menos 6 caracteres.</p>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Contraseña</label>
            <div className="h-10 rounded-md border border-gray-300 flex overflow-hidden">
              <input
                type={showPwd ? 'text' : 'password'}
                className="flex-1 px-3 text-sm outline-none"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="px-3 text-sm text-gray-600 hover:bg-gray-50"
                title={showPwd ? 'Ocultar' : 'Mostrar'}
              >
                {showPwd ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Confirmar contraseña</label>
            <div className="h-10 rounded-md border border-gray-300 flex overflow-hidden">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="flex-1 px-3 text-sm outline-none"
                placeholder="Repite tu contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="px-3 text-sm text-gray-600 hover:bg-gray-50"
                title={showConfirm ? 'Ocultar' : 'Mostrar'}
              >
                {showConfirm ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-[12px] text-gray-500 mt-1">
              Debe tener al menos 6 caracteres y coincidir en ambos campos.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={onSubmit}
            disabled={loading || !canSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-5 py-2.5 text-white text-sm font-medium hover:bg-black disabled:opacity-60"
          >
            {loading ? 'Guardando…' : 'Crear contraseña'}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="M10 17l5-5l-5-5v10zM4 4h2v16H4z" />
            </svg>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/login')} className="text-sm text-blue-700 hover:underline">
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
