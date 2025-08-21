// src/pages/courier/MovimientosPage.tsx
import { useState } from 'react';
import TableMovimientoCourier from '@/shared/components/courier/movimiento/TableMovimientoCourier';
import MovimientoFilterCourier, { type MovimientoCourierFilters } from '@/shared/components/movimiento/MovimientoFilterCourier';

export default function MovimientosPage() {
  const [filters, setFilters] = useState<MovimientoCourierFilters>({
    estado: '',
    fecha: '',
    q: '',
  });

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
          <MovimientoFilterCourier
            value={filters}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onClear={() => setFilters({ estado: '', fecha: '', q: '' })}
          />
        </div>

        <div>
          <TableMovimientoCourier filters={filters} />
        </div>
      </div>
    </section>
  );
}
