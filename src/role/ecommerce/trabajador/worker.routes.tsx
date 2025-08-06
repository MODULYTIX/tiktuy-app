import type { RouteObject } from 'react-router-dom';
import StockPage from '../pages/StockProducto';
import RegistroMovimientoPage from '../pages/MovimientosPage';
import PedidosPage from '../pages/PedidosPage';


export const ecommerceWorkerRoutes: Record<string, RouteObject[]> = {
  stock: [
    {
      path: 'stock',
      element: <StockPage />,
    },
  ],
//   producto: [
//     {
//       path: 'producto',
//       element: <ProductoPage />,
//     },
//   ],
  movimiento: [
    {
      path: 'movimiento',
      element: <RegistroMovimientoPage />,
    },
  ],
  pedidos: [
    {
      path: 'pedidos',
      element: <PedidosPage />,
    },
  ],
};
