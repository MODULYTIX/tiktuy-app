// src/shared/components/ecommerce/pedidos/table/PedidosTableCompletado.tsx
import { useAuth } from "@/auth/context";
import { fetchPedidosCompletados } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import TableActionx from "@/shared/common/TableActionx";
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
  filtros: Filtros;
}

export default function PedidosTableCompletado({ onVer, filtros }: Props) {
  const { token } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  /* ============================
     CARGA INICIAL
  ============================= */
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetchPedidosCompletados(token)
      .then((res) => {
        // AHORA el backend devuelve: { data: Pedido[], pagination: {...} }
        setPedidos(res.data);
      })
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token]);

  /* ============================
     HELPERS
  ============================= */
  const parseDateInput = (s?: string) => {
    if (!s) return undefined;
    const str = s.trim();

    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const m1 = str.match(ddmmyyyy);
    if (m1) {
      const dd = Number(m1[1]);
      const mm = Number(m1[2]);
      const yyyy = Number(m1[3]);
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? undefined : d;
    }

    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    const m2 = str.match(yyyymmdd);
    if (m2) {
      const yyyy = Number(m2[1]);
      const mm = Number(m2[2]);
      const dd = Number(m2[3]);
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? undefined : d;
    }

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

  const formatearMoneda = (n: number) => `S/. ${n.toFixed(2)}`;

  const calcularMonto = (p: Pedido) =>
    Number(
      (p.detalles || []).reduce(
        (acc, d) => acc + Number(d.cantidad) * Number(d.precio_unitario),
        0
      )
    );

  const EstadoPill = ({ estado }: { estado: string }) => {
    const e = (estado || "").toLowerCase();

    const base =
      "inline-flex items-center px-2 py-[2px] rounded text-[11px] font-medium border";
    let classes = "bg-gray-50 text-gray-600 border-gray-200";

    if (e === "entregado")
      classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (e === "reprogramado")
      classes = "bg-amber-50 text-amber-700 border-amber-200";
    else if (
      e.includes("no responde") ||
      e.includes("apagado") ||
      e.includes("no pidió") ||
      e.includes("anulo") ||
      e.includes("anuló") ||
      e.includes("rechazado")
    )
      classes = "bg-red-50 text-red-700 border-red-200";

    return <span className={`${base} ${classes}`}>{estado}</span>;
  };

  /* ============================
     A) FILTROS
  ============================= */
  const filteredPedidos = useMemo(() => {
    const start = parseDateInput(filtros.fechaInicio);
    const end = parseDateInput(filtros.fechaFin);
    if (end) end.setHours(23, 59, 59);

    return pedidos.filter((p) => {
      const fechaRef =
        (p as any).fecha_entrega_real ||
        p.fecha_entrega_programada ||
        p.fecha_creacion;

      const d = fechaRef ? new Date(fechaRef) : undefined;

      if (start && d && d < start) return false;
      if (end && d && d > end) return false;

      if (filtros.courier) {
        const courierId = (p as any).courier_id ?? p.courier?.id;
        const byId = courierId != null && String(courierId) === filtros.courier;
        const byName = (p.courier?.nombre_comercial || "")
          .toLowerCase()
          .includes(filtros.courier.toLowerCase());
        if (!(byId || byName)) return false;
      }

      if (filtros.producto) {
        const needle = filtros.producto.toLowerCase();
        const ok = (p.detalles || []).some((d) => {
          const prod = d.producto;
          const byId = prod?.id != null && String(prod.id) === filtros.producto;
          const byCodigo =
            (prod as any)?.codigo &&
            String((prod as any).codigo)
              .toLowerCase()
              .includes(needle);
          const byNombre = (prod?.nombre_producto || "")
            .toLowerCase()
            .includes(needle);
          return byId || byCodigo || byNombre;
        });
        if (!ok) return false;
      }

      return true;
    });
  }, [pedidos, filtros]);

  /* ============================
     B) PAGINACIÓN
  ============================= */
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  const totalPages = Math.max(1, Math.ceil(filteredPedidos.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const visiblePedidos = useMemo(
    () => filteredPedidos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPedidos, page]
  );

  const emptyRowsCount = PAGE_SIZE - visiblePedidos.length;

  /* ============================
     RENDER
  ============================= */
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
          <col className="w-[12%]" />
          <col className="w-[8%]" />
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
          {/* LOADING */}
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <tr key={idx} className="[&>td]:px-4 [&>td]:py-3 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
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
                No hay pedidos completados.
              </td>
            </tr>
          ) : (
            <>
              {visiblePedidos.map((pedido) => {
                const fechaEntrega = formatearFechaCorta(
                  (pedido as any).fecha_entrega_real ||
                    pedido.fecha_entrega_programada ||
                    pedido.fecha_creacion
                );

                const productoPrincipal =
                  pedido.detalles?.[0]?.producto?.nombre_producto ?? "-";

                const cantidadPrincipal =
                  pedido.detalles?.[0]?.cantidad != null
                    ? String(pedido.detalles[0].cantidad).padStart(2, "0")
                    : "00";

                const monto = formatearMoneda(calcularMonto(pedido));

                const estado = pedido.estado_pedido ?? "—";

                return (
                  <tr
                    key={pedido.id}
                    className="hover:bg-gray10 transition-colors"
                  >
                    <td className="px-2 py-3 text-gray70 text-center">
                      {fechaEntrega}
                    </td>

                    <td className="px-4 py-3 text-gray70">
                      {pedido.courier?.nombre_comercial}
                    </td>

                    <td className="px-4 py-3 text-gray70">
                      {pedido.nombre_cliente}
                    </td>

                    <td className="px-4 py-3 text-gray70">
                      {productoPrincipal}
                    </td>

                    <td className="px-4 py-3 text-gray70 text-center">
                      {cantidadPrincipal}
                    </td>

                    <td className="px-4 py-3 text-gray70 text-center">
                      {monto}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <EstadoPill estado={estado} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <TableActionx
                          variant="view"
                          title="Ver Pedido"
                          onClick={() => onVer(pedido.id)}
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* FILAS VACÍAS PARA MANTENER ALTURA */}
              {emptyRowsCount > 0 &&
                Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="hover:bg-transparent">
                    {Array.from({ length: 8 }).map((_, i) => (
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

      {/* PAGINADOR */}
      <div className="flex items-center justify-end gap-2 border-b border-gray90 py-3 px-3">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded 
                     hover:bg-gray20 disabled:opacity-50"
        >
          &lt;
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPage(idx + 1)}
            className={`w-8 h-8 rounded ${
              page === idx + 1
                ? "bg-gray90 text-white"
                : "bg-gray10 text-gray70 hover:bg-gray20"
            }`}
          >
            {idx + 1}
          </button>
        ))}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded 
                     hover:bg-gray20 disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
