export type NotificationItem = {
  id: string;            // viene del backend como number -> aquí lo guardamos como string
  titulo?: string;       // opcional (backend lo trae)
  mensaje: string;
  leido: boolean;
  fecha: string;         // ISO
  data?: any;            // payload adicional
};

export type NotificationBellContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  addNotification: (noti: NotificationItem) => void;
  markAllAsRead: () => Promise<void> | void;
  markOneAsRead: (id: string) => Promise<void> | void;
  reload: () => Promise<void> | void;
};
