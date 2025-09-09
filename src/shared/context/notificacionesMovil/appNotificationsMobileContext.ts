// src/shared/context/notificacionesMovil/appNotificationsMobileContext.ts
import { createContext, useContext } from 'react';

export type AppNotificationType = 'pedido' | 'sistema' | 'alerta';

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  createdAt: string;   // ISO
  read?: boolean;
  icon?: string;       // ej: 'mdi:whatsapp'
  href?: string;       // opcional para navegar
};

export type AppNotificationsCtx = {
  open: boolean;
  unread: number;
  items: AppNotification[];
  openSheet: () => void;
  closeSheet: () => void;
  push: (n: Omit<AppNotification, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  markRead: (id: string) => void | Promise<void>;
  markAll: () => void | Promise<void>;
  loadMore?: () => Promise<void>;
};

export const AppNotificationsMobileContext = createContext<AppNotificationsCtx>({
  open: false,
  unread: 0,
  items: [],
  openSheet: () => {},
  closeSheet: () => {},
  push: () => {},
  markRead: () => {},
  markAll: () => {},
  loadMore: async () => {},
});

export function useAppNotificationsMobile() {
  return useContext(AppNotificationsMobileContext);
}
