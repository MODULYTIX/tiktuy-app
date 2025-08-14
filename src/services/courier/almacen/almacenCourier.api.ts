// api/almacenamientocourier.api.ts
import type {
    AlmacenamientoCourier,
    AlmacenCourierCreateDTO,
    AlmacenCourierUpdateDTO,
    MovimientoAlmacenCourier,
    MovimientoCourierCreateDTO,
  } from "./almacenCourier.type";
  
  const BASE = `${import.meta.env.VITE_API_URL}/almacenamientocourier`;
  
  const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });
  
  export async function fetchAlmacenesCourier(token: string): Promise<AlmacenamientoCourier[]> {
    const res = await fetch(BASE, { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`Error al listar almacenes: ${res.status} ${res.statusText}`);
    return res.json();
  }
  
  export async function fetchAlmacenCourierByUuid(uuid: string, token: string): Promise<AlmacenamientoCourier> {
    const res = await fetch(`${BASE}/${uuid}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`Error al obtener almacén: ${res.status} ${res.statusText}`);
    return res.json();
  }
  
  export async function createAlmacenCourier(
    payload: AlmacenCourierCreateDTO,
    token: string
  ): Promise<AlmacenamientoCourier> {
    const res = await fetch(BASE, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Error al crear almacén: ${res.status} ${res.statusText}`);
    return res.json();
  }
  
  export async function updateAlmacenCourier(
    uuid: string,
    payload: AlmacenCourierUpdateDTO,
    token: string
  ): Promise<AlmacenamientoCourier> {
    const res = await fetch(`${BASE}/${uuid}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Error al actualizar almacén: ${res.status} ${res.statusText}`);
    return res.json();
  }
  
  export async function deleteAlmacenCourier(uuid: string, token: string): Promise<void> {
    const res = await fetch(`${BASE}/${uuid}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(`Error al eliminar almacén: ${res.status} ${res.statusText}`);
  }
  
  export async function createMovimientoCourier(
    payload: MovimientoCourierCreateDTO,
    token: string
  ): Promise<MovimientoAlmacenCourier> {
    const res = await fetch(`${BASE}/movimiento`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Error al crear movimiento: ${res.status} ${res.statusText}`);
    return res.json();
  }
  
  export async function fetchMovimientosCourier(token: string): Promise<MovimientoAlmacenCourier[]> {
    const res = await fetch(`${BASE}/movimientos`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`Error al listar movimientos: ${res.status} ${res.statusText}`);
    return res.json();
  }
  