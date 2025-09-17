// src/services/courier/cuadre_saldo/cuadreSaldoE.api.ts
import type {
  EcommerceItem,
  ResumenQuery,
  ResumenDia,
  PedidoDiaItem,
  AbonarEcommerceFechasPayload,
  AbonarEcommerceFechasResp,
  AbonoEstado,
} from "./cuadreSaldoE.types";

/* ================== Config / Helpers ================== */
const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}`.replace(/\/$/, "");

function authHeaders(token: string, contentType?: "json") {
  if (!token) throw new Error("Token vacío: falta Authorization.");
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (contentType === "json") h["Content-Type"] = "application/json";
  return h;
}

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

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================== API Calls ================== */

/** GET /courier/cuadre-saldo/ecommerces */
export async function listEcommercesCourier(token: string): Promise<EcommerceItem[]> {
  const url = `${BASE_URL}/courier/cuadre-saldo/ecommerces`;
  return request<EcommerceItem[]>(url, { headers: authHeaders(token) });
}

/** GET /courier/cuadre-saldo/ecommerce/resumen */
export async function getEcommerceResumen(
  token: string,
  q: ResumenQuery
): Promise<ResumenDia[]> {
  const url = withQuery("/courier/cuadre-saldo/ecommerce/resumen", {
    ecommerceId: q.ecommerceId,
    desde: q.desde,
    hasta: q.hasta,
  });

  // BE -> [{ fecha, totalPedidos, totalCobrado, totalServicioCourier, totalNeto, abonoEstado }]
  const raw = await request<
    Array<{
      fecha: string | Date;
      totalPedidos: number;
      totalCobrado: number;
      totalServicioCourier: number; // courier (efectivo) + motorizado
      totalNeto: number;
      abonoEstado: AbonoEstado;
    }>
  >(url, { headers: authHeaders(token) });

  return raw.map((r) => {
    const iso = typeof r.fecha === "string" ? r.fecha : new Date(r.fecha).toISOString();
    return {
      fecha: iso.slice(0, 10),
      pedidos: Number(r.totalPedidos ?? 0),
      cobrado: Number(r.totalCobrado ?? 0),
      servicio: Number(r.totalServicioCourier ?? 0), // courier + motorizado
      neto: Number(r.totalNeto ?? 0),
      estado: (r.abonoEstado ?? "Sin Validar") as AbonoEstado,
    };
  });
}

/** GET /courier/cuadre-saldo/ecommerce/:ecommerceId/dia/:fecha/pedidos */
export async function getEcommercePedidosDia(
  token: string,
  ecommerceId: number,
  fecha: string // YYYY-MM-DD
): Promise<PedidoDiaItem[]> {
  const url = `${BASE_URL}/courier/cuadre-saldo/ecommerce/${ecommerceId}/dia/${fecha}/pedidos`;

  // BE -> [{ id, cliente, metodoPago, monto, servicioCourier, servicioRepartidor, abonado }]
  const raw = await request<
    Array<{
      id: number;
      cliente: string;
      metodoPago: string | null;
      monto: number;
      servicioCourier: number;     // COALESCE(servicio_courier, tarifa_zona, 0)
      servicioRepartidor: number;  // puede venir null -> 0
      abonado: boolean;
    }>
  >(url, { headers: authHeaders(token) });

  // Normalizamos y añadimos “servicioTotal” para la UI
  return raw.map((r) => ({
    id: r.id,
    cliente: r.cliente,
    metodoPago: r.metodoPago ?? null,
    monto: Number(r.monto ?? 0),
    servicioCourier: Number(r.servicioCourier ?? 0),
    servicioRepartidor: Number(r.servicioRepartidor ?? 0),
    servicioTotal: Number(r.servicioCourier ?? 0) + Number(r.servicioRepartidor ?? 0),
    abonado: Boolean(r.abonado),
  })) as unknown as PedidoDiaItem[];
}

/** PUT /courier/cuadre-saldo/ecommerce/abonar  (abono por FECHAS) */
export async function abonarEcommerceFechas(
  token: string,
  payload: AbonarEcommerceFechasPayload
): Promise<AbonarEcommerceFechasResp> {
  const url = `${BASE_URL}/courier/cuadre-saldo/ecommerce/abonar`;
  const body: AbonarEcommerceFechasPayload = {
    ecommerceId: payload.ecommerceId,
    estado: payload.estado ?? "Por Validar",
    ...(payload.fechas?.length
      ? { fechas: payload.fechas }
      : payload.fecha
      ? { fecha: payload.fecha }
      : {}),
  };
  return request<AbonarEcommerceFechasResp>(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(body),
  });
}
