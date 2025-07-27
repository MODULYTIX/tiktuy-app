import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/useAuth';
import type { JSX } from 'react';

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  return children;
};
