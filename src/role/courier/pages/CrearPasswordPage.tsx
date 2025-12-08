// src/pages/CrearPasswordPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import BackgroundImage from "@/assets/images/login-background.webp";
import {
  completarRegistro, // ecommerce
  completarRegistroMotorizado, // motorizado
} from "@/services/courier/panel_control/panel_control.api";
import { Inputx } from "@/shared/common/Inputx";

export default function CrearPasswordPage() {
  const { pathname } = useLocation();
  const isMotorizado = /crear-password-(motorizado|repartidor)/.test(pathname);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const nav = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr("Enlace inválido o token ausente.");
      return;
    }
    if (!canSubmit) {
      setErr("La contraseña no cumple los requisitos o no coincide.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        token,
        contrasena: password,
        confirmar_contrasena: confirm,
      };

      const res = isMotorizado
        ? await completarRegistroMotorizado(payload)
        : await completarRegistro(payload);

      if (res.ok) {
        setMsg(res.data.mensaje || "¡Contraseña creada correctamente!");
        setTimeout(() => nav("/", { replace: true }), 1500);
      } else {
        setErr(res.error || "No se pudo completar el proceso.");
      }
    } catch {
      setErr("Ocurrió un error inesperado.");
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
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 bg-center bg-cover bg-no-repeat relative"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      {/* Overlay con oscurecido + blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md md:max-w-lg">
        <form
          onSubmit={onSubmit}
          className="w-full bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Logo opcional */}
          <div className="flex items-center justify-center">
            <img
              src="/logo-tiktuy.svg"
              alt="Tiktuy"
              className="h-8"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-700">
              <Icon icon="mdi:lock-outline" width={24} height={24} />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A237E] tracking-wide">
              {isMotorizado
                ? "Crear contraseña para repartidor"
                : "Crear contraseña"}
            </h1>

            <p className="text-xs md:text-sm text-gray-600 max-w-md">
              {isMotorizado
                ? "Establece tu contraseña para ingresar como repartidor en Tiktuy."
                : "Establece una contraseña segura para acceder a tu cuenta de Ecommerce en Tiktuy."}
            </p>

            <p className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 uppercase mt-1">
              Paso final · Revisa bien tu contraseña
            </p>
          </div>

          {/* Mensajes */}
          {err && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {err}
            </div>
          )}
          {msg && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              {msg}
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
              label="Repetir contraseña"
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

          {/* Botón */}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="mt-2 w-full rounded-xl bg-[#1A237E] text-white py-2.5 text-sm font-semibold hover:bg-[#10195b] disabled:opacity-60 transition-colors"
          >
            {loading ? "Registrando..." : "Registrar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
