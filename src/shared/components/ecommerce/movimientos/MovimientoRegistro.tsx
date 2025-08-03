// components/MovimientoRegistro.tsx
import { useState } from 'react';
import MovimientoRegistroFilters from './MovimientoRegistroFilters';
import MovimientoRegistroTable from './MovimientoRegistroTable';
import CrearMovimientoModal from '../CrearMovimientoModal';

export default function MovimientoRegistro() {
  const [, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="mt-4">
      <MovimientoRegistroFilters onFilterChange={setFilters} />

      <MovimientoRegistroTable />
      <CrearMovimientoModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
