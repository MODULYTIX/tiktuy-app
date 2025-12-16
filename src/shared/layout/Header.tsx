// src/shared/layout/Header.tsx
import { useMemo } from "react";
import { useAuth } from "@/auth/context/useAuth";
import { Icon } from "@iconify/react";
import { roleConfigs } from "@/shared/constants/roleConfigs";
import NotificationBellIcon from "@/shared/context/notificacionesBell/NotificationBellIcon";

export default function Header() {
  const { user } = useAuth();
  const role = user?.rol?.nombre || "";
  const config = roleConfigs[role];

  const displayName = useMemo(
    () =>
      user?.ecommerce_nombre ||
      user?.courier_nombre ||
      user?.motorizado_courier_nombre ||
      "Empresa",
    [user]
  );

  // TODO: conecta esto a tu estado real (por ejemplo unreadCount > 0)
  const hasUnread = false;

  const initials = useMemo(() => {
    const parts = String(displayName).trim().split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [displayName]);

  return (
    <header className="h-16 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm flex items-center justify-end px-6 fixed top-0 left-0 w-full z-30">
      <div className="flex items-center gap-3">
        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Campana (centrada + animación si hay unread) */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              className={[
                "relative inline-flex items-center justify-center",
                "h-10 w-10 rounded-full",
                "text-gray-600 hover:text-[#1E3A8A]",
                "hover:bg-gray-100/80 active:bg-gray-100",
                "transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/30",
                // shake sutil si hay notificaciones
                hasUnread ? "[animation:wiggle_1.2s_ease-in-out_infinite]" : "",
              ].join(" ")}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              {/* IMPORTANTE: este wrapper fuerza centrado vertical/horizontal */}
              <span className="flex items-center justify-center leading-none">
                <NotificationBellIcon
                  baseColor="text-gray-600"
                  activeColor="text-[#1E3A8A]"
                />
              </span>

              {/* Dot + ping cuando hay unread */}
              {hasUnread && (
                <span className="absolute top-[9px] right-[9px]">
                  <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                </span>
              )}
            </button>

            {/* keyframes sin tocar tailwind.config (arbitrary) */}
            <style>{`
              @keyframes wiggle {
                0%, 100% { transform: rotate(0deg); }
                15% { transform: rotate(-8deg); }
                30% { transform: rotate(8deg); }
                45% { transform: rotate(-6deg); }
                60% { transform: rotate(6deg); }
                75% { transform: rotate(-3deg); }
              }
            `}</style>
          </div>

          {/* Settings */}
          <button
            type="button"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:text-[#1E3A8A] hover:bg-gray-100/80 active:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/30"
            aria-label="Configuración"
            title="Configuración"
          >
            <Icon icon="solar:settings-linear" width="22" height="22" />
          </button>
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-200" />

        {/* Usuario */}
        <div className="flex items-center gap-3 max-w-[380px] w-full min-w-0">
          {/* Avatar */}
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold leading-none">
              {initials}
            </span>
          </div>

          {/* Texto */}
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span
              className="text-[13px] font-semibold text-gray-900 truncate"
              title={displayName} // tooltip con el nombre completo
            >
              {displayName}
            </span>

            {config && (
              <span
                className={[
                  "mt-1 inline-flex items-center gap-1.5 w-fit",
                  "text-[11px] font-medium px-2 py-0.5 rounded-md",
                  config.bg,
                  config.text,
                ].join(" ")}
              >
                <span className="flex items-center justify-center leading-none">
                  {config.icon}
                </span>
                {config.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
