import type { RouteObject } from 'react-router-dom';
import EcommerceHomePage from './pages/HomePage';
import AlmacenPage from './pages/AlmacenPage';
import VentasPage from './pages/VentasPage';

export const ecommerceRoutes: RouteObject[] = [
  { path: '', element: <EcommerceHomePage /> },
  { path: 'almacen', element: <AlmacenPage /> },
  { path: 'ventas', element: <VentasPage /> },
];
