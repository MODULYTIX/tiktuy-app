import { useCallback } from "react";
import BaseTablaPedidos from "./BaseTablaPedidos";
import type {
  Paginated,
  PedidoListItem,
  ListByEstadoQuery,
} from "@/services/repartidor/pedidos/pedidos.types";
import { fetchPedidosPendientes } from "@/services/repartidor/pedidos/pedidos.api";

/** ✅ Normaliza query para que nunca pase Date al backend */
function normalizeEstadoQuery(q: ListByEstadoQuery): ListByEstadoQuery {
  const toDateOnly = (v?: string | Date) => {
    if (!v) return undefined;
    if (typeof v === "string") return v.slice(0, 10); // ISO o YYYY-MM-DD -> YYYY-MM-DD
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    ...q,
    desde: toDateOnly(q.desde),
    hasta: toDateOnly(q.hasta),
  };
}

type Props = {
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onCambiarEstado?: (pedido: PedidoListItem) => void;
  refreshKey?: number;
};

export default function TablePedidosPendientes(props: Props) {
  const fetcher = useCallback(
    (
      token: string,
      query: ListByEstadoQuery,
      opts?: { signal?: AbortSignal }
    ): Promise<Paginated<PedidoListItem>> => {
      const q = normalizeEstadoQuery(query);
      return fetchPedidosPendientes(token, q, opts);
    },
    []
  );

  return (
    <BaseTablaPedidos
      view="pendientes"
      token={props.token}
      onVerDetalle={props.onVerDetalle}
      onCambiarEstado={props.onCambiarEstado}
      fetcher={fetcher}
      title="Pedidos Pendientes"
      subtitle="Pedidos en gestión."
      refreshKey={props.refreshKey}
    />
  );
}
