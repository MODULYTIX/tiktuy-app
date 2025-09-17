// src/shared/layout/Header.tsx
import { useAuth } from '@/auth/context/useAuth';
import { FaUser } from 'react-icons/fa';
import { Icon } from '@iconify/react';
import { roleConfigs } from '@/shared/constants/roleConfigs';
import NotificationBellIcon from '@/shared/context/notificacionesBell/NotificationBellIcon';

export default function Header() {
  const { user } = useAuth();
  const role = user?.rol?.nombre || '';
  const config = roleConfigs[role];

  return (
    <header className="h-16 bg-white shadow flex items-center justify-end px-6 fixed top-0 left-0 w-full z-30 transition-all duration-300">
      <div className="flex items-center gap-6 text-primary justify-center content-center">
        {/* 🔔 Campana outline gris; activa azul al abrir */}
        <NotificationBellIcon
          baseColor="text-gray-600"
          activeColor="text-[#1E3A8A]"
        />

        {/* ⚙ Ícono de configuración outline gris; hover azul */}
        <button
          type="button"
          className="transition-colors text-gray-600 hover:text-[#1E3A8A]"
          aria-label="Configuración"
          title="Configuración"
        >
          {/* Usa variante lineal/outline, no 'broken' para que se vea limpio */}
          <Icon icon="solar:settings-linear" width="22" height="22" />
        </button>

        <div className="h-5 w-px bg-gray-300" />

        {/* Usuario actual */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center">
            <FaUser size={16} />
          </div>
          <div className="flex flex-col leading-tight text-sm">
            <span className="text-[13px] font-medium text-gray-800 truncate max-w-[140px]">
              {user?.nombres || 'Empresa'}
            </span>
            {config && (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-[2px] rounded-sm w-fit ${config.bg} ${config.text}`}
              >
                {config.icon}
                {config.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
