// src/services/courier/cuadre_saldo/cuadreSaldoE.api.ts
import type {
  EcommerceItem,
  ResumenQuery,
  ResumenDia,
  PedidoDiaItem,
  AbonarEcommerceFechasPayload,
  AbonarEcommerceFechasResp,
  AbonoEstado,
  SedesCuadreResponse,
} from "./cuadreSaldoE.types";

/* ================== Config / Helpers ================== */
const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}`.replace(
  /\/$/,
  ""
);

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
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const cleanPath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  const url = new URL(`${cleanBase}${cleanPath}`);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
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
          (Array.isArray(j.errors) &&
            j.errors.length &&
            ((j.errors[0] && (j.errors[0].message || j.errors[0])) as any)) ||
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

/* ================== Small helpers ================== */
const normalizeYMD = (v: string | Date) => {
  const iso = typeof v === "string" ? v : new Date(v).toISOString();
  return iso.slice(0, 10);
};

const isRejectedEstadoNombre = (nombre?: string | null) =>
  (nombre ?? "").trim().toLowerCase() === "pedido rechazado";

/* ================== API Calls ================== */

/** GET /courier/cuadre-saldo/ecommerces */
export async function listEcommercesCourier(token: string): Promise<EcommerceItem[]> {
  const url = `${BASE_URL}/courier/cuadre-saldo/ecommerces`;
  return request<EcommerceItem[]>(url, { headers: authHeaders(token) });
}

/**
 * GET /courier/cuadre-saldo/ecommerce/sedes
 */
export async function listCourierSedesCuadre(token: string): Promise<SedesCuadreResponse> {
  const url = `${BASE_URL}/courier/cuadre-saldo/ecommerce/sedes`;
  return request<SedesCuadreResponse>(url, { headers: authHeaders(token) });
}

/**
 * ✅ NUEVA LÓGICA (Ecommerce)
 * GET /courier/cuadre-saldo/ecommerce/resumen
 *
 * Backend (actualizado) debería devolver:
 * [{ fecha, totalPedidos, totalCobrado, totalServicioCourier, totalNeto, abonoEstado }]
 *
 * Donde:
 * - totalServicioCourier = SOLO courier (NO courier + repartidor)
 * - totalNeto = totalCobrado - totalServicioCourier
 */
export async function getEcommerceResumen(
  token: string,
  q: ResumenQuery
): Promise<ResumenDia[]> {
  const url = withQuery("/courier/cuadre-saldo/ecommerce/resumen", {
    ecommerceId: q.ecommerceId,
    sedeId: q.sedeId,
    desde: q.desde,
    hasta: q.hasta,
  });

  const raw = await request<
    Array<{
      fecha: string | Date;
      totalPedidos: number;
      totalCobrado: number;
      totalServicioCourier: number; // ✅ SOLO courier
      totalNeto: number;
      abonoEstado: AbonoEstado | null;
    }>
  >(url, { headers: authHeaders(token) });

  return raw.map((r) => {
    const servicioCourier = Number(r.totalServicioCourier ?? 0);
    const cobrado = Number(r.totalCobrado ?? 0);

    return {
      fecha: normalizeYMD(r.fecha),
      pedidos: Number(r.totalPedidos ?? 0),

      cobrado,
      servicioCourier,

      // compatibilidad con UI antigua
      servicio: servicioCourier,

      neto:
        Number.isFinite(Number(r.totalNeto))
          ? Number(r.totalNeto)
          : cobrado - servicioCourier,

      estado: (r.abonoEstado ?? "Sin Validar") as AbonoEstado,
    };

  });
}

/**
 * ✅ Modal del día (Ecommerce)
 * GET /courier/cuadre-saldo/ecommerce/:ecommerceId/dia/:fecha/pedidos
 *
 * ✅ Ajuste pedido:
 * - mostrar observacionEstado SOLO si estado_nombre/estadoNombre == "Pedido rechazado"
 * - soporta snake_case y camelCase del backend sin romper
 */
export async function getEcommercePedidosDia(
  token: string,
  ecommerceId: number,
  fecha: string, // YYYY-MM-DD
  sedeId?: number
): Promise<PedidoDiaItem[]> {
  const path = `/courier/cuadre-saldo/ecommerce/${ecommerceId}/dia/${fecha}/pedidos`;
  const url = sedeId != null ? withQuery(path, { sedeId }) : `${BASE_URL}${path}`;

  const raw = await request<
    Array<{
      id: number;
      cliente: string;
      metodoPago: string | null;
      monto: number;

      servicioCourier: number;
      servicioRepartidor: number;

      // ya lo tenías
      motivo?: string | null;
      pagoEvidenciaUrl?: string | null;

      // ✅ NUEVO (compat): estado + observación (pueden venir en snake o camel)
      estadoNombre?: string | null;
      estado_nombre?: string | null;

      observacionEstado?: string | null;
      observacion_estado?: string | null;

      abonado: boolean;
    }>
  >(url, { headers: authHeaders(token) });

  return raw.map((r) => {
    const servicioCourier = Number(r.servicioCourier ?? 0);
    const servicioRepartidor = Number(r.servicioRepartidor ?? 0);

    const estadoNombre = (r.estadoNombre ?? r.estado_nombre ?? null) as string | null;
    const observacionRaw = (r.observacionEstado ?? r.observacion_estado ?? null) as string | null;

    // ✅ SOLO si es rechazado, exponemos observacionEstado
    const observacionEstado = isRejectedEstadoNombre(estadoNombre) ? observacionRaw : null;

    return {
      id: r.id,
      cliente: r.cliente,
      metodoPago: r.metodoPago ?? null,
      monto: Number(r.monto ?? 0),

      servicioCourier,
      servicioRepartidor,

      // opcional visual (NO usarlo como "servicio" del cuadre ecommerce)
      servicioTotal: servicioCourier + servicioRepartidor,

      // motivo del ajuste del repartidor (servicio_repartidor_motivo)
      motivo: r.motivo ?? null,

      // evidencia del repartidor
      pagoEvidenciaUrl: r.pagoEvidenciaUrl ?? null,

      // ✅ observación del estado (solo cuando es rechazado)
      observacionEstado,

      abonado: Boolean(r.abonado),
    } as PedidoDiaItem;
  });
}

/**
 * ✅ Abono Ecommerce
 * PUT /courier/cuadre-saldo/ecommerce/abonar
 */
export async function abonarEcommerceFechas(
  token: string,
  payload: AbonarEcommerceFechasPayload | FormData,
  isFormData = false
): Promise<AbonarEcommerceFechasResp> {
  const url = `${BASE_URL}/courier/cuadre-saldo/ecommerce/abonar`;

  // ✅ FormData (con voucher)
  if (isFormData || payload instanceof FormData) {
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: payload as FormData,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || "Error al abonar (FormData)");

    const data = text ? (JSON.parse(text) as AbonarEcommerceFechasResp) : ({} as any);

    // ✅ fallback por si el BE aún no manda totalAbonoSeleccionado
    if ((data as any).totalAbonoSeleccionado == null) {
      const cob = Number((data as any).totalCobradoSeleccionado ?? 0);
      const serv = Number((data as any).totalServicioCourierSeleccionado ?? 0);
      (data as any).totalAbonoSeleccionado = cob - serv;
    }

    return data;
  }

  // ✅ JSON estándar
  const jsonPayload = payload as AbonarEcommerceFechasPayload;

  const body: AbonarEcommerceFechasPayload = {
    ecommerceId: jsonPayload.ecommerceId,
    sedeId: jsonPayload.sedeId,
    estado: jsonPayload.estado ?? "Por Validar",
    ...(jsonPayload.fechas?.length
      ? { fechas: jsonPayload.fechas }
      : jsonPayload.fecha
        ? { fecha: jsonPayload.fecha }
        : {}),
  };

  const data = await request<AbonarEcommerceFechasResp>(url, {
    method: "PUT",
    headers: authHeaders(token, "json"),
    body: JSON.stringify(body),
  });

  // ✅ fallback por si el BE aún no manda totalAbonoSeleccionado
  if ((data as any).totalAbonoSeleccionado == null) {
    const cob = Number((data as any).totalCobradoSeleccionado ?? 0);
    const serv = Number((data as any).totalServicioCourierSeleccionado ?? 0);
    (data as any).totalAbonoSeleccionado = cob - serv;
  }

  return data;
}
