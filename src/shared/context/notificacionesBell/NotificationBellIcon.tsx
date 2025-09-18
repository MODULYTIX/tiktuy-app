// src/shared/context/notificacionesBell/NotificationBellIcon.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNotificationBell } from './useNotificationBell';
import { Icon } from '@iconify/react';

function formatRelativeDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} minutos`;
  if (diffHr < 24) return `Hace ${diffHr} horas`;
  if (diffDay === 1) return 'Hace 1 día';
  return `Hace ${diffDay} días`;
}

type Props = {
  className?: string;
  activeColor?: string;
  baseColor?: string;
};

type Noti = {
  id: number | string;
  titulo?: string;
  mensaje?: string;
  fecha: string;
  leido?: boolean;
  canal?: 'APP' | 'WHATSAPP' | 'EMAIL';
  tipo?: 'PEDIDO' | 'SISTEMA' | 'INVITACION' | 'ALERTA';
  data?: any;
};

function buildHrefFromData(data: any): string | undefined {
  if (!data) return undefined;
  if (data.link || data.url) return data.link || data.url;
  if (data.cta?.route) {
    const params = data.cta.params
      ? '?' + new URLSearchParams(data.cta.params as Record<string, string>).toString()
      : '';
    return `${data.cta.route}${params}`;
  }
  return undefined;
}

function getVisualByNotification(n: Noti) {
  const title = (n.titulo || '').toLowerCase();

  // 1) Prioriza canal
  if (n.canal === 'WHATSAPP') {
    return { icon: 'mdi:whatsapp', className: 'text-green-500' };
  }
  if (n.canal === 'EMAIL') {
    return { icon: 'mdi:email-outline', className: 'text-indigo-500' };
  }

  // 2) Luego por tipo (enum)
  if (n.tipo === 'INVITACION') {
    // “Ecommerce - {Nombre}” (asociación) o “Almacenero aceptó la invitación”
    if (title.includes('acept') || title.includes('almacener') || title.includes('almacenero')) {
      return { icon: 'mdi:account-check-outline', className: 'text-blue-600' };
    }
    if (title.includes('ecommerce')) {
      return { icon: 'mdi:account', className: 'text-blue-600' };
    }
    // fallback genérico de invitaciones
    return { icon: 'mdi:email-fast-outline', className: 'text-blue-600' };
  }

  if (n.tipo === 'ALERTA') {
    if (title.includes('bajo stock') || title.includes('stock bajo')) {
      return { icon: 'mdi:alert-circle-outline', className: 'text-orange-500' };
    }
    return { icon: 'mdi:alert-outline', className: 'text-orange-500' };
  }

  if (n.tipo === 'PEDIDO') {
    if (title.includes('incremento') || title.includes('semanal') || title.includes('pedidos')) {
      return { icon: 'mdi:trending-up', className: 'text-blue-600' };
    }
    return { icon: 'mdi:package-variant', className: 'text-blue-600' };
  }

  // 3) Palabras clave (por si no llega tipo/canal)
  if (title.includes('whatsapp')) {
    return { icon: 'mdi:whatsapp', className: 'text-green-500' };
  }
  if (title.includes('ecommerce')) {
    return { icon: 'mdi:account', className: 'text-blue-600' };
  }
  if (title.includes('acept')) {
    return { icon: 'mdi:account-check-outline', className: 'text-blue-600' };
  }
  if (title.includes('bajo stock') || title.includes('stock')) {
    return { icon: 'mdi:alert-circle-outline', className: 'text-orange-500' };
  }
  if (title.includes('movimiento de stock') || title.includes('movimiento') || title.includes('almacén') || title.includes('almacen')) {
    return { icon: 'mdi:truck-outline', className: 'text-blue-600' };
  }
  if (title.includes('incremento') || title.includes('semanal') || title.includes('pedidos')) {
    return { icon: 'mdi:trending-up', className: 'text-blue-600' };
  }

  // 4) Fallback
  return { icon: 'mdi:bell-outline', className: 'text-blue-600' };
}

const NotificationBellIcon = ({
  className = '',
  activeColor = 'text-[#1E3A8A]',
  baseColor = 'text-gray-600',
}: Props) => {
  const { unreadCount, notifications, markAllAsRead, loading } = useNotificationBell();
  const [open, setOpen] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllAsRead();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggle}
        className={`relative transition-colors ${open ? activeColor : baseColor} hover:${activeColor}`}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Icon icon="mdi:bell-outline" width="22" height="22" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[3px] inline-flex items-center justify-center
                       text-[10px] font-bold text-white bg-red-600 rounded-full leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded-lg border bg-white shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-sm font-semibold">Notificaciones</h3>
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => (window.location.href = '/notificaciones')}
              >
                Ver más
              </button>
            </div>

            <div>
              {loading ? (
                <p className="text-gray-500 text-sm p-3">Cargando…</p>
              ) : notifications.length === 0 ? (
                <p className="text-gray-500 text-sm p-3">No hay notificaciones</p>
              ) : (
                notifications.map((n: Noti) => {
                  const { icon, className: iconClass } = getVisualByNotification(n);
                  const href = buildHrefFromData(n?.data);

                  const content = (
                    <div
                      className="flex gap-3 items-start px-4 py-3 border-b last:border-none hover:bg-gray-50 cursor-pointer"
                      key={n.id}
                    >
                      <Icon icon={icon} className={`text-xl ${iconClass}`} />
                      <div className="flex-1 min-w-0">
                        {n.titulo && <p className="font-medium text-sm truncate">{n.titulo}</p>}
                        <p className="text-gray-600 text-xs truncate">{n.mensaje}</p>
                        <span className="text-[11px] text-gray-400">{formatRelativeDate(n.fecha)}</span>
                      </div>
                      {!n.leido && <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />}
                    </div>
                  );

                  return href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={n.id}
                      className="block"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBellIcon;
