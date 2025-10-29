// src/router/AppRouter.tsx
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
import RegistroInvitacionPage from '@/role/courier/pages/RegistroInvitacionPage';
import CrearPasswordPage from '@/role/courier/pages/CrearPasswordPage';
import AceptarInvitacionSedePage from '@/shared/components/ecommerce/CrearPasswordSedePage';

// rutas publicas
import PublicLayout from '@/role/user/layout/PublicLayout';
import HomePublicPage from '@/role/user/pages/HomePublicPage';
import RegistroInvitacionCourier from '@/role/admin/pages/RegistroInvitacionCourier';
import RegistroInvitacionEcommerce from '@/role/admin/pages/RegistroInvitacionEcommerce';

export default function AppRouter() {
  return (
    <Routes>
      {/* Pública: Landing en / */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <HomePublicPage />
          </PublicLayout>
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          <AuthGuard>
            <LoginPage />
          </AuthGuard>
        }
      />

      {/* Público: aceptar invitación de sede */}
      <Route path="/invitar-sede" element={<AceptarInvitacionSedePage />} />

      {/* Flujos abiertos que ya tenías */}
      <Route path="/registro-invitacion" element={<RegistroInvitacionPage />} />
      <Route path="/crear-password" element={<CrearPasswordPage />} />
      <Route path="/crear-password-motorizado" element={<CrearPasswordPage />} />
      {/* Alias backend */}
      <Route path="/crear-password-repartidor" element={<CrearPasswordPage />} />
      <Route path="/registro-invitacion-motorizado" element={<RegistroInvitacionPage />} />
      {/* Courier */}
      <Route path="/registro-invitacion-courier" element={<RegistroInvitacionCourier />} />
      {/* Ecommmerce */}
      <Route path="/registro-invitacion-ecommerce" element={<RegistroInvitacionEcommerce />} />

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

      {/* Ecommerce + Representante 👈 AQUI EL CAMBIO */}
      <Route
        path="/ecommerce"
        element={
          <PrivateRoute allowedRoles={['ecommerce', 'representante']}>
            <PrivateLayout />
          </PrivateRoute>
        }>
        {ecommerceRoutes.map((route, i) => (
          <Route key={i} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Alias opcional para /representante */}
      <Route path="/representante/*" element={<Navigate to="/ecommerce" replace />} />

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

      {/* Trabajador */}
      <Route
        path="/trabajador"
        element={
          <PrivateRoute allowedRoles={['trabajador']}>
            <PrivateLayout />
          </PrivateRoute>
        }>
        {ecommerceRoutes.map((route, i) => (
          <Route key={i} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
