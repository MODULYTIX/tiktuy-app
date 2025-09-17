import { useState } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';
import { PiSealCheck } from 'react-icons/pi';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import MovimientoRegistroFilters, {
  type Filters,
} from '@/shared/components/ecommerce/movimientos/MovimientoRegistroFilters';
import MovimientoRegistroTable from '@/shared/components/ecommerce/movimientos/MovimientoRegistroTable';
import MovimientoValidacionTable from '@/shared/components/ecommerce/movimientos/MovimientoValidacionTable';
import CrearMovimientoModal from '@/shared/components/ecommerce/CrearMovimientoModal';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';

export default function RegistroMovimientoPage() {
  const { notify } = useNotification();

  // Productos seleccionados por checkbox en la tabla
  const [selectedProducts, setSelectedProducts] = useState<Producto[]>([]);
  // UUIDs que se enviarán al modal (pueden venir de selección múltiple o del botón "ver" de una fila)
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'registro' | 'validacion'>('registro'); // para tabs
  const [modo, setModo] = useState<'crear' | 'ver'>('crear'); // para el modal

  // Filtros conectados al listado
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
  });

  const handleOpenModalCrear = () => {
    if (selectedProducts.length === 0) {
      notify('Selecciona al menos un producto para continuar.', 'error');
      return;
    }

    // Validar que todos los productos sean del mismo almacén
    const almacenes = Array.from(
      new Set(
        selectedProducts.map((p) =>
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

    setModo('crear');
    setSelectedUuids(selectedProducts.map((p) => p.uuid));
    setModalOpen(true);
  };

  const handleViewProduct = (uuid: string) => {
    setModo('ver');
    setSelectedUuids([uuid]);
    setModalOpen(true);
  };

  return (
    <section className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Movimiento</h1>
          <p className="text-gray-500">
            {modalMode === 'registro'
              ? 'Realice nuevos movimientos de productos.'
              : 'Visualice y valide movimientos registrados.'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setModalMode('registro')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
              modalMode === 'registro'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <FaExchangeAlt />
            Nuevo Movimiento
          </button>
          <span className="block w-[1px] h-8 bg-primary"></span>
          <button
            onClick={() => setModalMode('validacion')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
              modalMode === 'validacion'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <PiSealCheck size={18} />
            Ver Movimientos
          </button>
        </div>
      </div>

      {modalMode === 'registro' ? (
        <>
          {/* 20px (1.25rem) de espacio vertical entre filtros y tabla */}
          <div className="space-y-5">
            <MovimientoRegistroFilters
              onFilterChange={setFilters}
              onNuevoMovimientoClick={handleOpenModalCrear}
            />

            <MovimientoRegistroTable
              filters={filters}
              onSelectProducts={setSelectedProducts}
              onViewProduct={handleViewProduct}
            />
          </div>

          <CrearMovimientoModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            selectedProducts={selectedUuids} // uuids que consume el modal
            modo={modo} // 'crear' | 'ver'
          />
        </>
      ) : (
        <MovimientoValidacionTable />
      )}
    </section>
  );
}
