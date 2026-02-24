// src/shared/components/ecommerce/pedidos/table/PedidosTableCompletado.tsx
import { useAuth } from "@/auth/context";
import { fetchPedidos } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import TableActionx from "@/shared/common/TableActionx";
import { useEffect, useState } from "react";

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
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    perPage: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  // Reset page if filters change
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  /* ============================
     CARGA
  ============================= */
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    fetchPedidos(token, 'Terminado', page, PAGE_SIZE, {
      courierId: Number.isFinite(Number(filtros.courier))
        ? Number(filtros.courier)
        : undefined,
      productoId: filtros.producto ? Number(filtros.producto) : undefined,
      fechaInicio: filtros.fechaInicio || undefined,
      fechaFin: filtros.fechaFin || undefined,
    })
      .then((res) => {
        setPedidos(res.data || []);
        setServerPagination(res.pagination || {
          page: 1,
          perPage: PAGE_SIZE,
          total: (res.data || []).length,
          totalPages: 1
        });
      })
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token, page, filtros]);

  const totalPages = serverPagination.totalPages;

  /* ============================
     HELPERS
  ============================= */
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

  const visiblePedidos = pedidos;
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
          ) : pedidos.length === 0 ? (
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
            className={`w-8 h-8 rounded ${page === idx + 1
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
