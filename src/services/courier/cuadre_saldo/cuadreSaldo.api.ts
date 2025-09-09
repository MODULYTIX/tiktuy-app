// Estilo Vite, igual que tu courier-movimientos.api.ts
import type {
  // Si ya tienes estos tipos, déjalos. Si no, puedes omitirlos y usar los tipos inline de las funciones.
  ListPedidosResp,
  UpdateServicioPayload,
  AbonarPayload,
} from "./cuadreSaldo.types";

const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}`.replace(/\/$/, "");

/** Build URL with query params */
function withQuery(base: string, params: Record<string, string | number | boolean | undefined>) {
  const url = new URL(base, BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
}

/** GET /courier/cuadre-saldo/pedidos */
export async function listPedidos(
  token: string,
  params: {
    motorizadoId?: number;
    desde?: string;   // YYYY-MM-DD
    hasta?: string;   // YYYY-MM-DD
    page?: number;
    pageSize?: number;
  }
): Promise<ListPedidosResp> {
  const url = withQuery("/courier/cuadre-saldo/pedidos", {
    motorizadoId: params.motorizadoId,
    desde: params.desde,
    hasta: params.hasta,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al obtener pedidos finalizados");
  return res.json();
}

/** PUT /courier/cuadre-saldo/pedidos/:id/servicio */
export async function updateServicio(
  token: string,
  pedidoId: number,
  payload: UpdateServicioPayload // { servicio: number; motivo?: string }
): Promise<{ id: number; servicio: number | null; motivo?: string | null }> {
  const res = await fetch(`${BASE_URL}/courier/cuadre-saldo/pedidos/${pedidoId}/servicio`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("No se pudo actualizar el servicio");
  return res.json();
}

/** PUT /courier/cuadre-saldo/abonar */
export async function abonarPedidos(
  token: string,
  payload: AbonarPayload // { pedidoIds: number[]; abonado: boolean }
): Promise<{ updated: number; abonado: boolean; totalServicioSeleccionado: number }> {
  const res = await fetch(`${BASE_URL}/courier/cuadre-saldo/abonar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("No se pudo procesar el abono");
  return res.json();
}
