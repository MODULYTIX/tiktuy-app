import { useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useAuth } from '@/auth/context';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import Paginator from '../../Paginator';
import type { Filters } from '@/shared/components/ecommerce/movimientos/MovimientoRegistroFilters';

interface Props {
  filters: Filters;
  onSelectProducts: (productos: Producto[]) => void;
  onViewProduct?: (uuid: string) => void; // opcional
}

/**
 * Nota sobre filtrado:
 * - Se realiza en memoria para no tocar tu API actual.
 * - Si luego deseas filtrado server-side, puedes:
 *   1) Construir un querystring desde `filters` y pasarlo a tu endpoint, o
 *   2) Extender `fetchProductos(token, params)` y usarlo en `loadProductos`.
 */
export default function MovimientoRegistroTable({ filters, onSelectProducts, onViewProduct }: Props) {
  const { token } = useAuth();

  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Carga inicial
  useEffect(() => {
    if (!token) return;
    fetchProductos(token)
      .then((rows) => {
        setAllProductos(rows || []);
      })
      .catch(console.error);
  }, [token]);

  // Comunicar selección hacia arriba
  useEffect(() => {
    const seleccionados = allProductos.filter((p) => selectedIds.includes(p.uuid));
    onSelectProducts(seleccionados);
  }, [selectedIds, allProductos, onSelectProducts]);

  // ------- Filtrado en memoria -------
  const filtered = useMemo(() => {
    let data = [...allProductos];

    // 1) Almacén
    if (filters.almacenamiento_id) {
      data = data.filter(
        (p) => String(p.almacenamiento_id || '') === String(filters.almacenamiento_id)
      );
    }

    // 2) Categoría
    if (filters.categoria_id) {
      // según tu modelo, puede ser p.categoria_id o p.categoria?.id
      data = data.filter(
        (p: any) =>
          String(p.categoria_id || p?.categoria?.id || '') === String(filters.categoria_id)
      );
    }

    // 3) Estado (por nombre)
    if (filters.estado) {
      data = data.filter(
        (p) => (p.estado?.nombre || '').toLowerCase() === filters.estado.toLowerCase()
      );
    }

    // 4) Búsqueda por nombre (nombre_producto)
    if (filters.search.trim()) {
      const needle = filters.search.trim().toLowerCase();
      data = data.filter((p) => (p.nombre_producto || '').toLowerCase().includes(needle));
    }

    // 5) Stock bajo
    if (filters.stock_bajo) {
      // Si tu modelo tiene `stock_minimo`, úsalo; de lo contrario, umbral genérico = 5
      data = data.filter((p: any) => {
        const min = typeof p.stock_minimo === 'number' ? p.stock_minimo : 5;
        return Number(p.stock) <= min;
      });
    }

    // 6) Precio bajo / alto (exclusivos)
    // Si ambos están marcados, ignoramos ambos para evitar conflicto.
    if (filters.precio_bajo !== filters.precio_alto) {
      const precios = data.map((p) => Number(p.precio)).filter((n) => !Number.isNaN(n));
      if (precios.length > 0) {
        const sorted = [...precios].sort((a, b) => a - b);
        const p25 = sorted[Math.floor(sorted.length * 0.25)];
        const p75 = sorted[Math.floor(sorted.length * 0.75)];

        if (filters.precio_bajo) {
          data = data.filter((p) => Number(p.precio) <= p25);
        }
        if (filters.precio_alto) {
          data = data.filter((p) => Number(p.precio) >= p75);
        }
      }
    }

    return data;
  }, [allProductos, filters]);

  // ------- Paginación -------
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // Si cambian los filtros, resetea a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const toggleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uuid) => uuid !== id) : [...prev, id]
    );
  };

  const handleView = (uuid: string) => {
    if (onViewProduct) onViewProduct(uuid);
    else console.warn('onViewProduct no fue proporcionado');
  };

  if (!allProductos.length) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded shadow-sm">
        Aún no hay productos registrados.
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">#</th>
            {['Código', 'Producto', 'Almacén', 'Stock', 'Precio', 'Estado', 'Acciones'].map((h) => (
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map((prod) => (
            <tr key={prod.uuid} className="border-t">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(prod.uuid)}
                  onChange={() => toggleCheckbox(prod.uuid)}
                />
              </td>
              <td className="p-3">{prod.codigo_identificacion}</td>
              <td className="p-3">
                <div className="font-semibold">{prod.nombre_producto}</div>
                <div className="text-gray-500 text-xs">{prod.descripcion}</div>
              </td>
              <td className="p-3">{prod.almacenamiento?.nombre_almacen}</td>
              <td className="p-3">{prod.stock}</td>
              <td className="p-3 text-right">S/ {Number(prod.precio).toFixed(2)}</td>
              <td className="p-3">
                <span className="text-xs px-2 py-1 rounded bg-black text-white">
                  {prod.estado?.nombre || 'Desconocido'}
                </span>
              </td>
              <td className="p-3">
                <button
                  type="button"
                  onClick={() => handleView(prod.uuid)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  title="Ver detalle"
                >
                  <FaEye size={16} className="text-blue-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 border-t flex justify-end">
        <Paginator
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
