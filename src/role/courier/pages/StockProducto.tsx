import StockPedidoFilterCourier from '@/shared/components/courier/pedido/SockPedidoCourierFilter';
import TableStockProductoCourier from '@/shared/components/courier/stockProducto/TableStockProductoCourier';

export default function StockPage() {
  return (
    <section className="mt-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Stock de Producto
            </h1>
            <p className="text-gray-500">Control de stock y movimiento</p>
          </div>
        </div>
        <div className="my-8">
          <StockPedidoFilterCourier />
        </div>
        <div>
          <TableStockProductoCourier />
        </div>
      </div>
    </section>
  );
}
