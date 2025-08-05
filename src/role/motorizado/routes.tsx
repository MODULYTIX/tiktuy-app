import type { RouteObject } from 'react-router-dom';
import MotorizadoHomePage from './pages/HomePage';
import PedidosPage from './pages/PedidosPage';
import ReportesPage from './pages/ReportesPage';


export const motorizadoRoutes: RouteObject[] = [
  { path: 'panel', element: <MotorizadoHomePage /> },
  { path: 'pedidos', element: <PedidosPage /> },
  { path: 'reportes', element: <ReportesPage /> },
];
