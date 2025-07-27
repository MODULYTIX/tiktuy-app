import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import type { JSX } from 'react';

export const RoleGuard = ({ children, role }: { children: JSX.Element; role: string }) => {
  const { user } = useAuth();

  if (!user || user.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
};
