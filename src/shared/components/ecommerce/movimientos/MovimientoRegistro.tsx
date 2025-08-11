// components/MovimientoRegistro.tsx
import { useState } from 'react';
import MovimientoRegistroFilters from './MovimientoRegistroFilters';
import MovimientoRegistroTable from './MovimientoRegistroTable';
import CrearMovimientoModal from '../CrearMovimientoModal';

type Filters = {
  almacenamiento_id: string;
  categoria_id: string;
  estado: string;
  stock_bajo: boolean;
  precio_bajo: boolean;
  precio_alto: boolean;
  search: string;
};

export default function MovimientoRegistro() {
  // no usamos el valor aquí, solo el setter
  const [, setFilters] = useState<Filters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
  });

  const [showModal, setShowModal] = useState(false);

  // no usamos el valor aquí, solo el setter
  const [, setProductosSeleccionados] = useState<any[]>([]);

  return (
    <div className="mt-4">
      <MovimientoRegistroFilters
        onFilterChange={(f) => setFilters(f)}                 {/* <- fix de tipo */}
        onNuevoMovimientoClick={() => setShowModal(true)}
      />

      <MovimientoRegistroTable
        onSelectProducts={(items) => setProductosSeleccionados(items)}  {/* <- fix de tipo */}
        // Si tu tabla acepta filtros, puedes pasarlos desde el estado si decides usarlos:
        // filters={currentFilters}
      />

      <CrearMovimientoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        // productosSeleccionados={currentProductosSeleccionados} // si tu modal lo requiere
      />
    </div>
  );
}
