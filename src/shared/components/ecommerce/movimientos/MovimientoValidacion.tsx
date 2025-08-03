import MovimientoValidacionFilters from './MovimientoValidacionFilters';
import MovimientoValidacionTable from './MovimientoValidacionTable';

export default function MovimientoValidacion() {
  return (
    <div>
      {/* Aquí va TODO el contenido de la imagen 2 */}
      <h2 className="text-lg font-semibold mt-6">Estado / Validación</h2>
      <MovimientoValidacionFilters />
      <MovimientoValidacionTable />
    </div>
  );
}
