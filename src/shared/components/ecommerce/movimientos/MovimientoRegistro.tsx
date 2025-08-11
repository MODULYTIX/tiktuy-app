// components/MovimientoRegistro.tsx
import { useState } from 'react';
import MovimientoRegistroFilters from './MovimientoRegistroFilters';
import MovimientoRegistroTable from './MovimientoRegistroTable';
import CrearMovimientoModal from '../CrearMovimientoModal';

export default function MovimientoRegistro() {
  // guardamos filtros si los necesitas luego (no leemos el valor para evitar lint de unused vars)
  const [, setFilters] = useState<Record<string, unknown>>({});

  // control del modal
  const [showModal, setShowModal] = useState(false);

  // solo necesitamos el setter; el valor no se usa aquí (evita no-unused-vars)
  const [, setProductosSeleccionados] = useState<any[]>([]);

  return (
    <div className="mt-4">
      <MovimientoRegistroFilters
        onFilterChange={setFilters}
        onNuevoMovimientoClick={() => setShowModal(true)}
      />

      <MovimientoRegistroTable
        // ✅ Prop requerida para eliminar TS2741
        onSelectProducts={setProductosSeleccionados}
      />

      <CrearMovimientoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        // Si tu modal acepta los seleccionados, pásalos cuando lo uses:
        // productosSeleccionados={productosSeleccionados}
      />
    </div>
  );
}
