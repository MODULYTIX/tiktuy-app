import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Logo from "@/assets/logos/logo-tiktuy.webp";
import { confirmRecoverPasswordRequest } from "../services/auth.api";
import { Icon } from "@iconify/react";

import { Inputx } from "@/shared/common/Inputx";

export default function ChangePassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ✅ redirect luego de éxito (6s)
  const REDIRECT_SECONDS = 6;
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!success) return;

    setSecondsLeft(REDIRECT_SECONDS);

    const t = window.setTimeout(() => {
      navigate("/login");
    }, REDIRECT_SECONDS * 1000);

    const iv = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
    };
  }, [success, navigate]);

  // ✅ verificador simple (solo visual)
  const rules = useMemo(() => {
    const minLen = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const match = confirm.length > 0 && password === confirm;

    return { minLen, hasLetter, hasNumber, match };
  }, [password, confirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Token inválido o ausente");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
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
    } catch (err: any) {
      setError(err.message || "No se pudo cambiar la contraseña");
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
      <div className="relative flex items-center justify-center h-screen px-4">
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
            <h2 className="text-center text-xl font-bold tracking-widest text-[#1b1b77] mb-3">
              ─ CREAR NUEVA CONTRASEÑA ─
            </h2>

            {!success && (
              <p className="text-center text-sm text-gray-600 mb-5 leading-relaxed">
                Crea una contraseña segura y confírmala para continuar.
              </p>
            )}

            {success ? (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center"
                aria-live="polite"
              >
                <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-emerald-200">
                  <Icon icon="mdi:check" className="text-[22px] text-emerald-700" />
                </div>

                <p className="text-sm font-semibold text-emerald-900">
                  Tu contraseña ha sido cambiada correctamente.
                </p>

                <p className="mt-2 text-xs text-emerald-800/90">
                  Redirigiendo a inicio de sesión en{" "}
                  <span className="font-bold">{secondsLeft}s</span>…
                </p>
              </div>
            ) : (
              <>
                {/* Inputs con tu Inputx + ojito */}
                <div className="space-y-4">
                  <Inputx
                    label="Nueva contraseña"
                    type="password"
                    placeholder="Escribe tu nueva contraseña"
                    withPasswordToggle
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />

                  <Inputx
                    label="Confirmar contraseña"
                    type="password"
                    placeholder="Repite tu contraseña"
                    withPasswordToggle
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Recomendaciones + verificador (compacto) */}
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Recomendación rápida
                  </p>

                  <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                    <Rule ok={rules.minLen} text="Mínimo 6 caracteres" />
                    <Rule ok={rules.hasLetter} text="Incluye al menos una letra" />
                    <Rule ok={rules.hasNumber} text="Incluye al menos un número" />
                    <Rule
                      ok={rules.match}
                      text={
                        confirm.length === 0
                          ? "Confirma la contraseña"
                          : "Las contraseñas coinciden"
                      }
                      neutral={confirm.length === 0}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] text-white py-2 rounded shadow-md hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon icon="line-md:loading-twotone-loop" className="text-[18px]" />
                      Guardando...
                    </>
                  ) : (
                    "ACTUALIZAR CONTRASEÑA"
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Rule({
  ok,
  text,
  neutral = false,
}: {
  ok: boolean;
  text: string;
  neutral?: boolean;
}) {
  const icon = neutral
    ? "mdi:minus-circle-outline"
    : ok
    ? "mdi:check-circle"
    : "mdi:close-circle";
  const color = neutral ? "text-gray-400" : ok ? "text-emerald-600" : "text-red-500";

  return (
    <div className="flex items-center gap-2">
      <Icon icon={icon} className={`${color} text-[16px]`} />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
