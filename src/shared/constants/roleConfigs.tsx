import type { JSX } from 'react';
import { Icon } from '@iconify/react';
import { FaUserShield, FaMotorcycle } from 'react-icons/fa';

export const roleConfigs: Record<
  string,
  { label: string; icon: JSX.Element; bg: string; text: string }
> = {
  admin: {
    label: 'Administrador',
    icon: <FaUserShield className="text-[#1b1b77]" />,
    bg: 'bg-[#e6e9fa]',
    text: 'text-[#1b1b77]',
  },
  ecommerce: {
    label: 'Ecommerce',
    icon: <Icon icon="lucide:store" width="12" height="12" />,
    bg: 'bg-[#F3E8FF]',
    text: 'text-[#6B21A8]',
  },
  courier: {
    label: 'Courier',
    icon: <Icon icon="clarity:truck-line" width="12" height="12" />,
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  motorizado: {
    label: 'Motorizado',
    icon: <FaMotorcycle className="text-orange-600" />,
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
};
