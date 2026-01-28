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
  ReprogramarPedidoPayload,
  ReprogramarPedidoResponse,
  ExportPedidosAsignadosPdfPayload,
} from "./pedidos.types";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/courier-pedidos`;

/* --------------------------
   Helpers (sin any)
---------------------------*/
const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/** Normaliza a YYYY-MM-DD (en zona Perú) para evitar corrimientos.
 * Acepta Date | string (YYYY-MM-DD o ISO).
 */
const TZ_PE = "America/Lima";

function toDateOnly(val: string | Date): string {
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) throw new Error("Fecha inválida");
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ_PE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(val); // YYYY-MM-DD
  }

  const s = String(val ?? "").trim();
  if (!s) throw new Error("Fecha inválida");

  // ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // si es ISO, tomar los 10 primeros
  const ymd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;

  // fallback: parse + formateo en Perú
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("Fecha inválida");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_PE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}


function toQueryHoy(q: ListPedidosHoyQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set("page", String(q.page));
  if (q.perPage !== undefined) sp.set("perPage", String(q.perPage));

  // Rango opcional para /hoy (lo dejamos tal cual porque a ti te funciona bien)
  if (q.desde !== undefined) sp.set("desde", toDateOnly(q.desde));
  if (q.hasta !== undefined) sp.set("hasta", toDateOnly(q.hasta));

  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Tu backend está interpretando `hasta` como límite no inclusivo / inicio de día.
 * Entonces enviamos `hasta = (hasta + 1 día)` para que sea inclusivo.
 *
 * Ej:
 * UI: desde=20, hasta=20  -> API manda hasta=21  -> aparecen los del 20 
 */
function toQueryEstado(q: ListByEstadoQuery = {}) {
  const sp = new URLSearchParams();

  if (q.page !== undefined) sp.set("page", String(q.page));
  if (q.perPage !== undefined) sp.set("perPage", String(q.perPage));

  if (q.desde !== undefined) {
    sp.set("desde", toDateOnly(q.desde));
  }

  if (q.hasta !== undefined) {
    sp.set("hasta", toDateOnly(q.hasta)); 
  }

  if (q.sortBy) sp.set("sortBy", q.sortBy);
  if (q.order) sp.set("order", q.order);

  return `?${sp.toString()}`;
}

function hasMessage(v: unknown): v is { message: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { message?: unknown }).message === "string"
  );
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
  const data = await handle<unknown>(res, "Error al obtener pedidos asignados de hoy");
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
  const data = await handle<unknown>(res, "Error al obtener pedidos pendientes");
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
  const data = await handle<unknown>(res, "Error al obtener pedidos reprogramados");
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
  const data = await handle<unknown>(res, "Error al obtener pedidos rechazados");
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
  const data = await handle<unknown>(res, "Error al obtener pedidos entregados");
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
  const data = await handle<unknown>(res, "Error al obtener pedidos terminados");
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
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: "Sin cuerpo de error" }));
    console.error("Error al asignar pedidos ", errBody);
  }

  return handle<AssignPedidosResponse>(res, "Error al asignar pedidos");
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
      method: "POST",
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: opts?.signal,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && (err as { name?: unknown }).name === "AbortError") {
      throw new Error("La operación fue cancelada. Vuelve a intentarlo.");
    }
    throw err;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: "Sin cuerpo de error" }));
    console.error("Error al reasignar pedido - backend:", errBody);
  }

  return handle<ReassignPedidoApiResponse>(res, "Error al reasignar pedido");
}

/* --------------------------
   POST: Reprogramar pedido (antes de asignar)
   POST /courier-pedidos/reprogramar-antes-asignar
---------------------------*/
export async function reprogramarPedido(
  token: string,
  payload: ReprogramarPedidoPayload,
  opts?: { signal?: AbortSignal }
): Promise<ReprogramarPedidoResponse> {
  if (!payload?.pedido_id) throw new Error("pedido_id es requerido");
  if (payload.fecha_entrega_programada === undefined || payload.fecha_entrega_programada === null) {
    throw new Error("fecha_entrega_programada es requerida");
  }

  const res = await fetch(`${BASE_URL}/reprogramar-antes-asignar`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pedido_id: payload.pedido_id,
      fecha_entrega_programada: payload.fecha_entrega_programada,
      observacion: payload.observacion ?? "",
    }),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: "Sin cuerpo de error" }));
    console.error("Error al reprogramar pedido", errBody);
  }

  return handle<ReprogramarPedidoResponse>(res, "Error al reprogramar pedido");
}

/* --------------------------
   GET: DETALLE DE PEDIDO
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
  return handle<PedidoDetalle>(res, "Error al obtener detalle del pedido");
}

export async function exportPedidosAsignadosPdf(
  token: string,
  payload: ExportPedidosAsignadosPdfPayload,
  opts?: { signal?: AbortSignal }
): Promise<Blob> {
  if (!payload?.pedidoIds?.length) {
    throw new Error("pedidoIds es requerido");
  }

  const res = await fetch(`${BASE_URL}/export-asignados-pdf`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
      Accept: "application/pdf",
    },
    body: JSON.stringify({
      pedidoIds: payload.pedidoIds,
      sedeId: payload.sedeId,
    }),
    signal: opts?.signal,
  });

  if (!res.ok) {
    // intenta leer error JSON (message), si no hay, fallback
    let message = "Error al exportar PDF";
    try {
      const body: unknown = await res.json();
      if (hasMessage(body)) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  // ✅ IMPORTANT: esto NO es JSON, es PDF
  const blob = await res.blob();

  // Validación ligera por si el backend respondió otra cosa
  if (!blob.type.includes("pdf")) {
    // Puede pasar si un proxy responde HTML
    throw new Error("La respuesta no es un PDF válido.");
  }

  return blob;
}
