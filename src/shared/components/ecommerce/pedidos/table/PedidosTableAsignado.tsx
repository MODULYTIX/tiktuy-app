import { useAuth } from '@/auth/context';
import { fetchPedidosAsignados } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect, useMemo, useState } from 'react';
import { FiEye } from 'react-icons/fi';

type Filtros = {
  courier: string;
  producto: string;
  fechaInicio: string;
  fechaFin: string;
};

interface Props {
  onVer: (pedidoId: number) => void;
  onEditar: (pedidoId: number) => void;
  filtros: Filtros;
}

export default function PedidosTableAsignado({ onVer, onEditar, filtros }: Props) {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPedidosAsignados(token)
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token]);

  // ---- Helpers de formato (sin tocar tu lógica) ----
  const parseDateInput = (s?: string) => {
    if (!s) return undefined;
    const str = s.trim();
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const m1 = str.match(ddmmyyyy);
    if (m1) {
      const dd = Number(m1[1]);
      const mm = Number(m1[2]);
      const yyyy = Number(m1[3]);
      const d = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
      return isNaN(d.getTime()) ? undefined : d;
    }
    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    const m2 = str.match(yyyymmdd);
    if (m2) {
      const yyyy = Number(m2[1]);
      const mm = Number(m2[2]);
      const dd = Number(m2[3]);
      const d = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
      return isNaN(d.getTime()) ? undefined : d;
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const formatearFechaCorta = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    // dd/mm/aaaa
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatearMoneda = (n: number) =>
    `S/. ${n.toFixed(2)}`;

  const calcularMonto = (p: Pedido) =>
    Number(
      (p.detalles || []).reduce(
        (acc, d) => acc + Number(d.cantidad) * Number(d.precio_unitario),
        0
      )
    );

  const getEstadoTexto = (p: Pedido) =>
    p.estado_pedido ;

  const getEstadoPill = (estado: string) => {
    // Visual igual a la imagen (amarillo suave “En proceso”)
    const base =
      'inline-flex items-center px-2 py-[2px] rounded text-[11px] font-medium border';
    const classes =
      estado.toLowerCase() === 'asignado' || estado.toLowerCase() === 'en proceso'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : estado.toLowerCase() === 'entregado'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-gray-50 text-gray-600 border-gray-200';
    const label =
      estado.toLowerCase() === 'asignado' ? 'En proceso' : estado; // mapeo visual
    return <span className={`${base} ${classes}`}>{label}</span>;
  };

  // =============== A) FILTROS (antes de paginar) ===============
  const filteredPedidos = useMemo(() => {
    const start = parseDateInput(filtros.fechaInicio);
    const end = parseDateInput(filtros.fechaFin);
    if (end) end.setHours(23, 59, 59, 999);

    return pedidos.filter((p) => {
      // Para la vista y la imagen: usamos fecha_entrega_programada si existe; si no, fecha_creacion
      const fechaRef = p.fecha_entrega_programada ?? p.fecha_creacion;
      const d = fechaRef ? new Date(fechaRef) : undefined;

      if (start && d && d < start) return false;
      if (end && d && d > end) return false;

      // Courier (por id o nombre)
      if (filtros.courier) {
        const courierId = (p as any).courier_id ?? p.courier?.id;
        const byId = courierId != null && String(courierId) === filtros.courier;
        const byName = (p.courier?.nombre_comercial || '')
          .toLowerCase()
          .includes(filtros.courier.toLowerCase());
        if (!(byId || byName)) return false;
      }

      // Producto (id/código/nombre en detalles)
      if (filtros.producto) {
        const needle = filtros.producto.toLowerCase();
        const ok = (p.detalles || []).some((d) => {
          const prod = d.producto;
          const byId = prod?.id != null && String(prod.id) === filtros.producto;    
          const byCodigo =
            (prod as any)?.codigo &&
            String((prod as any).codigo).toLowerCase().includes(needle);
          const byNombre =
            (prod?.nombre_producto || '').toLowerCase().includes(needle);
          return byId || byCodigo || byNombre;
        });
        if (!ok) return false;
      }

      return true;
    });
  }, [pedidos, filtros]);

  // Reset de página si cambian filtros
  useEffect(() => {
    setPage(1);
  }, [filtros.courier, filtros.producto, filtros.fechaInicio, filtros.fechaFin]);

  // =============== B) PAGINACIÓN (sobre la lista filtrada) ===============
  const totalPages = Math.max(1, Math.ceil(filteredPedidos.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const visiblePedidos = useMemo(
    () => filteredPedidos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPedidos, page]
  );

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);
      if (page <= 3) { start = 1; end = maxButtons; }
      else if (page >= totalPages - 2) { start = totalPages - (maxButtons - 1); end = totalPages; }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) { pages.unshift('...'); pages.unshift(1); }
      if (end < totalPages) { pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  }, [totalPages, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const emptyRowsCount = PAGE_SIZE - visiblePedidos.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30">
        <colgroup>
          <col className="w-[10%]" /> {/* Fec. Entrega */}
          <col className="w-[16%]" /> {/* Courier */}
          <col className="w-[16%]" /> {/* Cliente */}
          <col className="w-[20%]" /> {/* Producto */}
          <col className="w-[8%]" />  {/* Cantidad */}
          <col className="w-[10%]" /> {/* Monto */}
          <col className="w-[10%]" /> {/* Estado */}
          <col className="w-[10%]" /> {/* Acciones */}
        </colgroup>

        <thead className="bg-[#E5E7EB]">
          <tr className="text-gray70 font-roboto font-medium">
            <th className="px-2 py-3 text-center">Fec. Entrega</th>
            <th className="px-4 py-3 text-left">Courier</th>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">Producto</th>
            <th className="px-4 py-3 text-center">Cantidad</th>
            <th className="px-4 py-3 text-center">Monto</th>
            <th className="px-4 py-3 text-center">Estado</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray20">
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <tr key={idx} className="[&>td]:px-4 [&>td]:py-3 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <td key={i}><div className="h-4 bg-gray20 rounded w-3/4"></div></td>
                ))}
              </tr>
            ))
          ) : filteredPedidos.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-4 text-center text-gray70 italic">
                No hay pedidos asignados.
              </td>
            </tr>
          ) : (
            <>
              {visiblePedidos.map((pedido) => {
                const fechaEntrega = formatearFechaCorta(
                  pedido.fecha_entrega_programada || pedido.fecha_creacion
                );
                const productoPrincipal =
                  pedido.detalles?.[0]?.producto?.nombre_producto ?? '-';
                const cantidadPrincipal =
                  pedido.detalles?.[0]?.cantidad != null
                    ? String(pedido.detalles[0].cantidad).padStart(2, '0')
                    : '00';
                const monto = formatearMoneda(calcularMonto(pedido));
                const estadoTexto = getEstadoTexto(pedido);

                return (
                  <tr key={pedido.id} className="hover:bg-gray10 transition-colors">
                    <td className="px-2 py-3 text-gray70 text-center">{fechaEntrega}</td>
                    <td className="px-4 py-3 text-gray70">{pedido.courier?.nombre_comercial}</td>
                    <td className="px-4 py-3 text-gray70">{pedido.nombre_cliente}</td>
                    <td className="px-4 py-3 text-gray70">{productoPrincipal}</td>
                    <td className="px-4 py-3 text-gray70 text-center">{cantidadPrincipal}</td>
                    <td className="px-4 py-3 text-gray70 text-center">{monto}</td>
                    <td className="px-4 py-3 text-center">
                      {getEstadoPill(estadoTexto)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => onVer(pedido.id)}
                          className="text-primaryLight hover:text-primaryDark"
                          title="Ver Pedido"
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
                );
              })}

              {emptyRowsCount > 0 &&
                Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <td key={i} className="px-4 py-3">&nbsp;</td>
                    ))}
                  </tr>
                ))}
            </>
          )}
        </tbody>
      </table>

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
            <span key={`dots-${i}`} className="px-2 text-gray70">{p}</span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-current={page === p ? 'page' : undefined}
              className={[
                'w-8 h-8 flex items-center justify-center rounded',
                page === p ? 'bg-gray90 text-white' : 'bg-gray10 text-gray70 hover:bg-gray20'
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
