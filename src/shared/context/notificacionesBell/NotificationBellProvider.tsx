import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationBellContext } from './NotificationBellContext';
import type { NotificationBellContextType, NotificationItem } from './types/types';
import { useAuth } from '@/auth/context/useAuth';
import {
  fetchNotificaciones,
  markNotificacionLeida,
  markTodasLeidas,
} from '@/services/notificaciones/notificaciones.api';

// Si tienes un helper de socket, úsalo:
// import { getSocket } from '@/realtime/socket';

// Si NO tienes helper, puedes usar este fallback:
import { io, Socket } from 'socket.io-client';
function getSocket(): Socket {
  const token = localStorage.getItem('token');
  return io(import.meta.env.VITE_API_WS_URL, {
    transports: ['websocket'],
    auth: { token },
  });
}

interface Props {
  children: React.ReactNode;
  pageSize?: number; // por si quieres controlar el tamaño
}

export const NotificationBellProvider = ({ children, pageSize = 20 }: Props) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchNotificaciones(token, { page: 1, pageSize });
      // Map del backend -> NotificationItem del front
      const items: NotificationItem[] = res.items.map((n) => ({
        id: String(n.id),
        titulo: n.titulo,
        mensaje: n.mensaje,
        leido: n.leido,
        fecha: n.created_at, // ISO ya viene del backend
        data: n.data,
      }));
      setNotifications(items);
      setUnreadCount(res.unreadTotal ?? items.filter(i => !i.leido).length);
    } catch (e) {
      // opcional: manejar error global
      // console.error('No se pudieron cargar notificaciones', e);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [token, pageSize]);

  // Cargar al montar / cuando cambie el token
  useEffect(() => {
    hasLoadedRef.current = false;
    setNotifications([]);
    setUnreadCount(0);
    if (token) {
      load();
    }
  }, [token, load]);

  // Suscripción Socket.IO a 'notificacion:nueva'
  useEffect(() => {
    if (!token) return;
    try {
      const socket = getSocket();
      socketRef.current = socket;

      const onNew = (payload: any) => {
        // payload puede ser un objeto o un array (según helpers del backend)
        const list = Array.isArray(payload) ? payload : [payload];
        const mapped: NotificationItem[] = list.map((n) => ({
          id: String(n.id),
          titulo: n.titulo,
          mensaje: n.mensaje,
          leido: n.leido ?? false,
          fecha: n.created_at ?? new Date().toISOString(),
          data: n.data,
        }));

        setNotifications((prev) => [...mapped, ...prev]);
        setUnreadCount((prev) => prev + mapped.filter((m) => !m.leido).length);
      };

      socket.on('notificacion:nueva', onNew);
      return () => {
        socket.off('notificacion:nueva', onNew);
        // no desconectamos si socket es global
      };
    } catch {
      // Si no hay socket disponible, ignoramos silenciosamente
    }
  }, [token]);

  const addNotification = useCallback((noti: NotificationItem) => {
    setNotifications(prev => [noti, ...prev]);
    if (!noti.leido) setUnreadCount(prev => prev + 1);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await markTodasLeidas(token);
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadCount(0);
    } catch (e) {
      // opcional: mostrar toast
      // console.error('Error al marcar todas', e);
    }
  }, [token]);

  const markOneAsRead = useCallback(async (id: string) => {
    if (!token) return;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;

    try {
      await markNotificacionLeida(numId, token);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, leido: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      // opcional: toast
      // console.error('Error al marcar una', e);
    }
  }, [token]);

  const value: NotificationBellContextType = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAllAsRead,
    markOneAsRead,
    reload: load,
  };

  return (
    <NotificationBellContext.Provider value={value}>
      {children}
    </NotificationBellContext.Provider>
  );
};
