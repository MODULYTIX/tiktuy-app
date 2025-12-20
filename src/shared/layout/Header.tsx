// src/shared/layout/Header.tsx
import { useMemo, useState } from "react";
import { useAuth } from "@/auth/context/useAuth";
import { Icon } from "@iconify/react";
import { roleConfigs } from "@/shared/constants/roleConfigs";
import NotificationBellIcon from "@/shared/context/notificacionesBell/NotificationBellIcon";
import PerfilUser from "../components/user/PerfilUser";

export default function Header() {
  const { user } = useAuth();
  const role = user?.rol?.nombre || "";
  const config = roleConfigs[role];

  const [openPerfil, setOpenPerfil] = useState(false);

  const displayName = useMemo(
    () =>
      user?.ecommerce_nombre ||
      user?.courier_nombre ||
      `${user?.nombres ?? ""} ${user?.apellidos ?? ""}`.trim() ||
      "Empresa",
    [user]
  );

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    return ((parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "")).toUpperCase();
  }, [displayName]);

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur shadow-sm flex items-center justify-end px-6 fixed top-0 left-0 w-full z-30">
        <div className="flex items-center gap-3">
          {/* Acciones */}
          <div className="flex items-center gap-2">
            {/* Campana */}
            <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition focus-within:ring-2 focus-within:ring-[#1E3A8A]/30">
              <NotificationBellIcon />
            </div>

            {/* Settings */}
            <button
              onClick={() => setOpenPerfil(true)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:text-[#1E3A8A] hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/30"
              aria-label="Perfil"
            >
              <Icon icon="solar:settings-linear" width={22} height={22} />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Usuario */}
          <div className="flex items-center gap-3 max-w-[380px] min-w-0">
            <div className="h-10 w-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">{initials}</span>
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className="text-[13px] font-semibold text-gray-900 truncate"
                title={displayName}
              >
                {displayName}
              </span>

              {config && (
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md ${config.bg} ${config.text}`}
                >
                  {config.icon}
                  {config.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal Perfil */}
      {openPerfil && (
        <PerfilUser onClose={() => setOpenPerfil(false)} />
      )}
    </>
  );
}
