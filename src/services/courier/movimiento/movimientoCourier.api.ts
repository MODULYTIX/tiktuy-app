// src/services/courier-movimientos/courier-movimientos.api.ts
import type {
  CourierMovimientosResponse,
  CourierMovimientoDetalle,
} from './movimientoCourier.type';

const BASE_URL = `${import.meta.env.VITE_API_URL}`;

// Lista paginada (grilla)
export async function fetchCourierMovimientos(
  token: string,
  opts: { page?: number; limit?: number } = {}
): Promise<CourierMovimientosResponse> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 100;

  const url = new URL('/courier-movimientos/mis-movimientos', BASE_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al obtener movimientos del courier');
  return res.json();
}

// Detalle para modal de validación
export async function fetchCourierMovimientoDetalle(
  uuid: string,
  token: string
): Promise<CourierMovimientoDetalle> {
  const res = await fetch(`${BASE_URL}/courier-movimientos/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al obtener el detalle del movimiento');
  return res.json();
}

// Validar (courier) → pasa a "Observado" y adjunta evidencia/observaciones opcionalmente
export async function validarCourierMovimiento(
  uuid: string,
  token: string,
  data: { observaciones?: string; evidencia?: File | null }
): Promise<CourierMovimientoDetalle> {
  const form = new FormData();
  if (data.observaciones) form.append('observaciones', data.observaciones);
  if (data.evidencia) form.append('evidencia', data.evidencia);

  const res = await fetch(`${BASE_URL}/courier-movimientos/validar/${uuid}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }, // NO pongas Content-Type, lo maneja el navegador
    body: form,
  });

  if (!res.ok) throw new Error('Error al validar el movimiento');
  return res.json();
}
