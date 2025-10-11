import { getCourierProductos } from '@/services/courier/producto/productoCourier.api';
import type { Producto } from '@/services/courier/producto/productoCourier.type';
import StockPedidoFilterCourier from '@/shared/components/courier/pedido/SockPedidoCourierFilter';
import ProductoDetalleModal from '@/shared/components/courier/stockProducto/ProductoCourierDetalleModal';
import TableStockProductoCourier from '@/shared/components/courier/stockProducto/TableStockProductoCourier';
import { useEffect, useMemo, useState } from 'react';

export type StockFilters = {
  almacenId: string;
  categoriaId: string;
  nombre: string;
  estado: string;
  stockBajo: boolean;
  precioOrden: '' | 'asc' | 'desc';
  q: string;
};

export default function StockPage() {
  const [raw, setRaw] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StockFilters>({
    almacenId: '',
    categoriaId: '',
    nombre: '',
    estado: '',
    stockBajo: false,
    precioOrden: '',
    q: '',
  });

  // estado del modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Producto | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getCourierProductos(token);
        if (!active) return;
        setRaw(data);
        setError(null);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'No se pudo cargar el stock');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const options = useMemo(() => {
    const almacenes = Array.from(new Map(
      raw.filter(p => p.almacenamiento)
         .map(p => [String(p.almacenamiento!.id), p.almacenamiento!.nombre_almacen])
    ).entries()).map(([value, label]) => ({ value, label }));

    const categorias = Array.from(new Map(
      raw.filter(p => p.categoria)
         .map(p => [String(p.categoria!.id), p.categoria!.nombre])
    ).entries()).map(([value, label]) => ({ value, label }));

    const estados = [
      { value: 'Activo', label: 'Activo' },
      { value: 'Descontinuado', label: 'Descontinuado' },
    ];

    return { almacenes, categorias, estados };
  }, [raw]);

  const handleView = (p: Producto) => {
    setSelected(p);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Stock de Producto</h1>
          <p className="text-gray-500">Control de stock y movimiento</p>
        </div>
      </div>

      <div className="my-8">
        <StockPedidoFilterCourier
          filters={filters}
          onChange={setFilters}
          options={options}
          loading={loading}
        />
      </div>

      <div>
        <TableStockProductoCourier
          data={raw}
          filters={filters}
          error={error}
          loading={loading}
          onView={handleView}
        />
      </div>

      <ProductoDetalleModal
        isOpen={viewOpen}
        onClose={closeView}
        producto={selected}
      />
    </section>
  );
}
