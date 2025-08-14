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

  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPedidos(token)
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(pedidos.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const visiblePedidos = useMemo(() => {
    return pedidos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [pedidos, page]);

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (start > 1) {
        pages.unshift('...');
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [totalPages, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  // Calcular cuántas filas vacías hay que renderizar
  const emptyRowsCount = PAGE_SIZE - visiblePedidos.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30">
        <colgroup>
          <col className="w-[8%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
        </colgroup>

        <thead className="bg-[#E5E7EB]">
          <tr className="text-gray70 font-roboto font-medium">
            <th className="px-2 py-3 text-gray70 text-center">
              Fec. Entrega
            </th>
            <th className="px-4 py-3 text-gray70 text-left">Courier</th>
            <th className="px-4 py-3 text-gray70 text-left">Cliente</th>
            <th className="px-4 py-3 text-gray70 text-left">Producto</th>
            <th className="px-4 py-3 text-gray70 text-center">Cantidad</th>
            <th className="px-4 py-3 text-gray70 text-center">Monto</th>
            <th className="px-4 py-3 text-gray70 text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray20">
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, idx) => (
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
            <>
              {visiblePedidos.map((pedido) => (
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
              ))}

              {/* Filas vacías para mantener la altura */}
              {emptyRowsCount > 0 &&
                Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <td key={i} className="px-4 py-3">&nbsp;</td>
                    ))}
                  </tr>
                ))}
            </>
          )}
        </tbody>
      </table>

      {/* Paginador */}
      <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
        >
          &lt;
        </button>

        {pagerItems.map((p, i) =>
          typeof p === 'string' ? (
            <span key={`dots-${i}`} className="px-2 text-gray70">
              {p}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-current={page === p ? 'page' : undefined}
              className={[
                'w-8 h-8 flex items-center justify-center rounded',
                page === p
                  ? 'bg-gray90 text-white'
                  : 'bg-gray10 text-gray70 hover:bg-gray20'
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}