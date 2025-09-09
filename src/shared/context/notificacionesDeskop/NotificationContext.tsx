import { createContext } from 'react';
import type { NotificationType } from './notify';

export type NotificationContextType = {
  notify: (message: string, type?: NotificationType) => void;
};

export const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
});
