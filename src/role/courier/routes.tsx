import type { RouteObject } from 'react-router-dom';
import CourierHomePage from './pages/HomePage';
import LogisticaPage from './pages/LogisticaPage';
import ZonasPage from './pages/ZonasPage';


export const courierRoutes: RouteObject[] = [
  { path: '', element: <CourierHomePage /> },
  { path: 'logistica', element: <LogisticaPage /> },
  { path: 'zonas', element: <ZonasPage /> },
];
