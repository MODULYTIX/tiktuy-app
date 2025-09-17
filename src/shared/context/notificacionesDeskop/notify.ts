export type NotificationType = 'success' | 'error' | 'info';

export type Notification = {
  message: string;
  type: NotificationType;
};
