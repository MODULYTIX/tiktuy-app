// routes/ecommerceWorkerRoutes.ts
import type { RouteObject } from 'react-router-dom'
import StockPage from '../pages/StockProducto'
import RegistroMovimientoPage from '../pages/MovimientosPage'
import PedidosPage from '../pages/PedidosPage'

export const ecommerceWorkerRoutes: Record<string, RouteObject[]> = {
  'Stock de productos': [
    { path: 'stock', element: <StockPage /> },
  ],
  'Movimientos': [
    { path: 'movimientos', element: <RegistroMovimientoPage /> },
  ],
  'Gestion de pedidos': [
    { path: 'pedidos', element: <PedidosPage /> },
  ],
}
