import type { RouteObject } from 'react-router-dom';
import AdminHomePage from './pages/HomePage';
import CuadreSaldoPage from './pages/CuadreSaldoPage';
import ReportesPage from './pages/ReportesPage';

export const adminRoutes: RouteObject[] = [
  { path: '', element: <AdminHomePage /> },
  { path: 'cuadre-saldo', element: <CuadreSaldoPage /> },
  { path: 'reportes', element: <ReportesPage /> },
];
