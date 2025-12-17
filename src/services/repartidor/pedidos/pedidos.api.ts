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
} from "./pedidos.types";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/repartidor-pedidos`;

/* --------------------------
   Helpers
---------------------------*/

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

function toIso(val: string | Date): string {
  return typeof val === "string" ? val : val.toISOString();
}

function toQueryHoy(q: ListPedidosHoyQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set("page", String(q.page));
  if (q.perPage !== undefined) sp.set("perPage", String(q.perPage));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function toQueryEstado(q: ListByEstadoQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set("page", String(q.page));
  if (q.perPage !== undefined) sp.set("perPage", String(q.perPage));
  if (q.desde !== undefined) sp.set("desde", toIso(q.desde));
  if (q.hasta !== undefined) sp.set("hasta", toIso(q.hasta));
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

      // ✅ imprime details completos (Joi)
      if (hasDetails(body)) {
        // eslint-disable-next-line no-console
        console.error("API error details:", body.details);
      }

      if (hasMessage(body)) message = body.message;
    } catch {
      /* ignore parse error */
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
---------------------------*/
export async function patchEstadoInicial(
  token: string,
  id: number,
  body: UpdateEstadoInicialBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateEstadoInicialResponse> {
  const payload = {
    ...body,
    ...(body.fecha_nueva ? { fecha_nueva: toIso(body.fecha_nueva) } : {}),
  };

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
   - ENTREGADO:
       - si hay evidenciaFile => multipart/form-data (campo: evidencia)
       - si NO hay evidenciaFile => JSON
   - RECHAZADO: JSON
---------------------------*/
export async function patchResultado(
  token: string,
  id: number,
  body: UpdateResultadoBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateResultadoResponse> {
  // ✅ Validación defensiva (evita mandar undefined)
  if (body.resultado === "ENTREGADO") {
    if (!Number.isFinite(body.metodo_pago_id)) {
      throw new Error("metodo_pago_id inválido (undefined/NaN). Revisa metodoPagoIds.");
    }

    // 1) ENTREGADO con evidencia => multipart
    if (body.evidenciaFile) {
      const fd = new FormData();
      fd.set("resultado", "ENTREGADO");
      fd.set("metodo_pago_id", String(body.metodo_pago_id));

      if (body.monto_recaudado !== undefined) {
        fd.set("monto_recaudado", String(body.monto_recaudado));
      }
      if (body.observacion) fd.set("observacion", body.observacion);
      if (body.fecha_entrega_real) fd.set("fecha_entrega_real", toIso(body.fecha_entrega_real));

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

    // 2) ENTREGADO sin evidencia (ej: EFECTIVO) => JSON
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
        fecha_entrega_real: body.fecha_entrega_real ? toIso(body.fecha_entrega_real) : undefined,
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
      fecha_entrega_real: body.fecha_entrega_real ? toIso(body.fecha_entrega_real) : undefined,
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
