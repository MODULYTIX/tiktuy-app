import { useState, useEffect, useCallback } from 'react';
import { NotificationContext } from './NotificationContext';
import type { Notification, NotificationType } from './notify';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  // Auto-dismiss logic
  const handleDismiss = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(handleDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, handleDismiss]);

  const notify = (message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          searchBg: 'bg-emerald-500/20',
          text: 'text-emerald-900 dark:text-emerald-50',
          icon: 'solar:check-circle-bold-duotone',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          gradient: 'from-emerald-500/20 to-teal-500/20',
          progress: 'bg-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20',
          searchBg: 'bg-rose-500/20',
          text: 'text-rose-950 dark:text-rose-50',
          icon: 'solar:danger-circle-bold-duotone',
          iconColor: 'text-rose-600 dark:text-rose-400',
          gradient: 'from-rose-500/20 to-red-500/20',
          progress: 'bg-rose-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20',
          searchBg: 'bg-amber-500/20',
          text: 'text-amber-950 dark:text-amber-50',
          icon: 'solar:bell-bing-bold-duotone',
          iconColor: 'text-amber-600 dark:text-amber-400',
          gradient: 'from-amber-500/20 to-orange-500/20',
          progress: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20',
          searchBg: 'bg-blue-500/20',
          text: 'text-blue-900 dark:text-blue-50',
          icon: 'solar:info-circle-bold-duotone',
          iconColor: 'text-blue-600 dark:text-blue-400',
          gradient: 'from-blue-500/20 to-indigo-500/20',
          progress: 'bg-blue-500'
        };
    }
  };

  const styles = notification ? getStyles(notification.type) : null;

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <div className="fixed top-6 right-6 z-[9999] pointer-events-none perspective-[1000px]">
        <AnimatePresence mode="wait">
          {notification && styles && (
            <motion.div
              layout
              initial={{ opacity: 0, x: 50, rotateX: -15, scale: 0.9 }}
              animate={{
                opacity: 1,
                x: 0,
                rotateX: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.8
                }
              }}
              exit={{
                opacity: 0,
                x: 20,
                scale: 0.95,
                transition: { duration: 0.2 }
              }}
              className={`
                pointer-events-auto
                relative w-[400px] overflow-hidden
                rounded-2xl border backdrop-blur-xl
                shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                ${styles.bg}
              `}
            >
              {/* Background Gradient Mesh */}
              <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-50`} />

              <div className="relative p-4 flex gap-4 items-center">
                {/* 3D Floating Icon */}
                <div className={`
                  shrink-0 p-3 rounded-xl 
                  ${styles.searchBg} backdrop-blur-md
                  shadow-inner
                `}>
                  <Icon
                    icon={styles.icon}
                    className={`w-7 h-7 ${styles.iconColor} drop-shadow-sm`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold mb-0.5 ${styles.iconColor} uppercase tracking-wider text-[10px]`}>
                    {notification.type}
                  </h4>
                  <p className={`text-[15px] font-medium leading-snug ${styles.text}`}>
                    {notification.message}
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className={`
                    shrink-0 p-2 rounded-lg 
                    hover:bg-black/5 dark:hover:bg-white/10 
                    transition-colors duration-200
                    ${styles.text} opacity-60 hover:opacity-100
                  `}
                >
                  <Icon icon="solar:close-circle-bold" width="20" />
                </button>
              </div>

              {/* Animated Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                className={`h-1 w-full origin-left ${styles.progress} opacity-30`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
