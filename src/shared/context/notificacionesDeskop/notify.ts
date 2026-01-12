export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type Notification = {
  message: string;
  type: NotificationType;
};
