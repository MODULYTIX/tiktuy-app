// src/services/courier-movimientos/courier-movimientos.api.ts
import type {
  CourierMovimientosResponse,
  CourierMovimientoDetalle,
} from "./movimientoCourier.type";

// Normalizamos BASE_URL (sin barra final)
const BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

// Helper para parsear error JSON si existe
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Lista paginada (grilla)
export async function fetchCourierMovimientos(
  token: string,
  opts: { page?: number; limit?: number } = {}
): Promise<CourierMovimientosResponse> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 100;

  const url = new URL("/courier-movimientos/mis-movimientos", BASE_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(
      err?.message || "Error al obtener movimientos del courier"
    );
  }

  return res.json();
}

// Detalle para modal de validación
export async function fetchCourierMovimientoDetalle(
  uuid: string,
  token: string
): Promise<CourierMovimientoDetalle> {
  const res = await fetch(
    `${BASE_URL}/courier-movimientos/${uuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(
      err?.message || "Error al obtener el detalle del movimiento"
    );
  }

  return res.json();
}

// Validar (courier)
export async function validarCourierMovimiento(
  uuid: string,
  token: string,
  data: {
    observaciones?: string;
    evidencia?: File | null; // sigue igual
    cantidades?: Record<number, number>;
  }
): Promise<CourierMovimientoDetalle> {
  const form = new FormData();

  if (data.observaciones)
    form.append("observaciones", data.observaciones);

  // 👇 CAMBIO ÚNICO IMPORTANTE
  if (data.evidencia)
    form.append("file", data.evidencia); // <— antes decía "evidencia"

  if (data.cantidades)
    form.append("cantidades", JSON.stringify(data.cantidades));

  const res = await fetch(
    `${BASE_URL}/courier-movimientos/validar/${uuid}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || "Error al validar el movimiento");
  }

  return res.json();
}
