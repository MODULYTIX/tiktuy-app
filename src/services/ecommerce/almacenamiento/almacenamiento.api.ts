// src/services/ecommerce/almacenamiento/almacenamiento.api.ts
import type { Almacenamiento, MovimientoAlmacen, MovimientoPayload } from './almacenamiento.types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/almacenamiento`;

// Obtener todos los almacenes del ecommer del usuario
export async function fetchAlmacenes(token: string): Promise<Almacenamiento[]> {
  const res = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener almacenes');
  return res.json();
}

// NUEVO: Obtener almacenes del ecommer + almacenes de couriers asociados (activos)
export async function fetchAlmacenesEcommerCourier(token: string): Promise<Almacenamiento[]> {
  const res = await fetch(`${BASE_URL}/ecommer-courier`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener almacenes (ecommer y couriers)');
  return res.json();
}

// Obtener un almacén por UUID
export async function fetchAlmacenByUuid(uuid: string, token: string): Promise<Almacenamiento> {
  const res = await fetch(`${BASE_URL}/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener almacén');
  return res.json();
}

// Crear un nuevo almacén
export async function createAlmacenamiento(
  data: Partial<Almacenamiento>,
  token: string
): Promise<Almacenamiento> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Error al crear almacén');
  return res.json();
}

// Actualizar un almacén existente
export async function updateAlmacenamiento(
  uuid: string,
  data: Partial<Almacenamiento>,
  token: string
): Promise<Almacenamiento> {
  const res = await fetch(`${BASE_URL}/${uuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Error al actualizar almacén');
  return res.json();
}

// Eliminar un almacén por UUID
export async function deleteAlmacenamiento(uuid: string, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${uuid}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al eliminar almacén');
}

// Registrar movimiento de productos entre almacenes
export async function registrarMovimiento(
  data: MovimientoPayload,
  token: string
): Promise<MovimientoAlmacen> {
  const res = await fetch(`${BASE_URL}/movimiento`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Error al registrar el movimiento');
  return res.json();
}

// Obtener lista de movimientos registrados
export async function fetchMovimientos(token: string): Promise<MovimientoAlmacen[]> {
  const res = await fetch(`${BASE_URL}/movimientos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener movimientos');
  return res.json();
}
