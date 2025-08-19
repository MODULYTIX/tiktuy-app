// components/shared/InvitarModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  generarLinkInvitacion,
  generarLinkInvitacionMotorizado,
  getAuthToken,
} from "@/services/courier/panel_control/panel_control.api";

interface InvitarModalProps {
  onClose: () => void;
  activeTab: "ecommerce" | "motorizado";
}

export default function PanelControlInvitacion({
  onClose,
  activeTab,
}: InvitarModalProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toast “copiado”
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<number | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOpen(false), 2200);
  };
  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Cargar link
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      setLink("");

      const token = getAuthToken();
      if (!token) {
        setErrorMsg("No se encontró el token de autenticación.");
        setLoading(false);
        return;
      }

      const res =
        activeTab === "ecommerce"
          ? await generarLinkInvitacion(token)
          : await generarLinkInvitacionMotorizado(token);

      if (!mounted) return;
      if (res.ok) setLink(res.data.link);
      else
        setErrorMsg(
          res.error ||
          "No se pudo generar el enlace de invitación. Intenta nuevamente."
        );
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const canShare = !loading && !errorMsg && !!link;

  // Texto dinámico
  const shareLabel =
    activeTab === "ecommerce"
      ? "¡Únete a nuestra plataforma como Ecommerce! Completa tu registro aquí:"
      : "¡Únete como Motorizado! Completa tu registro aquí:";
  const mailSubject =
    activeTab === "ecommerce"
      ? "Invitación a registrarte como Ecommerce"
      : "Invitación a registrarte como Motorizado";

  const shareText = useMemo(() => encodeURIComponent(shareLabel), [shareLabel]);
  const encodedLink = useMemo(() => encodeURIComponent(link || ""), [link]);

  const whatsappHref = useMemo(
    () => (canShare ? `https://wa.me/?text=${shareText}%20${encodedLink}` : "#"),
    [canShare, shareText, encodedLink]
  );
  const facebookHref = useMemo(
    () =>
      canShare ? `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` : "#",
    [canShare, encodedLink]
  );
  const gmailHref = useMemo(
    () =>
      canShare
        ? `mailto:?subject=${encodeURIComponent(
          mailSubject
        )}&body=${shareText}%0A${encodedLink}`
        : "#",
    [canShare, shareText, encodedLink, mailSubject]
  );

  const handleCopy = async () => {
    if (!canShare) return;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Enlace copiado");
    } catch {
      showToast("No se pudo copiar");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-7 md:p-8 w-[560px] max-w-[92vw] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* layout vertical con más aire */}
        <div className="flex flex-col gap-6">
          {/* Título */}
          <h2 className="flex items-center justify-center text-[28px] font-bold text-[#1A237E]">
            <Icon
              icon="ph:share-fat"
              className="mr-2 w-[38px] h-[38px]"
            />
            Compartir
          </h2>

          {/* Descripción (no tocar copy) */}
          <p className="text-center text-sm text-gray-600">
            {activeTab === "ecommerce"
              ? "Invita a nuevos ecommerces a unirse a la plataforma compartiendo este enlace."
              : "Invita a nuevos motorizados a unirse a la plataforma compartiendo este enlace."}
          </p>

          {/* Estados */}
          {loading && (
            <div className="text-sm text-gray-600 text-center">
              Generando enlace de invitación…
            </div>
          )}
          {errorMsg && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-center">
              {errorMsg}
            </div>
          )}

          {/* Íconos de compartir */}
          <div className="flex justify-center gap-12 items-center">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center ${!canShare ? "pointer-events-none opacity-40" : ""
                }`}
              title={canShare ? "Compartir por WhatsApp" : "Generando enlace…"}
            >
              <Icon icon="logos:whatsapp-icon" width="80" />
              <p className="text-xs mt-2 text-gray-700">Whatsapp</p>
            </a>

            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center ${!canShare ? "pointer-events-none opacity-40" : ""
                }`}
              title={canShare ? "Compartir en Facebook" : "Generando enlace…"}
            >
              <Icon icon="logos:facebook" width="70" />
              <p className="text-xs mt-3 text-gray-700">Facebook</p>
            </a>

            <a
              href={gmailHref}
              className={`flex flex-col items-center ${!canShare ? "pointer-events-none opacity-40" : ""
                }`}
              title={canShare ? "Compartir por Gmail" : "Generando enlace…"}
            >
              <Icon icon="logos:google-gmail" width="70" />
              <p className="text-xs mt-5 text-gray-700">Gmail</p>
            </a>
          </div>

          {/* Link + copiar — botón dentro del chip */}
          <div>
            <div className="relative w-full rounded-full border-2 border-gray30 bg-white shadow-[0_2px_0_#E5E7EB]">
              {/* Texto del link */}
              <div className="pl-5 pr-40 py-3">
                <span className="block text-[14px] text-gray90 whitespace-nowrap overflow-hidden text-ellipsis">
                  {link || (loading ? "Generando enlace…" : "—")}
                </span>
              </div>

              {/* Botón copiar */}
              <button
                onClick={handleCopy}
                disabled={!canShare}
                title={canShare ? "Copiar enlace" : "Generando enlace…"}
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2
                           px-5 py-2 rounded-full bg-gray90 text-white text-[14px]
                           hover:bg-gray70 transition disabled:opacity-50"
              >
                Copiar
                <Icon icon="mdi:content-copy" width="18" height="18" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast flotante (confirmación de copiado) */}
      <div
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] transition-all duration-300 ${toastOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
          }`}
      >
        <div className="rounded-full px-4 py-2 bg-gray90 text-white shadow-lg text-[12px]">
          {toastMsg}
        </div>
      </div>
    </div>
  );
}
