import { useState, useEffect, useRef } from 'react';
import AnimatedExcelMenu from '@/shared/components/ecommerce/AnimatedExcelMenu';
import StockFilters, {
  type StockFilterValue,
} from '@/shared/components/ecommerce/stock/StockFilters';
import StockTable from '@/shared/components/ecommerce/stock/StockTable';
import { useAuth } from '@/auth/context';
import { fetchProductosFiltrados } from '@/services/ecommerce/producto/producto.api';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import ImportExcelFlow from '@/shared/components/ecommerce/excel/ImportExcelFlow';

import ProductoCrearModal from '@/shared/components/ecommerce/stock/ProductoCrearModal';
import ProductoVerModal from '@/shared/components/ecommerce/stock/ProductoVerModal';
import ProductoEditarModal from '@/shared/components/ecommerce/stock/ProductoEditarModal';
import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';

import {
  downloadProductosTemplate,
  triggerBrowserDownload,
} from '@/services/ecommerce/exportExcel/Producto/exportProductoExcel.api';

type UiFilters = StockFilterValue & {
  order?: 'new_first' | 'price_asc' | 'price_desc';
};

export default function StockPage() {
  const { token } = useAuth();

  // Modales
  const [openCrear, setOpenCrear] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openVer, setOpenVer] = useState(false);

  // Selección
  const [productoSel, setProductoSel] = useState<Producto | null>(null);

  const [productosAll, setProductosAll] = useState<Producto[]>([]);
  const [productosVisibles, setProductosVisibles] = useState<Producto[]>([]);
  const [filters, setFilters] = useState<UiFilters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    nombre: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
    order: 'new_first',
  });

  const debounceMs = 100;
  const debounceRef = useRef<number | null>(null);

  const cargarProductos = async (filtros = filters) => {
    if (!token) return;
    try {
      const serverData = await fetchProductosFiltrados(
        { ...filtros, order: filtros.order ?? 'new_first' },
        token
      );

      const list = Array.isArray(serverData)
        ? serverData
        : Array.isArray(serverData?.data)
        ? serverData.data
        : [];

      setProductosAll(list);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  // Debounce al cambiar filtros/token
  useEffect(() => {
    if (!token) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      cargarProductos();
    }, debounceMs);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token]);

  // Filtrado + ordenamiento en cliente
  useEffect(() => {
    const f = filters;
    const norm = (s?: string) => (s ?? '').toLowerCase().trim();

    const filtra = (p: Producto) => {
      //  Filtros normales
      if (
        f.almacenamiento_id &&
        String(p.almacenamiento_id) !== String(f.almacenamiento_id)
      )
        return false;

      if (f.categoria_id && String(p.categoria_id) !== String(f.categoria_id))
        return false;

      if (
        f.estado === 'activo' &&
        p?.estado?.nombre?.toLowerCase() !== 'activo'
      )
        return false;

      if (
        f.estado === 'inactivo' &&
        p?.estado?.nombre?.toLowerCase() !== 'inactivo'
      )
        return false;

      //  Stock bajo: MISMA LÓGICA QUE LA TABLA (renderEstadoStock)
      if (f.stock_bajo) {
        const stockRaw = p.stock;
        const minRaw = p.stock_minimo;

        const stock =
          stockRaw === null || stockRaw === undefined
            ? NaN
            : Number(stockRaw);
        const minimo =
          minRaw === null || minRaw === undefined ? NaN : Number(minRaw);

        // Si no hay datos válidos de stock/minimo ⇒ NO se considera "stock bajo"
        if (!Number.isFinite(stock) || !Number.isFinite(minimo)) return false;

        // La tabla considera "Stock bajo" cuando stock < minimo
        if (!(stock < minimo)) return false;
      }

      //  Búsqueda
      if (f.search && f.search.trim()) {
        const q = norm(f.search);
        const nombre = norm(p.nombre_producto);
        const desc = norm(p.descripcion ?? '');
        const cod = norm(p.codigo_identificacion ?? '');
        if (!nombre.includes(q) && !desc.includes(q) && !cod.includes(q))
          return false;
      }

      return true;
    };

    const ordenar = (arr: Producto[]) => {
      if (f.precio_bajo)
        return [...arr].sort((a, b) => Number(a.precio) - Number(b.precio));

      if (f.precio_alto)
        return [...arr].sort((a, b) => Number(b.precio) - Number(a.precio));

      // default: nuevo primero
      return [...arr].sort((a: any, b: any) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (at !== 0 || bt !== 0) return bt - at;
        const ai = typeof a.id === 'number' ? a.id : 0;
        const bi = typeof b.id === 'number' ? b.id : 0;
        return bi - ai;
      });
    };

    setProductosVisibles(ordenar(productosAll.filter(filtra)));
  }, [productosAll, filters]);

  // Crear: agrega al principio y cierra
  const handleProductoCreado = (producto: Producto) => {
    setProductosAll((prev) => [producto, ...prev]);
    setOpenCrear(false);
  };

  // Editar: reemplaza en lista por uuid y cierra
  const handleProductoActualizado = (producto: Producto) => {
    setProductosAll((prev) => {
      const byUuid = producto.uuid && prev.some(p => p.uuid === producto.uuid);
      if (byUuid) return prev.map(p => (p.uuid === producto.uuid ? producto : p));

      const byId = typeof producto.id === 'number' && prev.some(p => p.id === producto.id);
      if (byId) return prev.map(p => (p.id === producto.id ? producto : p));

      return [producto, ...prev];
    });
    setOpenEditar(false);
    setProductoSel(null);
  };

  // Abrir modales
  const handleAbrirModalNuevo = () => setOpenCrear(true);
  const handleCloseCrear = () => setOpenCrear(false);

  const handleVerProducto = (producto: Producto) => {
    setProductoSel(producto);
    setOpenVer(true);
  };
  const handleEditarProducto = (producto: Producto) => {
    setProductoSel(producto);
    setOpenEditar(true);
  };

  const handleCloseVer = () => {
    setOpenVer(false);
    setProductoSel(null);
  };
  const handleCloseEditar = () => {
    setOpenEditar(false);
    setProductoSel(null);
  };

  const handleDescargarPlantilla = async () => {
    try {
      const res = await downloadProductosTemplate();
      triggerBrowserDownload(res);
    } catch (err) {
      console.error('Error al descargar plantilla:', err);
    }
  };

  //  FIX: Evitar NaN y enviar valor seguro
  let almacenamientoIdCreacion: number | undefined;
  const raw = filters.almacenamiento_id;

  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && !Number.isNaN(parsed)) {
      almacenamientoIdCreacion = parsed;
    }
  }


  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end">
        <Tittlex
          title="Stock de Productos"
          description="Control de Stock y Movimientos"
        />

        <div className="flex gap-2 items-end">
          <ImportExcelFlow
            token={token ?? ''}
            onImported={() => cargarProductos()}>
            {(openPicker) => (
              <AnimatedExcelMenu
                onTemplateClick={handleDescargarPlantilla}
                onImportClick={openPicker}
              />
            )}
          </ImportExcelFlow>
          <Buttonx
            label="Nuevo Producto"
            icon="tabler:cube-plus"
            variant="secondary"
            onClick={handleAbrirModalNuevo}
            className="font-light"
          />
        </div>
      </div>

      <StockFilters onFilterChange={(f) => setFilters(f)} />

      <StockTable
        productos={productosVisibles}
        filtrarInactivos={false}
        onVer={handleVerProducto}
        onEditar={handleEditarProducto}
      />

      {/* Crear */}
      <ProductoCrearModal
        open={openCrear}
        onClose={handleCloseCrear}
        onCreated={handleProductoCreado}
        almacenamientoId={almacenamientoIdCreacion ?? 0} // 👈 nunca será NaN
      />

      {/* Editar */}
      <ProductoEditarModal
        open={openEditar}
        onClose={handleCloseEditar}
        initialData={productoSel}
        onUpdated={handleProductoActualizado}
      />

      {/* Ver */}
      <ProductoVerModal
        open={openVer}
        onClose={handleCloseVer}
        data={productoSel}
      />
    </section>
  );
}
