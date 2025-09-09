import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNotificationBell } from './useNotificationBell';
import { FaBell } from 'react-icons/fa';
import { Icon } from '@iconify/react';

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

const NotificationBellIcon = () => {
  const { unreadCount, notifications, markAllAsRead, loading } = useNotificationBell();
  const [open, setOpen] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllAsRead();
    }
  };

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button onClick={toggle} className="relative" aria-label="Notificaciones">
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center
                       text-[10px] font-bold text-white bg-red-600 rounded-full leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded-lg border bg-white shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-sm font-semibold">Notificaciones</h3>
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => {
                  // Aquí podrías redirigir a una página de /notificaciones
                  window.location.href = '/notificaciones';
                }}
              >
                Ver más
              </button>
            </div>

            <div>
              {loading ? (
                <p className="text-gray-500 text-sm p-3">Cargando…</p>
              ) : notifications.length === 0 ? (
                <p className="text-gray-500 text-sm p-3">No hay notificaciones</p>
              ) : (
                notifications.map((n) => {
                  // Elegir icono según tipo
                  let icon = 'mdi:bell-outline';
                  if (n.titulo?.toLowerCase().includes('whatsapp'))
                    icon = 'mdi:whatsapp';
                  else if (n.titulo?.toLowerCase().includes('stock'))
                    icon = 'mdi:package-variant';

                  const content = (
                    <div
                      className="flex gap-3 items-start px-4 py-3 border-b last:border-none hover:bg-gray-50 cursor-pointer"
                      key={n.id}
                    >
                      <Icon
                        icon={icon}
                        className={`text-xl ${
                          n.titulo?.toLowerCase().includes('whatsapp')
                            ? 'text-green-500'
                            : 'text-blue-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{n.titulo}</p>
                        <p className="text-gray-600 text-xs truncate">{n.mensaje}</p>
                        <span className="text-[11px] text-gray-400">
                          {formatRelativeDate(n.fecha)}
                        </span>
                      </div>
                      {!n.leido && (
                        <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                      )}
                    </div>
                  );

                  // Si hay link en data, que sea clickeable
                  return n.data?.link ? (
                    <a
                      href={n.data.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={n.id}
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBellIcon;
