import type { RouteObject } from 'react-router-dom';
import MotorizadoHomePage from './pages/HomePage';
import EntregasPage from './pages/EntregasPage';
import ReportesPage from './pages/ReportesPage';


export const motorizadoRoutes: RouteObject[] = [
  { path: '', element: <MotorizadoHomePage /> },
  { path: 'entregas', element: <EntregasPage /> },
  { path: 'reportes', element: <ReportesPage /> },
];
