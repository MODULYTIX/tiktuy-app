import { useAuth } from '@/auth/context';
import { fetchPedidos } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect, useMemo, useState } from 'react';
import { FiEye } from 'react-icons/fi';

interface PedidosTableGeneradoProps {
  onEditar: (pedidoId: number) => void;
}

export default function PedidosTableGenerado({ onEditar }: PedidosTableGeneradoProps) {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // -------- Paginación --------
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(pedidos.length / PAGE_SIZE));

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPedidos(token)
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token]);

  // Ajusta la página si cambia el total
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const visiblePedidos = useMemo(
    () => pedidos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [pedidos, page]
  );

  // Páginas a mostrar: 1 2 3 … N (o todas si <=5)
  const pagerItems = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    return [1, 2, 3, '…', totalPages] as const;
  }, [totalPages]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed text-[12px] bg-white border border-gray30 rounded-md shadow-[var(--shadow-default)]">
        <colgroup>
          <col className="w-[8%]" />  {/* Fec. Entrega */}
          <col className="w-[16%]" /> {/* Courier */}
          <col className="w-[16%]" /> {/* Cliente */}
          <col className="w-[16%]" /> {/* Producto */}
          <col className="w-[8%]" />  {/* Cantidad */}
          <col className="w-[8%]" />  {/* Monto */}
          <col className="w-[8%]" />  {/* Acciones */}
        </colgroup>

        <thead className="bg-[#E5E7EB]">
          <tr className="text-gray70 font-roboto font-medium">
            <th className="px-2 py-3 text-gray70 text-center first:rounded-tl-md">
              Fec. Entrega
            </th>
            <th className="px-4 py-3 text-gray70 text-left">Courier</th>
            <th className="px-4 py-3 text-gray70 text-left">Cliente</th>
            <th className="px-4 py-3 text-gray70 text-left">Producto</th>
            <th className="px-4 py-3 text-gray70 text-center">Cantidad</th>
            <th className="px-4 py-3 text-gray70 text-center">Monto</th>
            <th className="px-4 py-3 text-gray70 text-center last:rounded-tr-md">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray20">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <tr key={idx} className="[&>td]:px-4 [&>td]:py-3 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                  <td key={i}>
                    <div className="h-4 bg-gray20 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : pedidos.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-4 text-center text-gray70 italic">
                No hay pedidos registrados.
              </td>
            </tr>
          ) : (
            visiblePedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray10 transition-colors">
                <td className="px-2 py-3 text-gray70 font-[400] text-center">
                  {new Date(pedido.fecha_creacion).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray70 font-[400] text-left">
                  {pedido.courier?.nombre_comercial}
                </td>
                <td className="px-4 py-3 text-gray70 font-[400] text-left">
                  {pedido.nombre_cliente}
                </td>
                <td className="px-4 py-3 text-gray70 font-[400] text-left">
                  {pedido.detalles?.[0]?.producto?.nombre_producto ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray70 font-[400] text-center">
                  {pedido.detalles?.[0]?.cantidad?.toString().padStart(2, '0')}
                </td>
                <td className="px-4 py-3 text-gray70 font-[400] text-center">
                  S/.{' '}
                  {pedido.detalles
                    ?.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0)
                    .toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => onEditar(pedido.id)}
                      className="text-primaryLight hover:text-primaryDark"
                      title="Ver / Editar Pedido"
                    >
                      <FiEye className="inline-block w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditar(pedido.id)}
                      className="text-[#CA8A04] hover:opacity-80"
                      title="Editar"
                    >
                      <Icon icon="fa-regular:edit" width="16" height="16" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Paginador */}
      <div className="flex items-center justify-end gap-4 border-b-[4px] border-gray90 py-3 pr-2">
        {pagerItems.map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="text-gray70">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              aria-current={page === p ? 'page' : undefined}
              className={[
                'w-8 h-8 flex items-center justify-center rounded',
                page === p
                  ? 'bg-[#F97316] text-white'
                  : 'bg-gray10 text-gray70 hover:bg-gray20'
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}
      </div>
    </div>
  );
}