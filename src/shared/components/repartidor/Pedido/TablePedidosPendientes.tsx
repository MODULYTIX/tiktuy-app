import { useCallback } from 'react';
import BaseTablaPedidos from './BaseTablaPedidos';
import type { Paginated, PedidoListItem, ListByEstadoQuery } from '@/services/repartidor/pedidos/pedidos.types';
import { fetchPedidosPendientes } from '@/services/repartidor/pedidos/pedidos.api';

type Props = {
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onCambiarEstado?: (pedido: PedidoListItem) => void;
};

export default function TablePedidosPendientes(props: Props) {
  const fetcher = useCallback((
    token: string,
    query: ListByEstadoQuery,
    opts?: { signal?: AbortSignal }
  ) =>
    fetchPedidosPendientes(token, query, opts) as Promise<Paginated<PedidoListItem>>,
  []);

  return (
    <BaseTablaPedidos
      view="pendientes"
      token={props.token}
      onVerDetalle={props.onVerDetalle}
      onCambiarEstado={props.onCambiarEstado}
      fetcher={fetcher}
      title="Pedidos Pendientes"
      subtitle="Pedidos en gestión (recepcionará hoy / reprogramado)."
    />
  );
}
