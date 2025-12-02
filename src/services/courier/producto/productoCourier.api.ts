// src/api/courierProductoApi.ts
import type { CreateCourierProductoInput, Producto } from "./productoCourier.type";

// Base URL del backend.
// Recomiendo que VITE_API_URL ya venga con el prefijo correcto, ej: "http://localhost:4000"
// o "http://localhost:4000/api". Aquí solo limpiamos barras finales.
const BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:4000";

/** Helper robusto para parsear error JSON si existe */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Helper para headers con token */
const authHeaders = (token: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/** Crear producto (courier) */
export async function createCourierProducto(
  token: string,
  payload: CreateCourierProductoInput
): Promise<Producto> {
  const res = await fetch(`${BASE_URL}/courier/producto`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Error ${res.status} al crear producto`);
  }

  return res.json();
}

/** Listar productos del courier autenticado (filtrados por sus almacenes/sedes) */
export async function getCourierProductos(token: string): Promise<Producto[]> {
  const res = await fetch(`${BASE_URL}/courier/producto`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Error ${res.status} al listar productos`);
  }

  return res.json();
}

/** Obtener un producto por UUID (validará que pertenezca al courier) */
export async function getCourierProductoByUuid(
  token: string,
  uuid: string
): Promise<Producto> {
  const res = await fetch(`${BASE_URL}/courier/producto/${uuid}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(
      err?.message || `Error ${res.status} al obtener producto por UUID`
    );
  }

  return res.json();
}
