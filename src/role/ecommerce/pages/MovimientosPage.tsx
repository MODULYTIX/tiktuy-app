// src/pages/ecommerce/movimientos/RegistroMovimientoPage.tsx
import { useEffect, useState } from 'react';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import MovimientoRegistroFilters, {
  type Filters,
} from '@/shared/components/ecommerce/movimientos/MovimientoRegistroFilters';
import MovimientoRegistroTable from '@/shared/components/ecommerce/movimientos/MovimientoRegistroTable';
import MovimientoValidacionTable from '@/shared/components/ecommerce/movimientos/MovimientoValidacionTable';
import CrearMovimientoModal from '@/shared/components/ecommerce/CrearMovimientoModal';
import VerMovimientoModal from '@/shared/components/ecommerce/movimientos/VerMovimientoModal';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';
import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';

export default function RegistroMovimientoPage() {
  const { notify } = useNotification();

  // Productos seleccionados para crear movimiento
  const [selectedProducts, setSelectedProducts] = useState<Producto[]>([]);
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Tabs
  const [modalMode, setModalMode] = useState<'registro' | 'validacion'>(
    'registro'
  );

  // Filtros
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    nombre: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
  });

  // Modal de VER
  const [verOpen, setVerOpen] = useState(false);
  const [verData, setVerData] = useState<Producto | null>(null);

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
        'No puedes seleccionar productos de diferentes sedes para un mismo movimiento.',
        'error'
      );
      return;
    }

    setSelectedUuids(selectedProducts.map((p) => p.uuid));
    setModalOpen(true);
  };

  // Abrir modal “ver” instantáneo (recibe el producto completo desde la tabla)
  const handleViewProduct = (producto: Producto) => {
    setVerData(producto);
    setVerOpen(true);
  };

  // Al cambiar de tab, cerrar modales
  useEffect(() => {
    setModalOpen(false);
    setVerOpen(false);
  }, [modalMode]);

  return (
    <section className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <Tittlex
          title="Movimientos"
          description={
            modalMode === 'registro'
              ? 'Realice nuevos movimientos de productos.'
              : 'Visualice y valide movimientos registrados.'
          }
        />
        <div className="flex gap-2 items-center">
          <Buttonx
            label="Nuevo Movimiento"
            icon="carbon:asset-movement"
            variant={modalMode === 'registro' ? 'secondary' : 'tertiary'} // "primary" cuando está activo, "tertiary" cuando no
            onClick={() => setModalMode('registro')}
            disabled={false}
          />

          <span className="block w-[1px] h-8 bg-primary"></span>

          <Buttonx
            label="Ver Movimientos / Validar"
            icon="hugeicons:validation"
            variant={modalMode === 'validacion' ? 'secondary' : 'tertiary'} // "primary" cuando está activo, "tertiary" cuando no
            onClick={() => setModalMode('validacion')}
            disabled={false}
          />
        </div>
      </div>

      {modalMode === 'registro' ? (
        <>
          {/* 20px (1.25rem) entre filtros y tabla */}
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

          {/* Modal CREAR */}
          <CrearMovimientoModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            selectedProducts={selectedUuids}
          />

          {/* Modal VER */}
          <VerMovimientoModal
            open={verOpen}
            onClose={() => setVerOpen(false)}
            data={verData}
          />
        </>
      ) : (
        <MovimientoValidacionTable />
      )}
    </section>
  );
}
