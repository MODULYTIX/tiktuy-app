import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/auth/pages/LoginPage';
import PrivateRoute from './PrivateRoute';
import UnauthorizedPage from '@/shared/pages/UnauthorizedPage';
import AuthGuard from './AuthGuard';

import { ecommerceRoutes } from '@/role/ecommerce/routes';
import { adminRoutes } from '@/role/admin/routes';
import { courierRoutes } from '@/role/courier/routes';
import { motorizadoRoutes } from '@/role/motorizado/routes';

import PrivateLayout from '@/shared/layout/PrivateLayout';

export default function AppRouter() {
  return (
    <Routes>
      {/* Página de login */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <LoginPage />
          </AuthGuard>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <PrivateLayout />
          </PrivateRoute>
        }>
        {adminRoutes.map((route, i) => (
          <Route key={i} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Ecommerce */}
      <Route
        path="/ecommerce"
        element={
          <PrivateRoute allowedRoles={['ecommerce']}>
            <PrivateLayout />
          </PrivateRoute>
        }>
        {ecommerceRoutes.map((route, i) => (
          <Route key={i} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Courier */}
      <Route
        path="/courier"
        element={
          <PrivateRoute allowedRoles={['courier']}>
            <PrivateLayout />
          </PrivateRoute>
        }>
        {courierRoutes.map((route, i) => (
          <Route key={i} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Motorizado */}
      <Route
        path="/motorizado"
        element={
          <PrivateRoute allowedRoles={['motorizado']}>
            <PrivateLayout />
          </PrivateRoute>
        }>
        {motorizadoRoutes.map((route, i) => (
          <Route key={i} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Trabajador (base común) */}
      <Route
        path="/stock"
        element={
          <PrivateRoute allowModulo>
            <PrivateLayout />
          </PrivateRoute>
        }
      />

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
