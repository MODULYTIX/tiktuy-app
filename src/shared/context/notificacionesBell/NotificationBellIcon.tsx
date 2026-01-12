// src/shared/context/notificacionesBell/NotificationBellIcon.tsx
import { useState, useEffect, useRef } from 'react';
import { useNotificationBell } from './useNotificationBell';
import { Icon } from '@iconify/react';
import NotificacionUser from '@/shared/components/user/NotificacionUser';
import { motion, AnimatePresence } from 'framer-motion';

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
  className?: string;
};

const NotificationBellIcon = ({ className = '' }: Props) => {
  const { unreadCount, notifications, markAllAsRead, loading } = useNotificationBell();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = async () => {
    const next = !isDropdownOpen;
    setIsDropdownOpen(next);
    if (next && unreadCount > 0) {
      await markAllAsRead();
    }
  };

  const openDrawer = () => {
    setIsDropdownOpen(false);
    setIsDrawerOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>

      {/* Bell Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={toggleDropdown}
        className={`
          relative h-10 w-10
          flex items-center justify-center
          rounded-full
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-100
          ${isDropdownOpen ? 'bg-slate-100 text-blue-600' : 'text-gray-500 hover:bg-slate-100 hover:text-blue-600'}
        `}
        aria-label="Abrir notificaciones"
      >
        <Icon icon="mdi:bell-outline" width={24} height={24} />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-2 right-2.5 flex h-2.5 w-2.5"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 ring-2 ring-white"></span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
              <button
                onClick={openDrawer}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Ver más
              </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-400">
                  <Icon icon="svg-spinners:ring-resize" className="text-xl mb-2 mx-auto" />
                  <p className="text-xs">Cargando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Icon icon="mdi:bell-off-outline" className="text-2xl text-gray-300 mx-auto mb-2" />
                  <p className="text-xs">Sin notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={openDrawer}
                      className="group flex gap-3 px-5 py-4 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="mt-0.5 shrink-0 text-blue-600">
                        <Icon icon="mdi:bell-outline" className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-gray-900 leading-tight mb-0.5 ${!n.leido ? 'font-bold' : 'font-medium'}`}>
                          {n.titulo}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {n.mensaje}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1.5 cursor-default">
                          {formatRelativeDate(n.fecha)}
                        </p>
                      </div>
                      {!n.leido && (
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50 px-5 py-2 text-center border-t border-gray-100">
                <button onClick={openDrawer} className="text-xs font-medium text-gray-500 hover:text-gray-900 transition">
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      {isDrawerOpen && (
        <NotificacionUser onClose={() => setIsDrawerOpen(false)} />
      )}
    </div>
  );
};

export default NotificationBellIcon;
