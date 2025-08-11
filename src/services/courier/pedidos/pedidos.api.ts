// src/api/pedidos.api.ts
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  AssignPedidosPayload,
  AssignPedidosResponse,
  ReassignPedidoPayload,
  ReassignPedidoResponse,
} from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/courier-pedidos`;

/* --------------------------
   Helpers
---------------------------*/

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

function toQueryHoy(q: ListPedidosHoyQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set('page', String(q.page));
  if (q.perPage !== undefined) sp.set('perPage', String(q.perPage));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function toIso(val: string | Date): string {
  return typeof val === 'string' ? val : val.toISOString();
}

function toQueryEstado(q: ListByEstadoQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set('page', String(q.page));
  if (q.perPage !== undefined) sp.set('perPage', String(q.perPage));
  if (q.desde !== undefined) sp.set('desde', toIso(q.desde));
  if (q.hasta !== undefined) sp.set('hasta', toIso(q.hasta));
  if (q.sortBy !== undefined) sp.set('sortBy', q.sortBy);
  if (q.order !== undefined) sp.set('order', q.order);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function hasMessage(v: unknown): v is { message: string } {
  return typeof v === 'object' && v !== null && typeof (v as { message?: unknown }).message === 'string';
}

async function handle<T>(res: Response, fallbackMsg: string): Promise<T> {
  // Soporte 204 (no body)
  if (res.status === 204) {
    return null as unknown as T;
  }

  if (!res.ok) {
    let message = fallbackMsg;
    try {
      const body: unknown = await res.json();
      if (hasMessage(body)) message = body.message;
    } catch {
      // ignorar parse error
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/* --------------------------
   GET: Pedidos HOY
---------------------------*/
export async function fetchPedidosHoy(
  token: string,
  query: ListPedidosHoyQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/hoy${toQueryHoy(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos de hoy');
}

/* --------------------------
   GET: Reprogramados
---------------------------*/
export async function fetchPedidosReprogramados(
  token: string,
  query: ListByEstadoQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/reprogramados${toQueryEstado(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos reprogramados');
}

/* --------------------------
   GET: Rechazados
---------------------------*/
export async function fetchPedidosRechazados(
  token: string,
  query: ListByEstadoQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/rechazados${toQueryEstado(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos rechazados');
}

/* --------------------------
   GET: Entregados
---------------------------*/
export async function fetchPedidosEntregados(
  token: string,
  query: ListByEstadoQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/entregados${toQueryEstado(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos entregados');
}

/* --------------------------
   POST: Asignar en lote
---------------------------*/
export async function assignPedidos(
  token: string,
  payload: AssignPedidosPayload,
  opts?: { signal?: AbortSignal }
): Promise<AssignPedidosResponse> {
  console.log('🚀 Enviando payload a /courier-pedidos/asignar:', payload);

  const res = await fetch(`${BASE_URL}/asignar`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al asignar pedidos - backend:', errBody);
  }
  return handle<AssignPedidosResponse>(res, 'Error al asignar pedidos');
}

/* --------------------------
   POST: Reasignar uno
---------------------------*/
export async function reassignPedido(
  token: string,
  payload: ReassignPedidoPayload,
  opts?: { signal?: AbortSignal }
): Promise<ReassignPedidoResponse> {
  console.log('🚀 Enviando payload a /courier-pedidos/reasignar:', payload);

  const res = await fetch(`${BASE_URL}/reasignar`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al reasignar pedido - backend:', errBody);
  }
  return handle<ReassignPedidoResponse>(res, 'Error al reasignar pedido');
}
