// src/pages/notificaciones/NotificacionUser.tsx
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useNotificationBell } from "@/shared/context/notificacionesBell/useNotificationBell";

type Props = {
  onClose: () => void;
};

export default function NotificacionUser({ onClose }: Props) {
  const { notifications, loading } = useNotificationBell();

  // Evita scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[10000] w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <Icon
              icon="mdi:bell-outline"
              className="text-xl text-[#1E3A8A]"
            />
            <h2 className="text-sm font-semibold text-gray-900">
              Notificaciones
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Cerrar"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Cargando…</p>
          ) : notifications.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No tienes notificaciones
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex gap-4 px-5 py-4 border-b last:border-none hover:bg-gray-50 transition"
              >
                <Icon
                  icon="mdi:bell-outline"
                  className="text-lg text-[#1E3A8A] mt-1 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {n.titulo}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {n.mensaje}
                  </p>
                </div>

                {!n.leido && (
                  <span className="mt-2 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-white border hover:bg-gray-100 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
