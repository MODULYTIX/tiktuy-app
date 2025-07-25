import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/auth/pages/LoginPage';
import AdminHomePage from '@/role/admin/pages/HomePage';
import PrivateRoute from './PrivateRoute';
import EcommerceHomePage from '@/role/ecommerce/pages/HomePage';
import MotorizadoHomePage from '@/role/motorizado/pages/HomePage';
import CourierHomePage from '@/role/courier/pages/HomePage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminHomePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/ecommerce"
        element={
          <PrivateRoute>
            <EcommerceHomePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/motorizado"
        element={
          <PrivateRoute>
            <MotorizadoHomePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/courier"
        element={
          <PrivateRoute>
            <CourierHomePage />
          </PrivateRoute>
        }
      />

      {/* Redirección por defecto si la ruta no existe */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
