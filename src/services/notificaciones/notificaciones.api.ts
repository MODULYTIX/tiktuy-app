// src/services/notificaciones/notificaciones.api.ts
import type { ListNotisResponse } from './notificaciones.types';

const API = import.meta.env.VITE_API_URL;

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function fetchNotificaciones(
  token: string,
  { page = 1, pageSize = 30 }: { page?: number; pageSize?: number } = {}
): Promise<ListNotisResponse> {
  const url = new URL(`${API}/notificaciones`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  const r = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!r.ok) throw new Error('Error al listar notificaciones');
  return r.json();
}

export async function markNotificacionLeida(id: number, token: string): Promise<void> {
  const r = await fetch(`${API}/notificaciones/${id}/read`, {
    method: 'PATCH', 
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error('Error al marcar notificación');
}

export async function markTodasLeidas(token: string): Promise<void> {
  const r = await fetch(`${API}/notificaciones/read-all`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error('Error al marcar todas');
}
