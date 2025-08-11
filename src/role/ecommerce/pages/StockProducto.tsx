import { useState, useEffect } from 'react';
import AnimatedExcelMenu from '@/shared/components/ecommerce/AnimatedExcelMenu';
import StockFilters from '@/shared/components/ecommerce/stock/StockFilters';
import StockTable from '@/shared/components/ecommerce/stock/StockTable';
import ProductoFormModal from '@/shared/components/ecommerce/ProductoFormModal';
import { TbCubePlus } from 'react-icons/tb';
import { useAuth } from '@/auth/context';
import { fetchProductosFiltrados } from '@/services/ecommerce/producto/producto.api';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import ImportExcelFlow from '@/shared/components/ecommerce/excel/ImportExcelFlow';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';
import { fetchCouriersAsociados } from '@/services/ecommerce/ecommerceCourier.api';

export default function StockPage() {
  const { token } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [modoSeleccionado, setModoModal] = useState<'crear' | 'editar' | 'ver'>(
    'crear'
  );
  const [couriers, setCouriers] = useState<{ id: number; nombre: string }[]>(
    []
  );

  const handleClose = () => {
    setOpenModal(false);
    setProductoSeleccionado(null);
    setModoModal('crear');
  };

  const handleDescargarPlantilla = () => {
    console.log('Descargar plantilla');
  };

  useEffect(() => {
    if (!token) return;
    let cancel = false;

    async function load() {
      try {
        const lista: CourierAsociado[] = await fetchCouriersAsociados(token);
        if (cancel) return;

        // mapea a { id, nombre } que espera el ImportExcelFlow/Modal
        setCouriers(
          (lista || []).map((c) => ({
            id: c.id,
            nombre: c.nombre_comercial,
          }))
        );
      } catch (err) {
        console.error('Error al obtener couriers asociados:', err);
        if (!cancel) setCouriers([]);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [token]);

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
    console.log('Producto creado o editado:', producto);
    setOpenModal(false);
    setProductoSeleccionado(null);
    cargarProductos();
  };

  const handleAbrirModalNuevo = () => {
    setModoModal('crear');
    setProductoSeleccionado(null);
    setOpenModal(true);
  };

  const handleVerProducto = (producto: Producto) => {
    setModoModal('ver');
    setProductoSeleccionado(producto);
    setOpenModal(true);
  };

  const handleEditarProducto = (producto: Producto) => {
    setModoModal('editar');
    setProductoSeleccionado(producto);
    setOpenModal(true);
  };

  useEffect(() => {
    if (token) cargarProductos();
  }, [filters, token]);

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
          <ImportExcelFlow token={token!} onImported={cargarProductos}>
            {(openPicker) => (
              <AnimatedExcelMenu
                onTemplateClick={handleDescargarPlantilla}
                onImportClick={openPicker}
              />
            )}
          </ImportExcelFlow>

          <button
            onClick={handleAbrirModalNuevo}
            className="text-white flex px-3 py-2 bg-[#1A253D] items-center gap-2 rounded-sm text-sm hover:opacity-90 transition">
            <TbCubePlus size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <StockFilters onFilterChange={setFilters} />

      <StockTable
        productos={productos}
        onVer={handleVerProducto}
        onEditar={handleEditarProducto}
      />

      <ProductoFormModal
        open={openModal}
        onClose={handleClose}
        onCreated={handleProductoCreado}
        initialData={productoSeleccionado}
        modo={modoSeleccionado}
      />
    </section>
  );
}
