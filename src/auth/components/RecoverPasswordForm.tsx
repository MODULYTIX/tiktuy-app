import { useEffect, useState } from "react";
import Logo from "@/assets/logos/logo-tiktuy.webp";
import { recoverPasswordRequest } from "../services/auth.api";
import { Link, useNavigate } from "react-router";
import { Icon } from "@iconify/react";

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // ✅ redirect suave a login luego de enviar
  const navigate = useNavigate();
  const REDIRECT_SECONDS = 6;
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!sent) return;

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
  }, [sent, navigate]);

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
        <h2 className="text-center text-xl font-bold tracking-widest text-[#1b1b77] mb-3">
          ─ RECUPERAR CONTRASEÑA ─
        </h2>

        {/* ✅ Texto corto (para que no se sienta vacío) */}
        {!sent && (
          <p className="text-center text-sm text-gray-600 mb-6 leading-relaxed">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.{" "}
            <span className="font-medium text-gray-700">
              Por seguridad, siempre verás el mismo mensaje.
            </span>
          </p>
        )}

        {sent ? (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"
            aria-live="polite"
          >
            <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-emerald-200">
              <Icon icon="mdi:check" className="text-[22px] text-emerald-700" />
            </div>

            <p className="text-sm font-semibold text-emerald-900">
              Listo. Si el correo existe, te enviamos un enlace para restablecer tu contraseña.
            </p>

            <p className="mt-2 text-xs text-emerald-800/90">
              Redirigiendo a inicio de sesión en{" "}
              <span className="font-bold">{secondsLeft}s</span>…
            </p>

            <div className="mt-4">
              <Link to="/login" className="text-sm text-[#1b1b77] hover:underline">
                Ir ahora
              </Link>
            </div>
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#1b1b77] outline-none"
              required
              disabled={loading}
            />

            <p className="mt-2 text-xs text-gray-500">
              Revisa también Spam/Promociones por si acaso.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-gradient-to-r from-[#1b1b77] to-[#2e2ea2] text-white py-2 rounded shadow-md hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Icon icon="line-md:loading-twotone-loop" className="text-[18px]" />
                  Enviando...
                </>
              ) : (
                <>
                  <Icon icon="mdi:send-outline" className="text-[18px]" />
                  ENVIAR ENLACE
                </>
              )}
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
