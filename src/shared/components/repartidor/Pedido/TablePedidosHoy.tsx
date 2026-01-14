import { useCallback } from "react";
import BaseTablaPedidos from "./BaseTablaPedidos";
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
} from "@/services/repartidor/pedidos/pedidos.types";
import { fetchPedidosHoy } from "@/services/repartidor/pedidos/pedidos.api";

/**
 * Normaliza query para que nunca pase Date al backend
 * y evitar el error de TS / corrimientos por timezone.
 */
function normalizeHoyQuery(q: ListPedidosHoyQuery): ListPedidosHoyQuery {
  const toDateOnly = (v?: string | Date) => {
    if (!v) return undefined;
    if (typeof v === "string") return v.slice(0, 10); // "YYYY-MM-DD" o ISO -> dateOnly
    // Date -> YYYY-MM-DD (sin ISO UTC)
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

export default function TablePedidosHoy(props: Props) {
  const fetcher = useCallback(
    (
      token: string,
      query: ListPedidosHoyQuery,
      opts?: { signal?: AbortSignal }
    ): Promise<Paginated<PedidoListItem>> => {
      //  fuerza query limpio (string)
      const q = normalizeHoyQuery(query);
      return fetchPedidosHoy(token, q, opts);
    },
    []
  );

  return (
    <BaseTablaPedidos
      view="hoy"
      token={props.token}
      onVerDetalle={props.onVerDetalle}
      onCambiarEstado={props.onCambiarEstado}
      fetcher={fetcher}
      title="Pedidos para Hoy"
      subtitle="Pedidos programados para hoy asignados a ti."
      refreshKey={props.refreshKey}
    />
  );
}
