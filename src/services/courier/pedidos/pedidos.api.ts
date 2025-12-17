// src/api/pedidos.api.ts
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  AssignPedidosPayload,
  AssignPedidosResponse,
  ReassignPedidoPayload,
  ReassignPedidoApiResponse,
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

function toIso(val: string | Date): string {
  return typeof val === 'string' ? val : val.toISOString();
}

function toQueryHoy(q: ListPedidosHoyQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set('page', String(q.page));
  if (q.perPage !== undefined) sp.set('perPage', String(q.perPage));
  // ✅ NUEVO: rango opcional para /hoy
  if (q.desde !== undefined) sp.set('desde', toIso(q.desde));
  if (q.hasta !== undefined) sp.set('hasta', toIso(q.hasta));
  const s = sp.toString();
  return s ? `?${s}` : '';
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
  if (res.status === 204) return null as unknown as T;

  if (!res.ok) {
    let message = fallbackMsg;
    try {
      const body: unknown = await res.json();
      if (hasMessage(body)) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/* --------------------------
   Normalizador de paginación
---------------------------*/
function normalizePaginated<T>(raw: unknown): Paginated<T> {
  const r = raw as Record<string, unknown> | null;

  const totalItems =
    Number((r as any)?.totalItems) ||
    Number((r as any)?.total) ||
    Number((r as any)?.count) ||
    0;

  const perPage = Number((r as any)?.perPage) || Number((r as any)?.limit) || 20;
  const page = Number((r as any)?.page) || Number((r as any)?.currentPage) || 1;

  const totalPages =
    Number((r as any)?.totalPages) ||
    Number((r as any)?.total_pages) ||
    Number((r as any)?.pages) ||
    Number((r as any)?.lastPage) ||
    (totalItems && perPage ? Math.ceil(totalItems / perPage) : 1);

  return {
    items: Array.isArray((r as any)?.items) ? ((r as any).items as T[]) : [],
    page,
    perPage,
    totalItems,
    totalPages,
  };
}

/* --------------------------
   GET: ASIGNADOS HOY
   GET /courier-pedidos/hoy
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
  const data = await handle<unknown>(res, 'Error al obtener pedidos asignados de hoy');
  return normalizePaginated<PedidoListItem>(data);
}

/* --------------------------
   GET: PENDIENTES
   GET /courier-pedidos/pendientes
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
  const data = await handle<unknown>(res, 'Error al obtener pedidos pendientes');
  return normalizePaginated<PedidoListItem>(data);
}

/* --------------------------
   GET: REPROGRAMADOS
   GET /courier-pedidos/reprogramados
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
  const data = await handle<unknown>(res, 'Error al obtener pedidos reprogramados');
  return normalizePaginated<PedidoListItem>(data);
}

/* --------------------------
   GET: RECHAZADOS
   GET /courier-pedidos/rechazados
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
  const data = await handle<unknown>(res, 'Error al obtener pedidos rechazados');
  return normalizePaginated<PedidoListItem>(data);
}

/* --------------------------
   GET: ENTREGADOS
   GET /courier-pedidos/entregados
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
  const data = await handle<unknown>(res, 'Error al obtener pedidos entregados');
  return normalizePaginated<PedidoListItem>(data);
}

/* --------------------------
   GET: TERMINADOS
   GET /courier-pedidos/terminados
---------------------------*/
export async function fetchPedidosTerminados(
  token: string,
  query: ListByEstadoQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<Paginated<PedidoListItem>> {
  const res = await fetch(`${BASE_URL}/terminados${toQueryEstado(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  const data = await handle<unknown>(res, 'Error al obtener pedidos terminados');
  return normalizePaginated<PedidoListItem>(data);
}

/* --------------------------
   POST: Asignar en lote
   POST /courier-pedidos/asignar
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

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al asignar pedidos - backend:', errBody);
  }

  return handle<AssignPedidosResponse>(res, 'Error al asignar pedidos');
}

/* --------------------------
   POST: Reasignar uno
   POST /courier-pedidos/reasignar
---------------------------*/
export async function reassignPedido(
  token: string,
  payload: ReassignPedidoPayload,
  opts?: { signal?: AbortSignal }
): Promise<ReassignPedidoApiResponse> {
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}/reasignar`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: opts?.signal, // ✅ ahora sí soporta abort
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && (err as { name?: unknown }).name === 'AbortError') {
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
   GET /courier-pedidos/:id/detalle
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
