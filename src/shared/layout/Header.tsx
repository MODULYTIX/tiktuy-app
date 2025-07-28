import { useAuth } from '@/auth/context/useAuth';
import { FaBell, FaCog, FaUser } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
}

export default function Header({ isOpen }: Props) {
  const { user } = useAuth();

  return (
    <header
      className={`h-16 bg-white shadow flex items-center justify-end px-6 fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
        isOpen ? 'ml-64' : 'ml-20'
      }`}
    >
      <div className="flex items-center gap-6 text-[#1b1b77]">
        <button type="button" className="hover:text-blue-600 transition">
          <FaBell size={18} />
        </button>
        <button type="button" className="hover:text-blue-600 transition">
          <FaCog size={18} />
        </button>

        <div className="h-5 w-px bg-gray-300" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1b1b77] text-white rounded-full flex items-center justify-center">
            <FaUser size={16} />
          </div>
          <div className="flex flex-col leading-tight text-sm">
            <span className="text-[13px] font-medium text-gray-800 truncate max-w-[140px]">
              { user?.email || 'Empresa'}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-[1px] rounded capitalize w-fit">
              {user?.role || 'Rol'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
