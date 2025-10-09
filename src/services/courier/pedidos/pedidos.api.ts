// src/api/pedidos.api.ts
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  AssignPedidosPayload,
  AssignPedidosResponse,
  ReassignPedidoPayload,
  ReassignPedidoApiResponse, // 👈 usamos este
  PedidoDetalle,
} from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/courier-pedidos`;

/* --------------------------
   Helpers (sin any)
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
      /* ignore parse error */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/* --------------------------
   GET: ASIGNADOS (solo estado Asignado)
   Endpoint esperado: GET /courier-pedidos/hoy
---------------------------*/
export async function fetchPedidosAsignadosHoy(
  token: string,
  query: ListPedidosHoyQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/hoy${toQueryHoy(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos asignados de hoy');
}

/* --------------------------
   GET: PENDIENTES (agregado de estados)
   Endpoint esperado: GET /courier-pedidos/pendientes
---------------------------*/
export async function fetchPedidosPendientes(
  token: string,
  query: ListByEstadoQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/pendientes${toQueryEstado(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos pendientes');
}

/* --------------------------
   GET: TERMINADOS (Entregados)
   Endpoint esperado: GET /courier-pedidos/entregados
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
  const res = await fetch(`${BASE_URL}/asignar`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  // Log de error si el backend devolvió mensaje
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al asignar pedidos - backend:', errBody);
  }
  return handle<AssignPedidosResponse>(res, 'Error al asignar pedidos');
}

/* --------------------------
   POST: Reasignar uno
   IMPORTANTE: NO pasar signal para evitar "signal is aborted without reason"
   cuando el modal se desmonta o cambia la vista.
---------------------------*/
export async function reassignPedido(
  token: string,
  payload: ReassignPedidoPayload,
  _opts?: { signal?: AbortSignal } // mantenemos la firma por compatibilidad
): Promise<ReassignPedidoApiResponse> {
  void _opts; // 👈 evita el warning de no-used-vars sin usarlo realmente

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/reasignar`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // NO pasar "signal" aquí
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('La operación fue cancelada. Vuelve a intentarlo.');
    }
    throw err;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al reasignar pedido - backend:', errBody);
  }
  return handle<ReassignPedidoApiResponse>(res, 'Error al reasignar pedido');
}

/* --------------------------
   GET: DETALLE DE PEDIDO (ojito 👁️)
   Endpoint esperado: GET /courier-pedidos/:id/detalle
---------------------------*/
export async function fetchPedidoDetalle(
  token: string,
  pedidoId: number,
  opts?: { signal?: AbortSignal }
): Promise<PedidoDetalle> {
  const res = await fetch(`${BASE_URL}/${pedidoId}/detalle`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<PedidoDetalle>(res, 'Error al obtener detalle del pedido');
}

/* (opcional) Si usas una ruta /terminados distinta a /entregados */
export async function fetchPedidosTerminados(
  token: string,
  query: ListByEstadoQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/terminados${toQueryEstado(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle<Paginated<PedidoListItem>>(res, 'Error al obtener pedidos terminados');
}
