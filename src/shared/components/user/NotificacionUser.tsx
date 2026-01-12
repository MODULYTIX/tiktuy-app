// src/pages/notificaciones/NotificacionUser.tsx
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNotificationBell } from "@/shared/context/notificacionesBell/useNotificationBell";

function formatRelativeDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} minutos`;
  if (diffHr < 24) return `Hace ${diffHr} horas`;
  if (diffDay === 1) return 'Hace 1 día';
  return `Hace ${diffDay} días`;
}

type Props = {
  onClose: () => void;
};

export default function NotificacionUser({ onClose }: Props) {
  const { notifications, loading } = useNotificationBell();
  const [isClosing, setIsClosing] = useState(false);

  // Animation handling for slide-out
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"
          }`}
        onClick={handleClose}
      />

      {/* Drawer Panel */}
      <div
        className={`relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isClosing ? "translate-x-full" : "translate-x-0"
          } sm:border-l border-slate-100`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">Notificaciones</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {notifications.filter((n) => !n.leido).length} no leídas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Próximamente: Marcar todo leido")}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors"
              title="Marcar todas como leídas"
            >
              <Icon icon="mdi:check-all" className="text-lg" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Icon icon="svg-spinners:ring-resize" className="text-2xl mb-3" />
              <p className="text-xs">Cargando actualizaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Icon icon="mdi:bell-sleep-outline" className="text-3xl text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">Estás al día</p>
              <p className="text-xs text-slate-400 mt-1">No hay nuevas notificaciones por ahora.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`relative px-6 py-4 transition-colors group ${n.leido ? "bg-white hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/70"
                    }`}
                >
                  {/* Unread Indicator Bar */}
                  {!n.leido && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                  )}

                  <div className="flex gap-4">
                    {/* Icon based on type (placeholder logic) */}
                    <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${n.leido ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                      <Icon icon="mdi:bell-outline" className="text-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm truncate pr-2 ${n.leido ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {n.titulo}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatRelativeDate(n.fecha)}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${n.leido ? 'text-slate-500' : 'text-slate-600'}`}>
                        {n.mensaje}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer (Optional, can be removed if cleaner without it) */}
        {/* <div className="p-4 border-t border-slate-100 bg-white text-center">
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Ver historial completo</button>
        </div> */}

      </div>
    </div>,
    document.body
  );
}
