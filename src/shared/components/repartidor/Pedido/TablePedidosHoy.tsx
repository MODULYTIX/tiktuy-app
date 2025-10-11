import { useCallback } from 'react';
import BaseTablaPedidos from './BaseTablaPedidos';
import type { Paginated, PedidoListItem, ListPedidosHoyQuery } from '@/services/repartidor/pedidos/pedidos.types';
import { fetchPedidosHoy } from '@/services/repartidor/pedidos/pedidos.api';

type Props = {
  token: string;
  onVerDetalle?: (pedidoId: number) => void;
  onCambiarEstado?: (pedido: PedidoListItem) => void;
};

export default function TablePedidosHoy(props: Props) {
  const fetcher = useCallback((
    token: string,
    query: ListPedidosHoyQuery,
    opts?: { signal?: AbortSignal }
  ) =>
    fetchPedidosHoy(token, query, opts) as Promise<Paginated<PedidoListItem>>,
  []);

  return (
    <BaseTablaPedidos
      view="hoy"
      token={props.token}
      onVerDetalle={props.onVerDetalle}
      onCambiarEstado={props.onCambiarEstado}
      fetcher={fetcher}
      title="Pedidos para Hoy"
      subtitle="Pedidos programados para hoy asignados a ti."
    />
  );
}
