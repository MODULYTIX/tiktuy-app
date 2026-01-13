import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io as socketClient, Socket } from 'socket.io-client';


type Ctx = {
  items: Notificacion[];
  unread: number;
  loading: boolean;
  // control del sheet global
  isOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  // acciones
  recargar: () => Promise<void>;
  marcarUna: (id: number) => Promise<void>;
  marcarTodas: () => Promise<void>;
};

const NotiCtx = createContext<Ctx | null>(null);

/** Proveedor global para notificaciones (API + Socket + estado de sheet) */
export function AppNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unread = useMemo(() => items.reduce((acc, n) => acc + (n.leido ? 0 : 1), 0), [items]);

  const recargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchNotificaciones(token, { page: 1, pageSize: 30 });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Socket: escucha notificacion:nueva
  useEffect(() => {
    if (!token) return;
    const url = import.meta.env.VITE_API_URL as string;
    const s = socketClient(url, { auth: { token } });

    socketRef.current = s;

    s.on('notificacion:nueva', (n: Notificacion) => {
      setItems((prev) => [n, ...prev]);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const marcarUna = useCallback(async (id: number) => {
    if (!token) return;
    await markNotificacionLeida(id, token);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leido: true } : n)));
  }, [token]);

  const marcarTodas = useCallback(async () => {
    if (!token) return;
    await markTodasLeidas(token);
    setItems((prev) => prev.map((n) => ({ ...n, leido: true })));
  }, [token]);

  const openSheet = useCallback(() => setIsOpen(true), []);
  const closeSheet = useCallback(() => setIsOpen(false), []);

  const value: Ctx = {
    items, unread, loading,
    isOpen, openSheet, closeSheet,
    recargar, marcarUna, marcarTodas,
  };

  return <NotiCtx.Provider value={value}>{children}</NotiCtx.Provider>;
}

export function useAppNotificationsMobile() {
  const ctx = useContext(NotiCtx);
  if (!ctx) throw new Error('Wrap components with <AppNotificationsProvider />');
  return ctx;
}
