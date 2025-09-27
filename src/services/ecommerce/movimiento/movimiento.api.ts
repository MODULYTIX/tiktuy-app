import type { MovimientoResumen, MovimientoDetalle } from "./movimiento.types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Lista todos los movimientos (origen/destino) del ecommerce autenticado.
 */
export async function fetchMovimientos(token: string): Promise<MovimientoResumen[]> {
  const res = await fetch(`${API_URL}/ecommerce/movimiento`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al listar movimientos: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Obtiene el detalle de un movimiento por UUID.
 * Este DTO es el que consume tu modal VerMovimientoRealizadoModal.
 */
export async function fetchMovimientoDetalle(
  token: string,
  uuid: string
): Promise<MovimientoDetalle> {
  const res = await fetch(`${API_URL}/ecommerce/movimiento/${uuid}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener movimiento: ${res.statusText}`);
  }

  return res.json();
}
