import { useState } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import MovimientoRegistroFilters from '@/shared/components/ecommerce/movimientos/MovimientoRegistroFilters';
import MovimientoRegistroTable from '@/shared/components/ecommerce/movimientos/MovimientoRegistroTable';
import MovimientoValidacionTable from '@/shared/components/ecommerce/movimientos/MovimientoValidacionTable';
import CrearMovimientoModal from '@/shared/components/ecommerce/CrearMovimientoModal';
import { PiSealCheck } from 'react-icons/pi';

export default function RegistroMovimientoPage() {
  const [selectedProducts, setSelectedProducts] = useState<Producto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [vista, setVista] = useState<'registro' | 'validacion'>('registro');

  const handleOpenModal = () => {
    if (selectedProducts.length === 0) return;
    setModalOpen(true);
  };

  return (
    <section className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            Registro de Movimiento
          </h1>
          <p className="text-gray-500">
            {vista === 'registro'
              ? 'Realice nuevos movimientos de productos.'
              : 'Visualice y valide movimientos registrados.'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setVista('registro')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
              vista === 'registro'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}>
            <FaExchangeAlt />
            Nuevo Movimiento
          </button>
          <span className="block w-[1px] h-8 bg-primary"></span>
          <button
            onClick={() => setVista('validacion')}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
              vista === 'validacion'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDar hover:bg-gray-200'
            }`}>
            <PiSealCheck size={18} />
            Ver Movimientos
          </button>
        </div>
      </div>

      {vista === 'registro' ? (
        <>
          <MovimientoRegistroFilters onNuevoMovimientoClick={handleOpenModal} />
          <MovimientoRegistroTable onSelectProducts={setSelectedProducts} />
          <CrearMovimientoModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            selectedProducts={selectedProducts.map((p) => p.uuid)}
          />
        </>
      ) : (
        <MovimientoValidacionTable />
      )}
    </section>
  );
}
