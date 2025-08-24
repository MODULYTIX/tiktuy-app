// src/layouts/Navbar.tsx
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '@/auth/context/useAuth';
import LOGOTIKTUY from '@/assets/logos/logo-tiktuy-sidebar.webp';
import type { JSX } from 'react';

type LinkItem = { to: string; label: string; icon: JSX.Element; modulo?: string };

interface Props {
  isOpen: boolean;       // controla si mostrar labels en el drawer (puedes reutilizarlo)
  toggle: () => void;    // abre/cierra el drawer
  open: boolean;         // estado del drawer móvil
  setOpen: (v: boolean) => void;
}

export default function Navbar({ isOpen,  open, setOpen }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // ====== misma lógica de links que tu Sidebar ======
  const linksByRole: Record<string, LinkItem[]> = {
    admin: [
      { to: '/', label: 'Panel de Control', icon: <Icon icon="mdi:view-dashboard" width="20" height="20" /> },
      { to: '/ventas', label: 'Gestión de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="20" height="20" /> },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="20" height="20" /> },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="20" height="20" /> },
    ],
    ecommerce: [
      { to: '/', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="20" height="20" /> },
      { to: '/pedidos', label: 'Gestión de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="20" height="20" />, modulo: 'pedidos' },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="20" height="20" /> },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="20" height="20" /> },
    ],
    courier: [
      { to: '/', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="20" height="20" /> },
      { to: '/pedidos', label: 'Gestión de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="20" height="20" /> },
      { to: '/cuadresaldo', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="20" height="20" /> },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="20" height="20" /> },
    ],
    motorizado: [
      { to: '/panel', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="20" height="20" /> },
      { to: '/pedidos', label: 'Gestión de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="20" height="20" /> },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="20" height="20" /> },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="20" height="20" /> },
    ],
  };

  const basePath = user?.rol?.nombre ? `/${user.rol.nombre}` : '';
  let links: LinkItem[] = [];

  if (user?.rol?.nombre === 'trabajador') {
    links = [
      { to: '/panel', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="20" height="20" /> },
      { to: '/pedidos', label: 'Gestión de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="20" height="20" />, modulo: 'pedidos' },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="20" height="20" />, modulo: 'saldos' },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="20" height="20" />, modulo: 'reportes' },
    ];
    const modulosAsignados = user?.perfil_trabajador?.modulo_asignado?.split(',')?.map(m => m.trim());
    links = modulosAsignados ? links.filter(l => modulosAsignados.includes(l.modulo ?? '')) : [];
  } else if (user?.rol?.nombre && user.rol.nombre in linksByRole) {
    links = linksByRole[user.rol.nombre];
  }

  links = links.map(l => ({ ...l, to: `${basePath}${l.to}` }));

  // ====== UX: cerrar con ESC, bloquear scroll cuando open ======
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.classList.add('overflow-hidden');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('overflow-hidden');
    };
  }, [open, setOpen]);

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full bg-white">
      {/* Barra superior */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {/* Hamburguesa */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="inline-flex items-center justify-center rounded-md p-2 text-[#1E3A8A]"
        >
          <Icon icon="mdi:menu" width="26" height="26" />
        </button>

        {/* Logo centrado */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <img
            src={LOGOTIKTUY}
            alt="TIKTUY"
            className="h-7 w-auto object-contain"
            draggable={false}
          />
        </div>

        {/* Perfil redondo a la derecha */}
        <button
          aria-label="Perfil"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#1E3A8A] to-[#0B2B6B] text-white shadow"
        >
          <Icon icon="mdi:account" width="18" height="18" />
        </button>
      </div>

      {/* Drawer lateral (menú) */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            {/* Header del panel */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <img src={LOGOTIKTUY} alt="logo" className="h-7 w-auto" />
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-[#1E3A8A]"
                aria-label="Cerrar menú"
              >
                <Icon icon="mdi:close" width="22" height="22" />
              </button>
            </div>

            {/* Links verticales con “píldora” activa */}
            <nav className="no-scrollbar h-[calc(100%-64px)] overflow-y-auto px-3 py-3">
              <ul className="space-y-1">
                {links.map(({ to, label, icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
                         hover:bg-[#f0f3ff] hover:text-[#1E3A8A]
                         ${isActive ? 'bg-[#EEF4FF] text-[#1E3A8A]' : 'text-[#1E3A8A]'}`
                      }
                    >
                      <span className="text-[18px]">{icon}</span>
                      <span className={`${isOpen ? 'opacity-100' : 'opacity-90'}`}>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
