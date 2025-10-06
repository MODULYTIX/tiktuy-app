// src/services/ecommerce/cuadreSaldo/cuadreSaldoC.api.ts
import type {
  CourierItem,
  ResumenQuery,
  ResumenDia,
  PedidoDiaItem,
  ValidarFechasPayload,
  ValidarFechasResp,
  AbonoEstado,
} from "./cuadreSaldoC.types";

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

/* ================== API Calls (Ecommerce) ================== */

/** GET /ecommerce/cuadre-saldo/couriers */
export async function listCouriersMine(token: string): Promise<CourierItem[]> {
  const url = `${BASE_URL}/ecommerce/cuadre-saldo/couriers`;
  return request<CourierItem[]>(url, { headers: authHeaders(token) });
}

/** GET /ecommerce/cuadre-saldo/resumen */
export async function getResumen(
  token: string,
  q: ResumenQuery
): Promise<ResumenDia[]> {
  const url = withQuery("/ecommerce/cuadre-saldo/resumen", {
    courierId: q.courierId,
    desde: q.desde,
    hasta: q.hasta,
    // Solo filtra si lo mandas explícitamente
    soloPorValidar: q.soloPorValidar,
  });

  // BE -> [{ fecha, totalPedidos, totalCobrado, totalServicioCourier, totalNeto, abonoEstado, evidencia }]
  const raw = await request<
    Array<{
      fecha: string | Date;
      totalPedidos: number;
      totalCobrado: number;
      totalServicioCourier: number;
      totalNeto: number;
      abonoEstado: AbonoEstado;
      evidencia?: string | null;
    }>
  >(url, { headers: authHeaders(token) });

  return raw.map((r) => {
    const iso = typeof r.fecha === "string" ? r.fecha : new Date(r.fecha).toISOString();
    return {
      fecha: iso.slice(0, 10),
      pedidos: Number(r.totalPedidos ?? 0),
      cobrado: Number(r.totalCobrado ?? 0),
      servicio: Number(r.totalServicioCourier ?? 0),
      neto: Number(r.totalNeto ?? 0),
      estado: (r.abonoEstado ?? "Sin Validar") as AbonoEstado,
      evidencia: r.evidencia ?? null,
    };
  });
}

/** GET /ecommerce/cuadre-saldo/courier/:courierId/dia/:fecha/pedidos */
export async function getPedidosDia(
  token: string,
  courierId: number,
  fecha: string, // YYYY-MM-DD
  soloPorValidar?: boolean
): Promise<PedidoDiaItem[]> {
  const url = withQuery(
    `/ecommerce/cuadre-saldo/courier/${courierId}/dia/${fecha}/pedidos`,
    { soloPorValidar }
  );

  // BE -> [{ id, cliente, metodoPago|metodo_pago, monto, servicioCourier, servicioRepartidor, abonado, evidencia }]
  const raw = await request<
    Array<{
      id: number;
      cliente: string;
      metodoPago?: string | null;
      metodo_pago?: string | null; // compat
      monto: number;
      servicioCourier: number;
      servicioRepartidor: number;
      abonado: boolean;
      evidencia?: string | null;
    }>
  >(url, { headers: authHeaders(token) });

  // Normalizamos el método de pago y devolvemos la propiedad esperada por el tipo: metodo_pago
  return raw.map((r) => {
    const metodo_pago: string | null =
      (r as any).metodo_pago ?? (r as any).metodoPago ?? null;

    return {
      id: r.id,
      cliente: r.cliente,
      metodo_pago, // ← clave requerida por PedidoDiaItem
      monto: Number(r.monto ?? 0),
      servicioCourier: Number(r.servicioCourier ?? 0),
      servicioRepartidor: Number(r.servicioRepartidor ?? 0),
      servicioTotal: Number(r.servicioCourier ?? 0) + Number(r.servicioRepartidor ?? 0),
      abonado: Boolean(r.abonado),
      evidencia: r.evidencia ?? null,
    };
  });
}

/** PUT /ecommerce/cuadre-saldo/validar  (Por Validar → Validado) */
export async function validarFechas(
  token: string,
  payload: ValidarFechasPayload
): Promise<ValidarFechasResp> {
  const url = `${BASE_URL}/ecommerce/cuadre-saldo/validar`;
  const body: ValidarFechasPayload = {
    courierId: payload.courierId,
    ...(payload.fechas?.length
      ? { fechas: payload.fechas }
      : payload.fecha
      ? { fecha: payload.fecha }
      : {}),
  };
  return request<ValidarFechasResp>(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(body),
  });
}
