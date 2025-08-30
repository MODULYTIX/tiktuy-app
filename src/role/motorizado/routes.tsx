import type { RouteObject } from 'react-router-dom';
import MotorizadoHomePage from './pages/HomePage';
import PedidosPage from './pages/PedidosPage';
import ReportesPage from './pages/ReportesPage';
import CuadreSaldoPage from '../motorizado/pages/CuadreSaldoPage';


export const motorizadoRoutes: RouteObject[] = [
  { path: '', element: <MotorizadoHomePage /> },
  { path: 'pedidos', element: <PedidosPage /> },
  { path: 'cuadreSaldo', element: <CuadreSaldoPage /> },
  { path: 'reportes', element: <ReportesPage /> },
];
