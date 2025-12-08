// src/pages/RegistroInvitacionCourier.tsx
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import BackgroundImage from "@/assets/images/login-background.webp";
import { confirmarPasswordInvitacion } from "@/services/admin/panel/admin-invite.api";
import { Inputx } from "@/shared/common/Inputx";

export default function RegistroInvitacionCourier() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const token = sp.get("token") || "";
  const name = sp.get("name") || "Tu cuenta";

  // UI state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minLen = 6;

  const canSubmit = useMemo(
    () => password.length >= minLen && password === confirm,
    [password, confirm]
  );

  // fuerza simple de contraseña según longitud
  let strengthLabel: string | null = null;
  let strengthClass = "";
  if (password.length > 0) {
    if (password.length < 8) {
      strengthLabel = "Contraseña débil";
      strengthClass = "bg-red-100 text-red-700";
    } else if (password.length < 12) {
      strengthLabel = "Contraseña media";
      strengthClass = "bg-yellow-100 text-yellow-700";
    } else {
      strengthLabel = "Contraseña fuerte";
      strengthClass = "bg-green-100 text-green-700";
    }
  }

  const onSubmit = useCallback(async () => {
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Enlace inválido o falta el token de invitación.");
      return;
    }
    if (!canSubmit) {
      setErrorMsg(
        "Verifica tu contraseña (mín. 6 caracteres y deben coincidir)."
      );
      return;
    }

    try {
      setLoading(true);

      const json = await confirmarPasswordInvitacion({
        token,
        contrasena: password,
        confirmar_contrasena: confirm,
      });

      if (!json?.ok) {
        setErrorMsg(json?.message || "No se pudo crear la contraseña.");
        return;
      }

      // Éxito: redirigir directamente al login
      navigate("/login", { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }, [token, password, confirm, canSubmit, navigate]);

  // Guard clause: si no hay token, mostrar mensaje de error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-red-600">
            Enlace inválido o falta el token de invitación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 bg-center bg-cover bg-no-repeat relative"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md md:max-w-lg">
        <div className="w-full bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Icon icon="mdi:truck-delivery-outline" width={24} height={24} />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A237E] tracking-wide">
              Crear contraseña de courier
            </h1>

            <p className="text-xs md:text-sm text-gray-600 max-w-md">
              Tu acceso como courier para{" "}
              <span className="font-semibold text-blue-700">{name}</span> ha
              sido aprobado. Crea tu contraseña para activarlo.
            </p>

            <p className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 uppercase mt-1">
              Invitación aprobada · Paso final
            </p>
          </div>

          {/* Mensajes */}
          {errorMsg && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}

          {/* Campos */}
          <div className="space-y-4">
            <Inputx
              type="password"
              withPasswordToggle
              label="Contraseña"
              placeholder="Ingresa tu nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {/* Requisitos + fuerza */}
            <div className="bg-gray-50 rounded-2xl p-3 md:p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Requisitos de seguridad
              </p>
              <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
                <li>Mínimo {minLen} caracteres.</li>
                <li>Combina letras y números.</li>
                <li>Ambas contraseñas deben coincidir.</li>
              </ul>

              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Estado de seguridad:
                </p>
                {strengthLabel ? (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${strengthClass}`}
                  >
                    {strengthLabel}
                  </span>
                ) : (
                  <p className="text-xs text-gray-500">
                    Escribe una contraseña para evaluar su seguridad.
                  </p>
                )}
              </div>
            </div>

            <Inputx
              type="password"
              withPasswordToggle
              label="Confirmar contraseña"
              placeholder="Vuelve a escribir tu contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />

            {confirm && password !== confirm && (
              <p className="text-xs text-red-600">
                Las contraseñas no coinciden. Asegúrate de que ambas sean
                iguales.
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="mt-2 flex flex-col gap-3">
            <button
              onClick={onSubmit}
              disabled={loading || !canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 py-2.5 text-white text-sm font-semibold hover:bg-black disabled:opacity-60 transition-colors"
            >
              {loading ? "Guardando…" : "Crear contraseña"}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M10 17l5-5l-5-5v10zM4 4h2v16H4z" />
              </svg>
            </button>

            <button
              onClick={() => navigate("/login")}
              className="text-sm text-blue-700 hover:underline text-center"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
