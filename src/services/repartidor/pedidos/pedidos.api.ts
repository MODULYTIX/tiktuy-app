import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  UpdateEstadoInicialBody,
  UpdateEstadoInicialResponse,
  UpdateResultadoBody,
  UpdateResultadoResponse,
} from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/repartidor-pedidos`;

/* --------------------------
   Helpers
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
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { message?: unknown }).message === 'string'
  );
}

async function handle<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (res.status === 204) return null as unknown as T;

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
   GET: Pedidos HOY (asignados al motorizado)
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
  return handle<Paginated<PedidoListItem>>(
    res,
    'Error al obtener pedidos de hoy'
  );
}

/* --------------------------
   GET: Pedidos pendientes (recepcionará hoy / reprogramado)
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
  return handle<Paginated<PedidoListItem>>(
    res,
    'Error al obtener pedidos pendientes'
  );
}

/* --------------------------
   GET: Pedidos terminados (entregado / rechazado / no responde / anuló)
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
  return handle<Paginated<PedidoListItem>>(
    res,
    'Error al obtener pedidos terminados'
  );
}

/* --------------------------
   PATCH: Cambiar estado inicial (desde "Pendiente")
   Endpoint backend: PATCH /repartidor-pedidos/:id/estado
---------------------------*/
export async function patchEstadoInicial(
  token: string,
  id: number,
  body: UpdateEstadoInicialBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateEstadoInicialResponse> {
  // Normalizamos fecha si viene como Date
  const payload = {
    ...body,
    ...(body.fecha_nueva ? { fecha_nueva: toIso(body.fecha_nueva) } : {}),
  };

  const res = await fetch(`${BASE_URL}/${id}/estado`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  return handle<UpdateEstadoInicialResponse>(
    res,
    'Error al actualizar el estado inicial del pedido'
  );
}

/* --------------------------
   PATCH: Resultado de entrega / cierre
   Endpoint backend: PATCH /repartidor-pedidos/:id/resultado
   - Si resultado = ENTREGADO y se adjunta evidencia → multipart/form-data
   - En otros casos, JSON (resultado + observacion)
---------------------------*/
export async function patchResultado(
  token: string,
  id: number,
  body: UpdateResultadoBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateResultadoResponse> {
  // Si es ENTREGADO, preferimos multipart para permitir evidencia
  if (body.resultado === 'ENTREGADO') {
    const fd = new FormData();
    fd.set('resultado', body.resultado);
    if (body.monto_recaudado !== undefined)
      fd.set('monto_recaudado', String(body.monto_recaudado));
    if (body.observacion) fd.set('observacion', body.observacion);
    if (body.evidenciaFile) fd.set('evidencia', body.evidenciaFile);

    const res = await fetch(`${BASE_URL}/${id}/resultado`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
      },
      body: fd,
      signal: opts?.signal,
    });

    return handle<UpdateResultadoResponse>(
      res,
      'Error al actualizar el resultado del pedido'
    );
  }

  // Para RECHAZADO → JSON (NO usar aquí NO_RESPONDE ni ANULO)
  const res = await fetch(`${BASE_URL}/${id}/resultado`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resultado: 'RECHAZADO',
      observacion: body.observacion,
      // fecha_entrega_real NO aplica para RECHAZADO
    }),
    signal: opts?.signal,
  });

  return handle<UpdateResultadoResponse>(
    res,
    'Error al actualizar el resultado del pedido'
  );
}
