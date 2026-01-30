import { useAuth } from "@/auth/context";
import { fetchPedidos } from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import TableActionx from "@/shared/common/TableActionx";
import { useEffect, useMemo, useState } from "react";

type Filtros = {
  courier: string;
  producto: string;
  fechaInicio: string;
  fechaFin: string;
};

interface PedidosTableGeneradoProps {
  onVer: (pedidoId: number) => void;
  onEditar: (pedidoId: number) => void;
  filtros: Filtros;
  refreshKey: number;
}

export default function PedidosTableGenerado({
  onVer,
  onEditar,
  filtros,
  refreshKey,
}: PedidosTableGeneradoProps) {
  const { token } = useAuth();

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    perPage: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);

  /* ==========================================================
     FETCH PAGINADO DEL BACKEND
     AHORA TRAE ESTADO "Asignado"
     ========================================================== */

  // Cuando cambian los filtros, volvemos a la pág 1
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  useEffect(() => {
    if (!token) return;

    setLoading(true);

    fetchPedidos(token, 'Asignado', page, PAGE_SIZE, {
      courierId: Number.isFinite(Number(filtros.courier))
        ? Number(filtros.courier)
        : undefined,
      productoId: filtros.producto ? Number(filtros.producto) : undefined,
      fechaInicio: filtros.fechaInicio || undefined,
      fechaFin: filtros.fechaFin || undefined,
    })
      .then((res) => {
        setPedidos(res.data || []);
        setServerPagination(res.pagination);
      })
      .finally(() => setLoading(false));
  }, [token, page, refreshKey, filtros]);


  const totalPages = serverPagination.totalPages;

  /* ==========================================================
     PAGINADOR
     ========================================================== */
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

      if (start > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const emptyRowsCount = PAGE_SIZE - pedidos.length;

  /* ==========================================================
     TABLA
     ========================================================== */
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[20%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
        </colgroup>

        <thead className="bg-[#E5E7EB]">
          <tr className="text-gray70 font-medium">
            <th className="px-2 py-3 text-center">Fec. Entrega</th>
            <th className="px-4 py-3 text-left">Courier</th>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">Producto</th>
            <th className="px-4 py-3 text-center">Cantidad</th>
            <th className="px-4 py-3 text-center">Monto</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray20">
          {/* Skeleton */}
          {loading ? (
            [...Array(PAGE_SIZE)].map((_, idx) => (
              <tr key={idx} className="[&>td]:px-4 [&>td]:py-3 animate-pulse">
                {[...Array(7)].map((_, i) => (
                  <td key={i}>
                    <div className="h-4 bg-gray20 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : pedidos.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-4 text-center text-gray70 italic"
              >
                No hay pedidos asignados.
              </td>
            </tr>
          ) : (
            <>
              {pedidos.map((p) => {
                const fecha = p.fecha_entrega_programada
                  ? p.fecha_entrega_programada.slice(0, 10).split("-").reverse().join("/")
                  : "-";

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

              {emptyRowsCount > 0 &&
                [...Array(emptyRowsCount)].map((_, idx) => (
                  <tr key={idx}>
                    {[...Array(7)].map((__, i) => (
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
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50"
        >
          &lt;
        </button>

        {pagerItems.map((p, i) =>
          typeof p === "string" ? (
            <span key={i} className="px-2 text-gray70">
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
