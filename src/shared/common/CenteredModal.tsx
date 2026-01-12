// src/shared/components/common/CenteredModal.tsx
import React, { useEffect, useRef } from "react";
import { HiX } from "react-icons/hi";

interface CenteredModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  /** Ej.: "max-w-7xl", "max-w-[1200px]" */
  widthClass?: string;
  hideCloseButton?: boolean;

  hideHeader?: boolean;

  bodyClassName?: string;

  panelClassName?: string;
}

/**
 * Modal centrado, ancho, con backdrop y escape/click-outside para cerrar.
 * - Bloquea el scroll del body mientras está abierto.
 * - Enfoca el contenedor al abrir (mejor accesibilidad).
 * - Cierra con ESC y al hacer click en el backdrop.
 */
export default function CenteredModal({
  title,
  children,
  onClose,
  widthClass = "max-w-7xl",
  hideCloseButton = false,
  hideHeader = false,
  bodyClassName,
  panelClassName,
}: CenteredModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // Bloquear scroll del body mientras el modal está montado
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Enfocar el panel al montar
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const hasTitle = Boolean(title?.trim());

  // ✅ Auto-hide: si no hay título y además ocultas el botón, no tiene sentido dibujar header.
  const shouldRenderHeader =
    !hideHeader && (hasTitle || !hideCloseButton);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      {...(hasTitle ? { "aria-labelledby": "modal-title" } : { "aria-label": "Modal" })}
      onMouseDown={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-fade-in" />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "relative w-[95vw] bg-white rounded-2xl border border-gray-200 shadow-2xl outline-none overflow-hidden animate-scale-in",
          widthClass,
          panelClassName ?? "",
        ].join(" ")}
      >
        {/* Header */}
        {shouldRenderHeader && (
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
            <h3 id="modal-title" className="font-extrabold text-slate-900">
              {title}
            </h3>

            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <HiX size={18} className="text-slate-700" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={bodyClassName ?? "p-4 max-h-[80vh] overflow-auto bg-white"}>
          {children}
        </div>
      </div>

      {/* Animaciones mínimas inline para no depender de config externa */}
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scale-in { 
          0% { opacity: 0; transform: translateY(8px) scale(0.98) }
          100% { opacity: 1; transform: translateY(0) scale(1) }
        }
        .animate-fade-in { animation: fade-in .15s ease-out both }
        .animate-scale-in { animation: scale-in .15s ease-out both }
      `}</style>
    </div>
  );
}
