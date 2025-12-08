// src/pages/courier/MovimientosPage.tsx
import { useState } from "react";
import TableMovimientoCourier from "@/shared/components/courier/movimiento/TableMovimientoCourier";
import MovimientoFilterCourier, {
  type MovimientoCourierFilters,
} from "@/shared/components/movimiento/MovimientoFilterCourier";
import Tittlex from "@/shared/common/Tittlex";

export default function MovimientosPage() {
  const [filters, setFilters] = useState<MovimientoCourierFilters>({
    estado: "",
    fecha: "",
    q: "",
  });

  return (
    <section className="mt-8">
      <div>
        <Tittlex
          title="Movimientos"
          description="Realice y visualice sus movimiento"
        />

        <div className="my-8">
          <MovimientoFilterCourier
            value={filters}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onClear={() => setFilters({ estado: "", fecha: "", q: "" })}
          />
        </div>

        <div>
          <TableMovimientoCourier filters={filters} />
        </div>
      </div>
    </section>
  );
}
