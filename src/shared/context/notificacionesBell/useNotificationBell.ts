import { useContext } from 'react';
import { NotificationBellContext } from './NotificationBellContext';

export const useNotificationBell = () => {
  const ctx = useContext(NotificationBellContext);
  if (!ctx) throw new Error('useNotificationBell debe usarse dentro de NotificationBellProvider');
  return ctx;
};
