// src/shared/components/common/CenteredModal.tsx
import React, { useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';

interface CenteredModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  /** Ej.: "max-w-7xl", "max-w-[1200px]" */
  widthClass?: string;
  /** Oculta el botón X si no quieres cierre manual */
  hideCloseButton?: boolean;
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
  widthClass = 'max-w-7xl',
  hideCloseButton = false,
}: CenteredModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Bloquear scroll del body mientras el modal está montado
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Enfocar el panel al montar
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si el click fue directamente en el backdrop (y no en el contenido), cerrar
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-[95vw] ${widthClass} bg-white rounded shadow-xl outline-none animate-scale-in`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 id="modal-title" className="font-semibold">
            {title}
          </h3>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              aria-label="Cerrar">
              <HiX size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 max-h-[80vh] overflow-auto">{children}</div>
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
