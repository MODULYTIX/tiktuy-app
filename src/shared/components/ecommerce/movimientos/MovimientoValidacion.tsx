import { useState } from "react";
import MovimientoValidacionFilters from './MovimientoValidacionFilters';
import MovimientoValidacionTable from './MovimientoValidacionTable';

import type { MovimientoEcommerceFilters } from "./MoviminentoValidadoFilter";

export default function MovimientoValidacion() {
  
  // Estado local para manejar filtros
  const [filters, ] = useState<MovimientoEcommerceFilters>({
    estado: "",
    fecha: "",
    q: "",
  });

  return (
    <div>
      <h2 className="text-lg font-semibold mt-6">Estado / Validación</h2>

      {/* Filtros */}
      <MovimientoValidacionFilters
      />

      {/* Tabla (recibe los filtros correctamente) */}
      <MovimientoValidacionTable filters={filters} />
    </div>
  );
}
