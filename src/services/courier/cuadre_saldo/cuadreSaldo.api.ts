// src/services/courier/cuadre_saldo/cuadreSaldo.api.ts
import type {
  ListPedidosResp,
  ListPedidosParams,
  UpdateServicioPayload,
  UpdateServicioCourierPayload,
  AbonarPayload,
  ListMotorizadosResp,
} from "./cuadreSaldo.types";

/* ================== Config / Helpers ================== */
const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}`.replace(/\/$/, "");

/** Build URL with query params (omite undefined/null/"") */
function withQuery(
  basePath: string,
  params: Record<string, string | number | boolean | undefined | null>
) {
  const url = new URL(basePath, BASE_URL);
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
          (Array.isArray(j.errors) && j.errors.length && (j.errors[0].message || j.errors[0])) ||
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

/* ================== API Calls ================== */

/** GET /courier/cuadre-saldo/pedidos */
export async function listPedidos(
  token: string,
  params: ListPedidosParams
): Promise<ListPedidosResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  const url = withQuery("/courier/cuadre-saldo/pedidos", {
    motorizadoId: params.motorizadoId,
    desde: params.desde,
    hasta: params.hasta,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  });
  return request<ListPedidosResp>(url, { headers: authHeaders(token) });
}

/** PUT /courier/cuadre-saldo/pedidos/:id/servicio  (servicio REPARTIDOR) */
export async function updateServicio(
  token: string,
  pedidoId: number,
  payload: UpdateServicioPayload // { servicio: number; motivo?: string }
): Promise<{ id: number; servicio: number | null; motivo?: string | null }> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  if (!pedidoId) throw new Error("pedidoId es requerido.");
  const url = `${BASE_URL}/courier/cuadre-saldo/pedidos/${pedidoId}/servicio`;

  return request(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(payload),
  });
}

/** PUT /courier/cuadre-saldo/pedidos/:id/servicio-courier  (servicio COURIER) */
export async function updateServicioCourier(
  token: string,
  pedidoId: number,
  payload: UpdateServicioCourierPayload 
): Promise<{ id: number; servicioCourier: number | null }> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  if (!pedidoId) throw new Error("pedidoId es requerido.");
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
  payload: AbonarPayload // { pedidoIds: number[]; abonado: boolean }
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

/** GET /courier/cuadre-saldo/motorizados */
export async function listMotorizados(token: string): Promise<ListMotorizadosResp> {
  if (!token) throw new Error("Token vacío: no se envió Authorization.");
  const url = `${BASE_URL}/courier/cuadre-saldo/motorizados`;

  // Puede venir como { items: [...] } o como [...]
  const resp = await request<any>(url, { headers: authHeaders(token) });
  if (Array.isArray(resp)) return resp as ListMotorizadosResp;
  if (resp && Array.isArray(resp.items)) return resp.items as ListMotorizadosResp;
  return [];
}

