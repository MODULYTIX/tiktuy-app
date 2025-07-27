import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import type { JSX } from 'react';

type Props = {
  children: JSX.Element;
  allowedRoles?: string[];
};

export default function PrivateRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
