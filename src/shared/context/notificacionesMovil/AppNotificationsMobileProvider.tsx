// src/shared/context/notificacionesMovil/AppNotificationsMobileProvider.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { io as socketClient, Socket } from 'socket.io-client';
import { useAuth } from '@/auth/context/useAuth';
import {
  fetchNotificaciones,
  markNotificacionLeida,
  markTodasLeidas,
} from '@/services/notificaciones/notificaciones.api';
import type { Notificacion } from '@/services/notificaciones/notificaciones.types';
import {
  AppNotificationsMobileContext,
  type AppNotification,
} from './appNotificationsMobileContext';

// ----- helpers de mapeo -----
function canalToIcon(canal?: Notificacion['canal']): string {
  switch (canal) {
    case 'WHATSAPP': return 'mdi:whatsapp';
    case 'EMAIL': return 'mdi:email-outline';
    default: return 'mdi:bell-outline';
  }
}
function tipoToType(tipo?: Notificacion['tipo']): AppNotification['type'] {
  switch (tipo) {
    case 'PEDIDO': return 'pedido';
    case 'ALERTA': return 'alerta';
    case 'SISTEMA':
    case 'INVITACION':
    default: return 'sistema';
  }
}
function mapNotiToApp(n: Notificacion): AppNotification {
  return {
    id: String(n.id),
    type: tipoToType(n.tipo),
    title: n.titulo,
    body: n.mensaje,
    createdAt: n.created_at,
    read: n.leido,
    icon: canalToIcon(n.canal),
    href: n.data?.href ?? n.data?.link ?? undefined,
  };
}

export function AppNotificationsMobileProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // paginación básica
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const totalRef = useRef(0);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);

  // push local (para usos internos)
  const push = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
      const id = n.id ?? crypto.randomUUID();
      const createdAt = n.createdAt ?? new Date().toISOString();
      setItems((prev) => [{ id, createdAt, read: false, ...n }, ...prev]);
    },
    []
  );

  // Carga inicial
  const loadPage = useCallback(async (targetPage: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchNotificaciones(token, { page: targetPage, pageSize });
      totalRef.current = res.total;

      const mapped = res.items.map(mapNotiToApp);
      if (targetPage === 1) {
        setItems(mapped);
      } else {
        // evitar duplicados por socket + paginación
        setItems((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          const merged = [...prev, ...mapped.filter((m) => !existing.has(m.id))];
          return merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        });
      }
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPage(1); }, [loadPage]);

  // loadMore
  const loadMore = useCallback(async () => {
    const have = items.length;
    if (have >= totalRef.current) return;
    await loadPage(page + 1);
  }, [items.length, page, loadPage]);

  // Socket
  useEffect(() => {
    if (!token) return;
    const url = import.meta.env.VITE_API_URL as string;
    const s: Socket = socketClient(url, { auth: { token } });

    s.on('notificacion:nueva', (n: Notificacion) => {
      setItems((prev) => {
        const mapped = mapNotiToApp(n);
        if (prev.some((p) => p.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
      totalRef.current += 1;
    });
    return () => { s.disconnect(); };
  }, [token]);

  // Marcar una
  const markRead = useCallback(async (id: string) => {
    if (!token) return;
    await markNotificacionLeida(Number(id), token);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  }, [token]);

  // Marcar todas
  const markAll = useCallback(async () => {
    if (!token) return;
    await markTodasLeidas(token);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }, [token]);

  // Esc + bloqueo de scroll cuando está abierto (tu UX original)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('overflow-hidden');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('overflow-hidden');
    };
  }, [open, closeSheet]);

  return (
    <AppNotificationsMobileContext.Provider
      value={{
        open,
        unread,
        items,
        openSheet,
        closeSheet,
        push,
        markRead,
        markAll,
        loadMore,
      }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSheet}
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 top-50 bg-white  shadow-2xl overflow-hidden animate-[slideDown_160ms_ease-out]">
            <div className="px-4 pt-4 pb-3 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:bell-outline" className="text-xl text-[#1E3A8A]" />
                  <h2 className="text-[15px] font-semibold text-[#1E3A8A]">Notificaciones</h2>
                  {unread > 0 && (
                    <span className="ml-1 text-[11px] text-white bg-red-500 rounded-full px-2 py-0.5">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      onClick={markAll}
                      className="text-[12px] text-[#1E3A8A] px-2 py-1 rounded hover:bg-[#EEF4FF]"
                    >
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={closeSheet}
                    className="text-[12px] text-[#1E3A8A] px-2 py-1 rounded hover:bg-[#EEF4FF]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto divide-y">
              {loading && (
                <div className="p-4 text-sm text-gray-500">Cargando…</div>
              )}

              {!loading && items.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No tienes notificaciones</div>
              )}

              {!loading && items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="w-full px-4 py-3 text-left flex gap-3 items-start bg-white hover:bg-gray-50"
                >
                  <div className="mt-0.5 text-xl">
                    <Icon icon={n.icon ?? 'mdi:information-outline'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className={`font-semibold text-[14px] ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="ml-auto h-2 w-2 rounded-full bg-red-500 mt-1.5" />}
                    </div>
                    <p className="text-[13px] text-gray-600 truncate">{n.body}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}

              {/* Load more */}
              {!loading && items.length < (totalRef.current || 0) && (
                <div className="p-3">
                  <button
                    onClick={loadMore}
                    className="w-full text-[13px] text-[#1E3A8A] border border-[#1E3A8A] rounded-md py-2 hover:bg-[#EEF4FF]"
                  >
                    Ver más
                  </button>
                </div>
              )}
            </div>
          </div>

          <style>{`@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}`}</style>
        </div>
      )}
    </AppNotificationsMobileContext.Provider>
  );
}
