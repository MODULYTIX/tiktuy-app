import type { RouteObject } from 'react-router-dom';
import CourierHomePage from './pages/HomePage';
import AlmacenPage from './pages/AlmacenPage';
import StockPage from './pages/StockProducto';
import VentasPage from './pages/VentasPage';
import CuadreSaldoPage from './pages/CuadreSaldoPage';
import PerfilesPage from './pages/PerfilesPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';


export const courierRoutes: RouteObject[] = [
  { path: '', element: <CourierHomePage /> },
  { path: 'almacen', element: <AlmacenPage /> },
  { path: 'stock', element: <StockPage /> },
  { path: 'ventas', element: <VentasPage /> },
  { path: 'cuadresaldo', element: <CuadreSaldoPage /> },
  { path: 'perfiles', element: <PerfilesPage /> },
  { path: 'reportes', element: <ReportesPage /> },
  { path: 'configuracion', element: <ConfiguracionPage /> },
];
