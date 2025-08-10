import type { RouteObject } from 'react-router-dom';
import CourierHomePage from './pages/HomePage';
import StockPage from './pages/StockProducto';
import MovimientosPage from './pages/MovimientosPage';
import CuadreSaldoPage from './pages/CuadreSaldoPage';
import PerfilesPage from './pages/PerfilesPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import ZonasPage from './pages/ZonasPage';
import PedidosPage from './pages/PedidosPage';
import AlmacenPage from './pages/AlmacenPage';

export const courierRoutes: RouteObject[] = [
  { path: '', element: <CourierHomePage /> },
  { path: 'almacen', element: <AlmacenPage /> },
  { path: 'stock', element: <StockPage /> },
  { path: 'movimientos', element: <MovimientosPage /> },
  { path: 'pedidos', element: <PedidosPage /> },
  { path: 'zonas', element: <ZonasPage /> },
  { path: 'cuadresaldo', element: <CuadreSaldoPage /> },
  { path: 'perfiles', element: <PerfilesPage /> },
  { path: 'reportes', element: <ReportesPage /> },
  { path: 'configuracion', element: <ConfiguracionPage /> },
];
