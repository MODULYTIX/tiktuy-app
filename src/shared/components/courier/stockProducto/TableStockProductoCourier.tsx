import { useMemo, useState } from 'react';
import { FaEye, FaBoxOpen } from 'react-icons/fa';
import Paginator from '../../Paginator';
import type { Producto } from '@/services/courier/producto/productoCourier.type';
import type { StockFilters } from '@/role/courier/pages/StockProducto';


function toNumber(n: unknown) {
  if (n == null) return 0;
  if (typeof n === 'number') return n;
  const s = String(n).replace(/,/g, '.');
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
}

function formatPEN(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TableStockProductoCourier({
  data,
  filters,
  loading,
  error,
}: {
  data: Producto[];
  filters: StockFilters;
  loading?: boolean;
  error?: string | null;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Aplicar filtros + ordenamiento
  const filtered = useMemo(() => {
    let arr = [...data];

    // Texto: nombre, descripcion, codigo
    const q = filters.q.trim().toLowerCase();
    if (q) {
      arr = arr.filter((p) => {
        const nombre = p.nombre_producto?.toLowerCase() || '';
        const desc = p.descripcion?.toLowerCase() || '';
        const codigo = p.codigo_identificacion?.toLowerCase() || '';
        return nombre.includes(q) || desc.includes(q) || codigo.includes(q);
      });
    }

    // Almacén
    if (filters.almacenId) {
      arr = arr.filter((p) => String(p.almacenamiento?.id || '') === filters.almacenId);
    }

    // Categoría
    if (filters.categoriaId) {
      arr = arr.filter((p) => String(p.categoria_id) === filters.categoriaId);
    }

    // Estado (mapeamos por nombre de estado relacionado si viene)
    if (filters.estado) {
      arr = arr.filter((p) => (p.estado?.nombre || '') === filters.estado);
    }

    // Stock bajo
    if (filters.stockBajo) {
      arr = arr.filter((p) => (p.stock ?? 0) <= (p.stock_minimo ?? 0));
    }

    // Orden por precio
    if (filters.precioOrden) {
      arr.sort((a, b) => {
        const pa = toNumber(a.precio);
        const pb = toNumber(b.precio);
        return filters.precioOrden === 'asc' ? pa - pb : pb - pa;
      });
    }

    return arr;
  }, [data, filters]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);

  // Reset página si cambian filtros
  // (evita quedar en páginas vacías al filtrar)
  useMemo(() => { setCurrentPage(1); }, [filters]);

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      {loading && (
        <div className="p-4 text-sm text-gray-500">Cargando productos…</div>
      )}
      {error && !loading && (
        <div className="p-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Almacén</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={7}>
                    No hay productos para mostrar
                  </td>
                </tr>
              )}

              {current.map((p) => {
                const precioNum = toNumber(p.precio);
                const stockBajo = (p.stock ?? 0) <= (p.stock_minimo ?? 0);
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{p.codigo_identificacion}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.nombre_producto}</div>
                      {p.descripcion && (
                        <div className="text-xs text-gray-500">{p.descripcion}</div>
                      )}
                      {p.categoria?.nombre && (
                        <div className="text-xs text-gray-400">Categoría: {p.categoria.nombre}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.almacenamiento?.nombre_almacen || '-'}</td>
                    <td className={`px-4 py-3 flex items-center gap-1 ${stockBajo ? 'text-amber-600' : 'text-green-600'}`}>
                      <FaBoxOpen />
                      {p.stock}
                      <span className="text-xs text-gray-500 ml-1">{stockBajo ? 'Stock bajo' : 'Stock normal'}</span>
                    </td>
                    <td className="px-4 py-3">S/. {formatPEN(precioNum)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${p.estado?.nombre === 'Activo' ? 'bg-black text-white' : 'bg-gray-500 text-white'}`}>
                        {p.estado?.nombre || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          // Navegar al detalle si tienes ruta (por ejemplo: /courier/stock/:uuid)
                          // navigate(`/courier/stock/${p.uuid}`)
                          console.log('ver', p.uuid);
                        }}
                        aria-label={`Ver ${p.nombre_producto}`}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="border-top p-4">
              <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}