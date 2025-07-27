import type { RouteObject } from 'react-router-dom';
import AdminHomePage from './pages/HomePage';
import UsuariosPage from './pages/UsuariosPage';
import ReportesPage from './pages/ReportesPage';

export const adminRoutes: RouteObject[] = [
  { path: '', element: <AdminHomePage /> },
  { path: 'usuarios', element: <UsuariosPage /> },
  { path: 'reportes', element: <ReportesPage /> },
];
