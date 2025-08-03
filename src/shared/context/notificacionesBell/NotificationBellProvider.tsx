import { useState, useEffect } from 'react';
import { NotificationBellContext } from './NotificationBellContext';
import type { NotificationBellContextType, NotificationItem } from './types/types';

interface Props {
  children: React.ReactNode;
}

export const NotificationBellProvider = ({ children }: Props) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: NotificationItem) => !n.leido).length);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (noti: NotificationItem) => {
    setNotifications(prev => [noti, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, leido: true }))
    );
    setUnreadCount(0);
  };

  const value: NotificationBellContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAllAsRead,
  };

  return (
    <NotificationBellContext.Provider value={value}>
      {children}
    </NotificationBellContext.Provider>
  );
};
