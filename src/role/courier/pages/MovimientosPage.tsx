import TableMovimientoCourier from '@/shared/components/courier/movimiento/TableMovimientoCourier';
import MovimientoFilterCourier from '@/shared/components/movimiento/MovimientoFilterCourier';

export default function MovimientosPage() {
  return (
    <section className="mt-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Movimientos</h1>
            <p className="text-gray-500">Realice y visualice sus movimientos</p>
          </div>
        </div>
        <div className="my-8">
          <MovimientoFilterCourier />
        </div>
        <div>
          <TableMovimientoCourier />
        </div>
      </div>
    </section>
  );
}
