import type { RouteObject } from 'react-router-dom';
import AdminHomePage from './pages/HomePage';
import VentasPage from './pages/VentasPage';
import ReportesPage from './pages/ReportesPage';

export const adminRoutes: RouteObject[] = [
  { path: '', element: <AdminHomePage /> },
  { path: 'cuadre-saldo', element: <VentasPage /> },
  { path: 'reportes', element: <ReportesPage /> },
];
