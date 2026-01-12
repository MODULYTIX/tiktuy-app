// src/services/courier/cuadre_saldo/cuadreSaldo.api.ts
import type {
  ListPedidosResp,
  ListPedidosParams,
  UpdateServicioPayload,
  UpdateServicioCourierPayload,
  AbonarPayload,
  ListMotorizadosResp,
  ListSedesCuadreResp,
  DetalleServiciosDiaParams,
  DetalleServiciosDiaResp,
} from "./cuadreSaldo.types";

/* ================== Config / Helpers ================== */
const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}`.replace(
  /\/$/,
  ""
);

/** Build URL with query params (omite undefined/null/"") */
function withQuery(
  basePath: string,
  params: Record<string, string | number | boolean | undefined | null>
) {
  // ✅ soporta basePath con o sin "/"
  const path = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const url = new URL(path, BASE_URL);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });

  return url.toString();
}

function authHeaders(token: string, contentType?: "json") {
  const base: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (contentType === "json") base["Content-Type"] = "application/json";
  base["Accept"] = "application/json";
  return base;
}

/** Fetch con errores descriptivos (propaga message/error/detail del backend) */
async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      if (j) {
        msg =
          j.message ||
          j.error ||
          j.detail ||
          (Array.isArray(j.errors) &&
            j.errors.length &&
            (j.errors[0]?.message || j.errors[0])) ||
          msg;
      } else if (text) {
        msg = text;
      }
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  if (!text) return {} as T; // 204/empty
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================== ✅ Normalizers (NO cambian lógica, solo compat de campos) ================== */

/**
 * Normaliza un item de pedido para soportar:
 * - observacion_estado (snake_case) -> observacionEstado (camelCase)
 * - alias opcional motivoRechazo = observacionEstado (si lo quieres pintar en UI)
 *
 * Si el backend ya manda camelCase, no rompe.
 */
type AnyObj = Record<string, unknown>;

function isObj(v: unknown): v is AnyObj {
  return v !== null && typeof v === "object";
}

/**
 * Normaliza un item para compat:
 * - observacion_estado -> observacionEstado
 * - motivoRechazo (alias opcional) = observacionEstado
 */
function normalizePedidoItem<T>(it: T): T {
  if (!isObj(it)) return it;

  // mutamos el objeto pero sin usar "any"
  const obj = it as AnyObj;

  if (obj["observacionEstado"] == null && obj["observacion_estado"] != null) {
    obj["observacionEstado"] = obj["observacion_estado"];
  }

  if (obj["motivoRechazo"] == null && obj["observacionEstado"] != null) {
    obj["motivoRechazo"] = obj["observacionEstado"];
  }

  return it;
}

function normalizeListPedidosResp(data: ListPedidosResp): ListPedidosResp {
  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizePedidoItem) : [],
  };
}

function normalizeDetalleServiciosResp(data: DetalleServiciosDiaResp): DetalleServiciosDiaResp {
  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizePedidoItem) : [],
  };
}

/* ================== API Calls ================== */

/** GET /courier/cuadre-saldo/pedidos */
export async function listPedidos(token: string, params: ListPedidosParams): Promise<ListPedidosResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");

  const url = withQuery("/courier/cuadre-saldo/pedidos", {
    motorizadoId: params.motorizadoId,
    sedeId: params.sedeId, // ✅
    desde: params.desde,
    hasta: params.hasta,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  });

  const data = await request<ListPedidosResp>(url, { headers: authHeaders(token) });
  return normalizeListPedidosResp(data);
}

/** (alias) GET /courier/cuadre-saldo */
export async function listPedidosAlias(
  token: string,
  params: ListPedidosParams
): Promise<ListPedidosResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");

  const url = withQuery("/courier/cuadre-saldo", {
    motorizadoId: params.motorizadoId,
    sedeId: params.sedeId,
    desde: params.desde,
    hasta: params.hasta,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  });

  const data = await request<ListPedidosResp>(url, { headers: authHeaders(token) });
  return normalizeListPedidosResp(data);
}

/** PUT /courier/cuadre-saldo/pedidos/:id/servicio  (servicio REPARTIDOR) */
export async function updateServicio(
  token: string,
  pedidoId: number,
  payload: UpdateServicioPayload
): Promise<{ id: number; servicio: number | null; motivo?: string | null; observacionEstado?: string | null; motivoRechazo?: string | null }> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  if (!Number.isFinite(pedidoId) || pedidoId <= 0) throw new Error("pedidoId es requerido.");

  const url = `${BASE_URL}/courier/cuadre-saldo/pedidos/${pedidoId}/servicio`;

  const data = await request<any>(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(payload),
  });

  return normalizePedidoItem(data);
}

/** PUT /courier/cuadre-saldo/pedidos/:id/servicio-courier  (servicio COURIER) */
export async function updateServicioCourier(
  token: string,
  pedidoId: number,
  payload: UpdateServicioCourierPayload
): Promise<{ id: number; servicioCourier: number | null }> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  if (!Number.isFinite(pedidoId) || pedidoId <= 0) throw new Error("pedidoId es requerido.");

  const url = `${BASE_URL}/courier/cuadre-saldo/pedidos/${pedidoId}/servicio-courier`;

  return request(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(payload),
  });
}

/** PUT /courier/cuadre-saldo/abonar */
export async function abonarPedidos(
  token: string,
  payload: AbonarPayload
): Promise<{ updated: number; abonado: boolean; totalServicioSeleccionado: number }> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  if (!payload?.pedidoIds?.length) throw new Error("pedidoIds no puede estar vacío.");

  const url = `${BASE_URL}/courier/cuadre-saldo/abonar`;

  return request(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(payload),
  });
}

/**
 * GET /courier/cuadre-saldo/motorizados
 * ✅ IMPORTANTE: devolvemos SIEMPRE un ARRAY para que `motorizados.map(...)` no reviente.
 */
export async function listMotorizados(token: string): Promise<ListMotorizadosResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  const url = `${BASE_URL}/courier/cuadre-saldo/motorizados`;

  const resp = await request<any>(url, { headers: authHeaders(token) });

  // controller: { items: [...] } (recomendado)
  if (resp && Array.isArray(resp.items)) return resp.items as ListMotorizadosResp;

  // compat: [...]
  if (Array.isArray(resp)) return resp as ListMotorizadosResp;

  // compat rara: { data: [...] }
  if (resp && Array.isArray(resp.data)) return resp.data as ListMotorizadosResp;

  return [] as ListMotorizadosResp;
}

/** GET /courier/cuadre-saldo/sedes */
export async function listSedesCuadre(token: string): Promise<ListSedesCuadreResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  const url = `${BASE_URL}/courier/cuadre-saldo/sedes`;
  return request<ListSedesCuadreResp>(url, { headers: authHeaders(token) });
}

/**
 * ✅ NUEVO
 * GET /courier/cuadre-saldo/detalle-servicios-dia?fecha=YYYY-MM-DD&sedeId?&motorizadoId?
 */
export async function getDetalleServiciosDia(
  token: string,
  params: DetalleServiciosDiaParams
): Promise<DetalleServiciosDiaResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  if (!params?.fecha) throw new Error("fecha es requerida (YYYY-MM-DD).");

  const url = withQuery("/courier/cuadre-saldo/detalle-servicios-dia", {
    fecha: params.fecha,
    sedeId: params.sedeId,
    motorizadoId: params.motorizadoId,
  });

  const data = await request<DetalleServiciosDiaResp>(url, { headers: authHeaders(token) });
  return normalizeDetalleServiciosResp(data);
}
