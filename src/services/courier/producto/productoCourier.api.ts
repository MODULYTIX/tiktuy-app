import type { CreateCourierProductoInput, Producto } from './productoCourier.type';

// src/api/courierProductoApi.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';



// Helper para headers con token
const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// Crear producto (courier)
export async function createCourierProducto(
  token: string,
  payload: CreateCourierProductoInput
): Promise<Producto> {
  const res = await fetch(`${API_URL}/courier/producto`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Error ${res.status} al crear producto`);
  }
  return res.json();
}

// Listar productos del courier autenticado
export async function getCourierProductos(token: string): Promise<Producto[]> {
  const res = await fetch(`${API_URL}/courier/producto`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Error ${res.status} al listar productos`);
  }
  return res.json();
}

// Obtener producto por UUID (validará pertenencia al courier)
export async function getCourierProductoByUuid(
  token: string,
  uuid: string
): Promise<Producto> {
  const res = await fetch(`${API_URL}/courier/producto/${uuid}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `Error ${res.status} al obtener producto`);
  }
  return res.json();
}

// Helper robusto para parsear error JSON si existe
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
