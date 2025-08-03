import { useState, useEffect } from 'react';
import AnimatedExcelMenu from '@/shared/components/ecommerce/AnimatedExcelMenu';
import StockFilters from '@/shared/components/ecommerce/stock/StockFilters';
import StockTable from '@/shared/components/ecommerce/stock/StockTable';
import ProductoFormModal from '@/shared/components/ecommerce/ProductoFormModal';
import { TbCubePlus } from 'react-icons/tb';
import { useAuth } from '@/auth/context';
import { fetchProductosFiltrados } from '@/services/ecommerce/producto/producto.api';
import type { Producto } from '@/services/ecommerce/producto/producto.types';

export default function StockPage() {
  const { token } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filters, setFilters] = useState<any>({});

  const handleDescargarPlantilla = () => {
    console.log('Descargar plantilla');
  };

  const handleImportarArchivo = () => {
    console.log('Importar archivo');
  };

  const cargarProductos = async (filtros = filters) => {
    if (!token) return;
    try {
      const data = await fetchProductosFiltrados(filtros, token);
      setProductos(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const handleProductoCreado = (producto: Producto) => {
    console.log('Producto creado:', producto);
    setOpenModal(false);
    cargarProductos();
  };

  useEffect(() => {
    cargarProductos();
  }, [filters]);

  return (
    <section className="mt-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Stock de Productos
          </h1>
          <p className="text-gray-500 mt-1">Control de Stock y Movimientos</p>
        </div>

        <div className="flex gap-2 items-center">
          <AnimatedExcelMenu
            onTemplateClick={handleDescargarPlantilla}
            onImportClick={handleImportarArchivo}
          />

          <button
            onClick={() => setOpenModal(true)}
            className="text-white flex px-3 py-2 bg-[#1A253D] items-center gap-2 rounded-sm text-sm hover:opacity-90 transition">
            <TbCubePlus size={18}  />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <StockFilters onFilterChange={setFilters} />
      <StockTable productos={productos} />

      <ProductoFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={handleProductoCreado}
      />
    </section>
  );
}
