import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';  
import { useAuth } from '@/auth/context/useAuth';
import {
  FaBars,
  FaSignOutAlt,
  FaUsersCog,
  FaCashRegister,
  FaBoxes,
  FaTruck,
  FaMotorcycle,
} from 'react-icons/fa';
import {
  MdDashboard,
  MdOutlineProductionQuantityLimits,
  MdSettings,
} from 'react-icons/md';
import { RiMoneyDollarCircleLine, RiFileChartLine } from 'react-icons/ri';
import { HiOutlineClipboardList } from 'react-icons/hi';

import LOGOTIKTUY from '@/assets/logos/logo-tiktuy-sidebar.webp';
import PanelRightOpenIcon from '@/assets/icons/PanelRightOpen';
import { FaGroupArrowsRotate, FaMapLocationDot } from 'react-icons/fa6';

interface Props {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const linksByRole = {
    admin: [
      { to: '/panel', label: 'Panel de Control', icon: <MdDashboard /> },
      { to: '/ventas', label: 'Ventas', icon: <FaCashRegister /> },
      { to: '/almacen', label: 'Stock / Almacén', icon: <FaBoxes /> },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <RiMoneyDollarCircleLine /> },
      { to: '/perfiles', label: 'Perfiles', icon: <FaUsersCog /> },
      { to: '/reportes', label: 'Reportes', icon: <RiFileChartLine /> },
      { to: '/configuracion', label: 'Configuración', icon: <MdSettings /> },
    ],
    ecommerce: [
      { to: '/panel', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" /> },
      { to: '/almacen', label: 'Almacén', icon: <Icon icon="hugeicons:warehouse" width="24" height="24" />, modulo: 'stock' },
      { to: '/stock', label: 'Stock de productos', icon: <Icon icon="vaadin:stock" width="24" height="24" />, modulo: 'stock' },
      { to: '/movimientos', label: 'Movimientos', icon: <Icon icon="icon-park-outline:cycle-movement" width="24" height="24" />, modulo: 'movimiento' },
      { to: '/pedidos', label: 'Gestion de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" />, modulo: 'pedidos' },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="24" height="24" /> },
      { to: '/perfiles', label: 'Perfiles', icon: <Icon icon="hugeicons:access" width="24" height="24" /> },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="24" height="24" /> },
    ],
    courier: [
      { to: '/panel', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" /> },
      { to: '/almacen', label: 'Almacén', icon: <Icon icon="hugeicons:warehouse" width="24" height="24" />, modulo: 'pedidos'},
      { to: '/stock', label: 'Stock de Productos', icon: <Icon icon="vaadin:stock" width="24" height="24" />, modulo: 'stock' },
      { to: '/movimientos', label: 'Movimientos', icon: <Icon icon="icon-park-outline:cycle-movement" width="24" height="24" /> },
      { to: '/pedidos', label: 'Gestión de Pedidos', icon: <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" /> },
      { to: '/zonas', label: 'Zonas / Tarifas', icon: <Icon icon="solar:point-on-map-broken" width="24" height="24" /> },
      { to: '/cuadresaldo', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="24" height="24" /> },
      { to: '/perfiles', label: 'Perfiles', icon: <Icon icon="hugeicons:access" width="24" height="24" /> },
      { to: '/reportes', label: 'Reportes', icon: <Icon icon="carbon:report-data" width="24" height="24" /> },
    ],
    motorizado: [
      { to: '/panel', label: 'Panel de Control', icon: <Icon icon="lucide:layout-panel-top" width="24" height="24" /> },
      { to: '/pedidos', label: 'Entregas', icon: <Icon icon="lsicon:shopping-cart-filled" width="24" height="24" />, modulo: 'entregas' },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <Icon icon="prime:wallet" width="24" height="24" /> },
      { to: '/reportes', label: 'Reporte', icon: <Icon icon="carbon:report-data" width="24" height="24" /> },
    ],
  } as const;

  const basePath = user?.rol?.nombre ? `/${user.rol.nombre}` : '';
  let links = user?.rol?.nombre ? linksByRole[user.rol.nombre as keyof typeof linksByRole] : [];


  // 🔒 Si es trabajador, filtramos los módulos asignados
  const perfilTrabajador = user?.trabajador?.perfil

  if (perfilTrabajador?.modulo_asignado) {
    const modulosAsignados = perfilTrabajador.modulo_asignado
      .split(',')
      .map((m) => m.trim());

    links = links.filter((link) =>
      link.modulo ? modulosAsignados.includes(link.modulo) : false
    );
  }


  // Rutas completas
  links = links.map((link) => ({
    ...link,
    to: `${basePath}${link.to}`,
  }));


  return (
    <aside
      className={`h-screen bg-white text-primary flex flex-col justify-between shadow-md
    fixed top-0 left-0 z-40 overflow-hidden transition-all duration-500 ease-in-out
    ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        {/* Header con botón */}
        <div className="flex items-center justify-between px-4 py-5 transition-all duration-500">
          {isOpen && (
            <img
              src={LOGOTIKTUY}
              alt="logo tiktuy"
              className="object-contain"
              draggable={false}
            />
          )}
          <button onClick={toggle} className="text-primary">
            {isOpen ? (
              <Icon icon="octicon:sidebar-expand-24" width="25" height="25" />
            ) : (
              <Icon icon="octicon:sidebar-collapse-24" width="25" height="25" />
            )}
          </button>
        </div>

        {/* Enlaces */}
        <nav className="flex flex-col flex-1 py-4 px-3 space-y-1">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 text-sm font-medium
            hover:bg-[#f0f3ff] hover:text-primary ${isActive ? 'bg-[#EEf4FF] text-primary' : 'text-primary'
                }`
              }>
              <span className="text-lg">{icon}</span>
              <span
                className={`transition-all duration-300 ease-in-out origin-left ${isOpen ? 'opacity-100 ml-1' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4">
          <p
            className={`text-xs text-gray-400 mb-2 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
              }`}>
            Versión 1.0
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition font-medium">
            <FaSignOutAlt />
            <span
              className={`transition-all duration-300 ease-in-out origin-left ${isOpen ? 'opacity-100 ml-1' : 'opacity-0 w-0 overflow-hidden'
                }`}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
