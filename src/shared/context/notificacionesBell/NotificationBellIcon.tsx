import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNotificationBell } from './useNotificationBell';
import { FaBell } from 'react-icons/fa';

const NotificationBellIcon = () => {
  const { unreadCount, notifications, markAllAsRead } = useNotificationBell();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          markAllAsRead();
        }}
        className="relative"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center  text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 z-50 mt-2 w-72 max-h-80 overflow-auto rounded-lg border bg-white shadow-lg p-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="text-sm font-semibold mb-2">Notificaciones</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay notificaciones</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="text-sm px-2 py-1 border-b last:border-none hover:bg-gray-50"
                >
                  <p className={n.leido ? 'text-gray-500' : 'text-black'}>
                    {n.mensaje}
                  </p>
                  <span className="text-xs text-gray-400">{new Date(n.fecha).toLocaleString()}</span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBellIcon;
