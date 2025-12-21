import { useAuth } from "@/auth/context";
import { fetchPedidos } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import TableActionx from "@/shared/common/TableActionx";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useEffect, useMemo, useState } from "react";
import { FiEye } from "react-icons/fi";

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
  refreshKey: number;
}

export default function PedidosTableAsignado({
  onVer,
  onEditar,
  filtros,
  refreshKey,
}: Props) {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  // ================================
  // FETCH — ahora trae estado "Pendiente"
  // ================================
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    // Antes: fetchPedidosAsignados(token)
    fetchPedidos(token, "Pendiente", 1, 10)
      .then((res) => {
        setPedidos(res.data || []);
      })
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token, refreshKey]);

  const goToPage = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setPage(n);
  };

  // ===============================
  // Helpers formato fechas
  // ===============================
  const parseDateInput = (s?: string) => {
    if (!s) return undefined;
    const str = s.trim();

    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const m1 = str.match(ddmmyyyy);
    if (m1) return new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]));

    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    const m2 = str.match(yyyymmdd);
    if (m2) return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));

    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const formatearFechaCorta = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const getEstadoPill = (estado: string) => {
    const base =
      "inline-flex items-center px-2 py-[2px] rounded text-[11px] font-medium border";

    const lower = (estado || "").toLowerCase();

    const classes =
      lower === "pendiente"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : lower === "entregado"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-gray-50 text-gray-600 border-gray-200";

    const label = lower === "pendiente" ? "Pendiente" : estado;

    return <span className={`${base} ${classes}`}>{label}</span>;
  };

  // ===============================
  // FILTROS
  // ===============================
  const filteredPedidos = useMemo(() => {
    const start = parseDateInput(filtros.fechaInicio);
    const end = parseDateInput(filtros.fechaFin);
    if (end) end.setHours(23, 59, 59, 999);

    return pedidos.filter((p) => {
      const fechaRef = p.fecha_entrega_programada || p.fecha_creacion;
      const d = fechaRef ? new Date(fechaRef) : undefined;

      if (start && d && d < start) return false;
      if (end && d && d > end) return false;

      if (filtros.courier) {
        const courierId = (p as any).courier_id ?? p.courier?.id;
        const byId = courierId && String(courierId) === filtros.courier;
        const byName = p.courier?.nombre_comercial
          ?.toLowerCase()
          .includes(filtros.courier.toLowerCase());
        if (!byId && !byName) return false;
      }

      if (filtros.producto) {
        const needle = filtros.producto.toLowerCase();
        const ok = p.detalles.some((d) => {
          const prod = d.producto;
          return (
            (prod?.id && String(prod.id) === filtros.producto) ||
            prod?.nombre_producto?.toLowerCase().includes(needle)
          );
        });
        if (!ok) return false;
      }

      return true;
    });
  }, [pedidos, filtros]);

  // Reset page si cambian filtros
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  // ===============================
  // PAGINACIÓN (client-side)
  // ===============================
  const totalPages = Math.max(1, Math.ceil(filteredPedidos.length / PAGE_SIZE));
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
      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) pages.unshift("...", 1);
      if (end < totalPages) pages.push("...", totalPages);
    }

    return pages;
  }, [page, totalPages]);

  const emptyRows = PAGE_SIZE - visiblePedidos.length;

  // ===============================
  // UI
  // ===============================
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[20%]" />
          <col className="w-[8%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
        </colgroup>

        <thead className="bg-[#E5E7EB]">
          <tr className="text-gray70 font-medium">
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
          {/* Skeleton */}
          {loading ? (
            [...Array(PAGE_SIZE)].map((_, idx) => (
              <tr key={idx} className="[&>td]:px-4 [&>td]:py-3 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <td key={i}>
                    <div className="h-4 bg-gray20 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : filteredPedidos.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-4 text-center text-gray70 italic"
              >
                {/* Texto actualizado */}
                No hay pedidos pendientes.
              </td>
            </tr>
          ) : (
            <>
              {visiblePedidos.map((p) => {
                const fecha = formatearFechaCorta(
                  p.fecha_entrega_programada || p.fecha_creacion
                );
                const monto = Number(p.monto_recaudar ?? 0);

                return (
                  <tr key={p.id} className="hover:bg-gray10 transition-colors">
                    <td className="px-2 py-3 text-center text-gray70">
                      {fecha}
                    </td>
                    <td className="px-4 py-3 text-gray70">
                      {p.courier?.nombre_comercial}
                    </td>
                    <td className="px-4 py-3 text-gray70">
                      {p.nombre_cliente}
                    </td>
                    <td className="px-4 py-3 text-gray70">
                      {p.detalles?.[0]?.producto?.nombre_producto ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray70">
                      {p.detalles?.[0]?.cantidad?.toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 text-center text-gray70">
                      S/. {monto.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {getEstadoPill(p.estado_pedido)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <TableActionx
                          variant="view"
                          title="Ver"
                          onClick={() => onVer(p.id)}
                          size="sm"
                        />

                        <TableActionx
                          variant="edit"
                          title="Editar"
                          onClick={() => onEditar(p.id)}
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {emptyRows > 0 &&
                [...Array(emptyRows)].map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {[...Array(8)].map((__, i) => (
                      <td key={i} className="px-4 py-3">
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}
            </>
          )}
        </tbody>
      </table>

      {/* Paginador */}
      <div className="flex items-center justify-end gap-2 border-b border-gray90 py-3 px-3">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
        >
          &lt;
        </button>

        {pagerItems.map((p, i) =>
          typeof p === "string" ? (
            <span key={`dots-${i}`} className="px-2 text-gray70">
              {p}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-current={page === p ? "page" : undefined}
              className={[
                "w-8 h-8 flex items-center justify-center rounded",
                page === p
                  ? "bg-gray90 text-white"
                  : "bg-gray10 text-gray70 hover:bg-gray20",
              ].join(" ")}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
