import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUsersCog,
  FaCashRegister,
  FaBoxes,
  FaTruck,
  FaMotorcycle,
} from 'react-icons/fa';
import { MdDashboard, MdOutlineProductionQuantityLimits, MdSettings } from 'react-icons/md';
import { RiMoneyDollarCircleLine, RiFileChartLine } from 'react-icons/ri';
import { HiOutlineClipboardList } from 'react-icons/hi';

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
      { to: '/panel', label: 'Panel de Control', icon: <MdDashboard /> },
      { to: '/almacen', label: 'Almacén', icon: <FaBoxes /> },
      { to: '/stock', label: 'Stock de productos', icon: <MdOutlineProductionQuantityLimits /> },
      { to: '/ventas', label: 'Ventas', icon: <FaCashRegister /> },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <RiMoneyDollarCircleLine /> },
      { to: '/perfiles', label: 'Perfiles', icon: <FaUsersCog /> },
      { to: '/reportes', label: 'Reportes', icon: <RiFileChartLine /> },
      { to: '/configuracion', label: 'Configuración', icon: <MdSettings /> },
    ],
    courier: [
      { to: '/panel', label: 'Panel de Control', icon: <MdDashboard /> },
      { to: '/logistica', label: 'Pedidos / Logística', icon: <FaTruck /> },
      { to: '/almacen', label: 'Stock / Almacén', icon: <FaBoxes /> },
      { to: '/zonas', label: 'Zonas / Tarifas', icon: <HiOutlineClipboardList /> },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <RiMoneyDollarCircleLine /> },
      { to: '/perfiles', label: 'Perfiles', icon: <FaUsersCog /> },
      { to: '/reportes', label: 'Reportes', icon: <RiFileChartLine /> },
      { to: '/configuracion', label: 'Configuración', icon: <MdSettings /> },
    ],
    motorizado: [
      { to: '/panel', label: 'Panel de Control', icon: <MdDashboard /> },
      { to: '/entregas', label: 'Entregas', icon: <FaMotorcycle /> },
      { to: '/saldos', label: 'Cuadre de Saldos', icon: <RiMoneyDollarCircleLine /> },
      { to: '/reportes', label: 'Reporte', icon: <RiFileChartLine /> },
      { to: '/configuracion', label: 'Configuración', icon: <MdSettings /> },
    ],
  } as const;

  const basePath = user ? `/${user.role}` : '';
  const links = user
    ? linksByRole[user.role].map(link => ({
        ...link,
        to: `${basePath}${link.to}`,
      }))
    : [];

  return (
    <aside
      className={`h-screen bg-[#1b1b77] text-white flex flex-col justify-between shadow-md transition-all duration-300
        ${isOpen ? 'w-64' : 'w-20'} fixed top-0 left-0 z-40`}>
      <div className="flex flex-col h-full p-4">
        {/* Título y botón toggle */}
        <div className="flex items-center justify-between mb-6">
          {isOpen && <h2 className="text-2xl font-bold">Tiktuy</h2>}
          <button onClick={toggle} className="text-white">
            {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2e2ea2] transition ${
                  isActive ? 'bg-[#2e2ea2]' : ''
                }`
              }>
              <span className="text-lg">{icon}</span>
              {isOpen && <span className="text-base">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-4 w-full text-left hover:bg-[#2e2ea2] transition">
        <FaSignOutAlt />
        {isOpen && <span>Cerrar sesión</span>}
      </button>
    </aside>
  );
}
