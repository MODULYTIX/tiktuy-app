// src/services/repartidor/pedidos/pedidos.api.ts
import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  UpdateEstadoInicialBody,
  UpdateEstadoInicialResponse,
  UpdateResultadoBody,
  UpdateResultadoResponse,
  PedidoDetalle,
  WhatsappGrupoLinkResponse,
} from "./pedidos.types";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/repartidor-pedidos`;

/* --------------------------
   Helpers
---------------------------*/

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const TZ_PE = "America/Lima";

function isYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * ✅ Normaliza fechas para QUERY / fecha_nueva (REPROGRAMADO)
 * - Acepta string ISO o "YYYY-MM-DD" o Date
 * - Devuelve SIEMPRE "YYYY-MM-DD" en TZ Perú (evita corrimientos)
 */
function toDateOnly(val?: string | Date): string | undefined {
  if (val == null) return undefined;

  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return undefined;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ_PE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(val); // YYYY-MM-DD
  }

  const s = String(val).trim();
  if (!s) return undefined;

  // si ya es YYYY-MM-DD
  if (isYMD(s)) return s;

  // si es ISO u otro formato que empiece con fecha
  const ymd = s.slice(0, 10);
  if (isYMD(ymd)) return ymd;

  // fallback: parse y formatear en TZ Perú
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_PE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * ✅ Para body: fecha_entrega_real (ENTREGADO) puede ser ISO (datetime).
 * Aquí mantenemos ISO si es Date o string.
 */
function toIsoDateTime(val?: string | Date): string | undefined {
  if (val == null) return undefined;

  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return undefined;
    return val.toISOString();
  }

  const s = String(val).trim();
  return s || undefined;
}

function toQueryHoy(q: ListPedidosHoyQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set("page", String(q.page));
  if (q.perPage !== undefined) sp.set("perPage", String(q.perPage));

  // ✅ manda YYYY-MM-DD (TZ Perú)
  const desde = toDateOnly(q.desde);
  const hasta = toDateOnly(q.hasta);
  if (desde) sp.set("desde", desde);
  if (hasta) sp.set("hasta", hasta);

  if (q.sortBy !== undefined) sp.set("sortBy", q.sortBy);
  if (q.order !== undefined) sp.set("order", q.order);

  const s = sp.toString();
  return s ? `?${s}` : "";
}

function toQueryEstado(q: ListByEstadoQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set("page", String(q.page));
  if (q.perPage !== undefined) sp.set("perPage", String(q.perPage));

  // ✅ manda YYYY-MM-DD (TZ Perú)
  const desde = toDateOnly(q.desde);
  const hasta = toDateOnly(q.hasta);
  if (desde) sp.set("desde", desde);
  if (hasta) sp.set("hasta", hasta);

  if (q.sortBy !== undefined) sp.set("sortBy", q.sortBy);
  if (q.order !== undefined) sp.set("order", q.order);

  const s = sp.toString();
  return s ? `?${s}` : "";
}

function hasMessage(v: unknown): v is { message: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { message?: unknown }).message === "string"
  );
}

function hasDetails(v: unknown): v is { details: unknown } {
  return typeof v === "object" && v !== null && "details" in (v as any);
}

async function handle<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (res.status === 204) return null as unknown as T;

  if (!res.ok) {
    let message = fallbackMsg;

    try {
      const body: any = await res.json();

      if (hasDetails(body)) {
        // eslint-disable-next-line no-console
        console.error("API error details:", body.details);
      }

      if (hasMessage(body)) message = body.message;
    } catch {
      /* ignore */
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
  return handle<Paginated<PedidoListItem>>(res, "Error al obtener pedidos de hoy");
}

/* --------------------------
   GET: Pendientes
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
  return handle<Paginated<PedidoListItem>>(res, "Error al obtener pedidos pendientes");
}

/* --------------------------
   GET: Terminados
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
  return handle<Paginated<PedidoListItem>>(res, "Error al obtener pedidos terminados");
}

/* --------------------------
   PATCH: Estado inicial
   ✅ clave: fecha_nueva debe enviarse como YYYY-MM-DD
---------------------------*/
export async function patchEstadoInicial(
  token: string,
  id: number,
  body: UpdateEstadoInicialBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateEstadoInicialResponse> {
  const payload: any = {
    ...body,
    ...(body.fecha_nueva ? { fecha_nueva: toDateOnly(body.fecha_nueva) } : {}),
  };

  if (body.resultado === "REPROGRAMADO" && !payload.fecha_nueva) {
    throw new Error("fecha_nueva inválida (usa YYYY-MM-DD).");
  }

  const res = await fetch(`${BASE_URL}/${id}/estado`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  return handle<UpdateEstadoInicialResponse>(
    res,
    "Error al actualizar el estado inicial del pedido"
  );
}

/* --------------------------
   PATCH: Resultado final
---------------------------*/
export async function patchResultado(
  token: string,
  id: number,
  body: UpdateResultadoBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateResultadoResponse> {
  if (body.resultado === "ENTREGADO") {
    if (!Number.isFinite(body.metodo_pago_id)) {
      throw new Error("metodo_pago_id inválido (undefined/NaN). Revisa metodoPagoIds.");
    }

    // ENTREGADO con evidencia => multipart
    if (body.evidenciaFile) {
      const fd = new FormData();
      fd.set("resultado", "ENTREGADO");
      fd.set("metodo_pago_id", String(body.metodo_pago_id));

      if (body.monto_recaudado !== undefined) {
        fd.set("monto_recaudado", String(body.monto_recaudado));
      }
      if (body.observacion) fd.set("observacion", body.observacion);

      const fer = toIsoDateTime(body.fecha_entrega_real);
      if (fer) fd.set("fecha_entrega_real", fer);

      // ✅ IMPORTANTE: backend usa upload.single('evidencia')
      fd.set("evidencia", body.evidenciaFile);

      const res = await fetch(`${BASE_URL}/${id}/resultado`, {
        method: "PATCH",
        headers: { ...authHeaders(token) },
        body: fd,
        signal: opts?.signal,
      });

      return handle<UpdateResultadoResponse>(res, "Error al actualizar el resultado del pedido");
    }

    // ENTREGADO sin evidencia => JSON
    const res = await fetch(`${BASE_URL}/${id}/resultado`, {
      method: "PATCH",
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resultado: "ENTREGADO",
        metodo_pago_id: body.metodo_pago_id,
        observacion: body.observacion,
        fecha_entrega_real: toIsoDateTime(body.fecha_entrega_real),
        monto_recaudado: body.monto_recaudado,
      }),
      signal: opts?.signal,
    });

    return handle<UpdateResultadoResponse>(res, "Error al actualizar el resultado del pedido");
  }

  // RECHAZADO -> JSON
  const res = await fetch(`${BASE_URL}/${id}/resultado`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resultado: "RECHAZADO",
      observacion: body.observacion,
      fecha_entrega_real: toIsoDateTime(body.fecha_entrega_real),
    }),
    signal: opts?.signal,
  });

  return handle<UpdateResultadoResponse>(res, "Error al actualizar el resultado del pedido");
}

/* --------------------------
   GET: Detalle
---------------------------*/
export async function fetchPedidoDetalle(
  token: string,
  id: number,
  opts?: { signal?: AbortSignal }
): Promise<PedidoDetalle> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });
  return handle(res, "Error al obtener detalle del pedido");
}

/* --------------------------
   GET WhatsApp Grupo
---------------------------*/
export async function fetchWhatsappGrupoLink(
  token: string,
  id: number,
  opts?: { signal?: AbortSignal }
): Promise<WhatsappGrupoLinkResponse> {
  const res = await fetch(`${BASE_URL}/${id}/whatsapp-grupo`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });

  return handle<WhatsappGrupoLinkResponse>(
    res,
    "Error al obtener el link del grupo de WhatsApp"
  );
}
