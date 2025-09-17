import { useState } from 'react';
import MovimientoRegistroFilters, { type Filters } from './MovimientoRegistroFilters';
import MovimientoRegistroTable from './MovimientoRegistroTable';
import CrearMovimientoModal from '../CrearMovimientoModal';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';

export default function MovimientoRegistro() {
  const { notify } = useNotification();

  // Filtros conectados a la tabla
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'ver'>('crear');
  const [selectedProductsUuids, setSelectedProductsUuids] = useState<string[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<Producto[]>([]);

  const handleNuevoMovimientoClick = () => {
    if (productosSeleccionados.length === 0) {
      notify('Selecciona al menos un producto para continuar.', 'error');
      return;
    }

    // Validar que todos los productos sean del mismo almacén
    const almacenes = Array.from(
      new Set(
        productosSeleccionados.map((p) =>
          p.almacenamiento_id != null ? String(p.almacenamiento_id) : ''
        )
      )
    ).filter(Boolean);

    if (almacenes.length > 1) {
      notify(
        'No puedes seleccionar productos de diferentes almacenes para un mismo movimiento.',
        'error'
      );
      return;
    }

    setModalMode('crear');
    setSelectedProductsUuids(productosSeleccionados.map((p) => p.uuid));
    setShowModal(true);
  };

  const handleViewProduct = (uuid: string) => {
    setModalMode('ver');
    setSelectedProductsUuids([uuid]);
    setShowModal(true);
  };

  return (
    <div className="mt-4">
      <MovimientoRegistroFilters
        onFilterChange={setFilters}
        onNuevoMovimientoClick={handleNuevoMovimientoClick}
      />

      <MovimientoRegistroTable
        filters={filters}
        onSelectProducts={setProductosSeleccionados}
        onViewProduct={handleViewProduct}
      />

      <CrearMovimientoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        selectedProducts={selectedProductsUuids}
        modo={modalMode}
      />
    </div>
  );
}
