import { useState } from 'react';
import { NotificationContext } from './NotificationContext';
import type { Notification, NotificationType } from './notify';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = (message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-white transition
            ${notification.type === 'success' ? 'bg-green-500' : ''}
            ${notification.type === 'error' ? 'bg-red-500' : ''}
            ${notification.type === 'info' ? 'bg-blue-500' : ''}
          `}
        >
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
