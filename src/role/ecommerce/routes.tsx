import type { RouteObject } from 'react-router-dom';
import EcommerceHomePage from './pages/HomePage';
import AlmacenPage from './pages/AlmacenPage';
import StockPage from './pages/StockProducto';
import PerfilesPage from './pages/PerfilesPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import MovimientosPage from './pages/MovimientosPage';
import PedidosPage from './pages/PedidosPage';

export const ecommerceRoutes: RouteObject[] = [
  { path: '', element: <EcommerceHomePage /> },
  { path: 'almacen', element: <AlmacenPage /> },
  { path: 'stock', element: <StockPage /> },
  { path: 'movimientos', element: <MovimientosPage /> },
  { path: 'pedidos', element: <PedidosPage /> },
  { path: 'perfiles', element: <PerfilesPage /> },
  { path: 'reportes', element: <ReportesPage /> },
  { path: 'configuracion', element: <ConfiguracionPage /> },
];
