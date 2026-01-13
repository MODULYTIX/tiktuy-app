// TablePedidosTerminados.tsx
import { useCallback } from 'react';
import BaseTablaPedidos from './BaseTablaPedidos';
import type { Paginated, PedidoListItem, ListByEstadoQuery } from '@/services/repartidor/pedidos/pedidos.types';
import { fetchPedidosTerminados } from '@/services/repartidor/pedidos/pedidos.api';

type Props = {
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onCambiarEstado?: (pedido: PedidoListItem) => void;
  refreshKey?: number;
};

export default function TablePedidosTerminados(props: Props) {
  const fetcher = useCallback((
    token: string,
    query: ListByEstadoQuery,
    opts?: { signal?: AbortSignal }
  ) => fetchPedidosTerminados(token, query, opts) as Promise<Paginated<PedidoListItem>>, []);

  return (
    <BaseTablaPedidos
      view="terminados"
      token={props.token}
      onVerDetalle={props.onVerDetalle}
      onCambiarEstado={props.onCambiarEstado}
      fetcher={fetcher}
      title="Pedidos Terminados"
      subtitle="Pedidos completados o finalizados."
      refreshKey={props.refreshKey}
    />
  );
}
