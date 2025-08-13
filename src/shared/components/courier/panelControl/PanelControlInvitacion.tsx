// components/shared/InvitarModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { generarLinkInvitacion, getAuthToken } from "@/services/courier/panel_control/panel_control.api";

interface InvitarModalProps {
  onClose: () => void;
  activeTab: "ecommerce" | "motorizado";
}

export default function PanelControlInvitacion({
  onClose,
  activeTab,
}: InvitarModalProps) {
  const [link, setLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(activeTab === "ecommerce");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar el link desde backend cuando la pestaña sea "ecommerce"
  useEffect(() => {
    let mounted = true;

    async function fetchLink() {
      if (activeTab !== "ecommerce") return;
      setLoading(true);
      setErrorMsg(null);

      const token = getAuthToken();
      if (!token) {
        setErrorMsg("No se encontró el token de autenticación.");
        setLoading(false);
        return;
      }

      const res = await generarLinkInvitacion(token);
      if (!mounted) return;

      if (res.ok) {
        setLink(res.data.link);
      } else {
        setErrorMsg(res.error || "No se pudo generar el enlace de invitación.");
      }
      setLoading(false);
    }

    fetchLink();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const canShare = activeTab === "ecommerce" && !loading && !errorMsg && !!link;

  // URLs de compartir
  const shareText = useMemo(
    () =>
      encodeURIComponent(
        "¡Únete a nuestra plataforma como Ecommerce! Completa tu registro aquí:"
      ),
    []
  );
  const encodedLink = useMemo(
    () => encodeURIComponent(link || ""),
    [link]
  );

  const whatsappHref = useMemo(
    () => (canShare ? `https://wa.me/?text=${shareText}%20${encodedLink}` : "#"),
    [canShare, shareText, encodedLink]
  );

  const facebookHref = useMemo(
    () =>
      canShare
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`
        : "#",
    [canShare, encodedLink]
  );

  const gmailHref = useMemo(
    () =>
      canShare
        ? `mailto:?subject=${encodeURIComponent(
            "Invitación a registrarte como Ecommerce"
          )}&body=${shareText}%0A${encodedLink}`
        : "#",
    [canShare, shareText, encodedLink]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // no-op
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center text-[#1A237E] mb-2">
          <Icon icon="mdi:share-outline" className="inline mr-2" />
          Compartir
        </h2>

        <p className="text-center text-sm text-gray-600 mb-4">
          {activeTab === "ecommerce"
            ? "Invita a nuevos ecommerces a unirse a la plataforma compartiendo este enlace."
            : "Invitación para motorizados: pendiente de implementación del endpoint."}
        </p>

        {/* Estados */}
        {activeTab === "ecommerce" && loading && (
          <div className="mb-4 text-sm text-gray-600 text-center">
            Generando enlace de invitación…
          </div>
        )}
        {activeTab === "ecommerce" && errorMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-center">
            {errorMsg}
          </div>
        )}

        {/* Acciones de compartir */}
        <div className="flex justify-center gap-6 mb-4 text-center items-center opacity-100">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center h-full ${
              !canShare ? "pointer-events-none opacity-40" : ""
            }`}
            title={canShare ? "Compartir por WhatsApp" : "Generando enlace…"}
          >
            <Icon icon="logos:whatsapp-icon" width="36" />
            <p className="text-xs mt-1">Whatsapp</p>
          </a>

          <a
            href={facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center h-full ${
              !canShare ? "pointer-events-none opacity-40" : ""
            }`}
            title={canShare ? "Compartir en Facebook" : "Generando enlace…"}
          >
            <Icon icon="logos:facebook" width="36" />
            <p className="text-xs mt-1">Facebook</p>
          </a>

          <a
            href={gmailHref}
            className={`flex flex-col items-center h-full ${
              !canShare ? "pointer-events-none opacity-40" : ""
            }`}
            title={canShare ? "Compartir por Gmail" : "Generando enlace…"}
          >
            <Icon icon="logos:google-gmail" width="36" />
            <p className="text-xs mt-3">Gmail</p>
          </a>
        </div>

        {/* Link + copiar */}
        <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded">
          <span className="text-sm text-gray-700 truncate">
            {activeTab === "ecommerce"
              ? link || (loading ? "Generando enlace…" : "—")
              : "Pendiente de implementación para motorizado"}
          </span>
          <button
            onClick={handleCopy}
            disabled={!canShare}
            className="text-sm font-medium text-white bg-[#1A237E] px-3 py-1 rounded disabled:opacity-50"
            title={canShare ? "Copiar enlace" : "Generando enlace…"}
          >
            Copiar
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
