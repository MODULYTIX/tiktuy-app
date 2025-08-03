export type NotificationItem = {
  id: string;
  mensaje: string;
  leido: boolean;
  fecha: string;
};

export type NotificationBellContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (noti: NotificationItem) => void;
  markAllAsRead: () => void;
};
