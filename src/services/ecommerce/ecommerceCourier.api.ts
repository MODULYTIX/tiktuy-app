// src/services/ecommerce-courier/ecommerceCourier.api.ts
import type {
  CourierConEstado,
  CreatedRelacion,
  NuevaRelacionInput,
  SedeConEstado,
  SedeEcommerceAsociada,
} from "./ecommerceCourier.types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function authHeaders(token: string, json = false): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error(j?.message || j?.error || `HTTP ${res.status} ${res.statusText}`);
    } catch {
      throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
    }
  }
  return res.json() as Promise<T>;
}

/* =========================
 * Couriers (vista clásica)
 * ========================= */
export async function fetchEcommerceCourier(token: string): Promise<CourierConEstado[]> {
  const res = await fetch(`${API_URL}/ecommerce-courier`, {
    headers: authHeaders(token),
  });
  return handleJson<CourierConEstado[]>(res);
}

export async function fetchCouriersAsociados(token: string): Promise<CourierConEstado[]> {
  const res = await fetch(`${API_URL}/ecommerce-courier/asociados`, {
    headers: authHeaders(token),
  });
  return handleJson<CourierConEstado[]>(res);
}

export async function asociarCourier(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/ecommerce-courier/${id}/asociar`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  await handleJson(res);
}

export async function desasociarCourier(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/ecommerce-courier/${id}/desasociar`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  await handleJson(res);
}

/** POST flexible: courier_id o sede_id/sede_uuid */
export async function crearRelacionCourier(
  input: NuevaRelacionInput,
  token: string
): Promise<CreatedRelacion> {
  const res = await fetch(`${API_URL}/ecommerce-courier`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(input),
  });
  return handleJson<CreatedRelacion>(res);
}

/* =========================
 * Sedes (vistas clásicas)
 * ========================= */

/** Lista sedes con su estado general */
export async function fetchSedesConEstado(token: string): Promise<SedeConEstado[]> {
  const res = await fetch(`${API_URL}/ecommerce-courier/sedes`, {
    headers: authHeaders(token),
  });
  return handleJson<SedeConEstado[]>(res);
}

/** Lista sedes asociadas al courier en estado Activo */
export async function fetchSedesAsociadas(token: string): Promise<SedeConEstado[]> {
  const res = await fetch(`${API_URL}/ecommerce-courier/sedes/asociadas`, {
    headers: authHeaders(token),
  });
  return handleJson<SedeConEstado[]>(res);
}

/* ============================================================
 * NUEVO ENDPOINT REAL PARA CREAR PEDIDO
 * SEDES DEL ECOMMERCE cuyos couriers están asociados
 * ============================================================ */

export async function fetchSedesEcommerceCourierAsociados(
  token: string
): Promise<SedeEcommerceAsociada[]> {
  const res = await fetch(
    `${API_URL}/ecommerce-courier/sedes/ecommerce-asociadas`,
    { headers: authHeaders(token) }
  );

  return handleJson<SedeEcommerceAsociada[]>(res);
}
