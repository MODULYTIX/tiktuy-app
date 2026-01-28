// src/services/repartidor/estado/estado.api.ts
import type { DisponibilidadResponse } from './estado.types';

/** Lee la base URL desde Vite (.env) y normaliza (sin slash final) */
function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  return base ? base.replace(/\/+$/, '') : '';
}

/** Une paths evitando dobles slashes */
function joinUrl(base: string, path: string) {
  if (!base) return path; // permite usar proxy en dev
  return `${base}/${path.replace(/^\/+/, '')}`;
}

const API_BASE = getApiBase();
const PATH = joinUrl(API_BASE, '/motorizado/me/disponibilidad');

type FetchOpts = {
  token: string;
  signal?: AbortSignal;
};

/** GET: disponibilidad del repartidor autenticado */
export async function getDisponibilidadRepartidor(
  { token, signal }: FetchOpts
): Promise<DisponibilidadResponse> {
  const r = await fetch(PATH, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });

  if (!r.ok) {
    throw new Error((await safeMessage(r)) || 'No se pudo obtener la disponibilidad');
  }

  const data = (await r.json()) as Partial<DisponibilidadResponse>;
  if (typeof data.activo !== 'boolean' || typeof data.estado_id !== 'number') {
    throw new Error('Respuesta inválida del servidor');
  }
  return data as DisponibilidadResponse;
}

/** PATCH: cambia disponibilidad (true = Disponible / false = No Disponible) */
export async function setDisponibilidadRepartidor(
  { token, signal }: FetchOpts,
  activo: boolean
): Promise<DisponibilidadResponse> {
  const r = await fetch(PATH, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ activo }),
    signal,
  });

  if (!r.ok) {
    throw new Error((await safeMessage(r)) || 'No se pudo actualizar la disponibilidad');
  }

  const data = (await r.json()) as Partial<DisponibilidadResponse>;
  if (typeof data.activo !== 'boolean' || typeof data.estado_id !== 'number') {
    throw new Error('Respuesta inválida del servidor');
  }
  return data as DisponibilidadResponse;
}

/* ---------- helpers ---------- */
async function safeMessage(r: Response): Promise<string> {
  try {
    const txt = await r.text();
    try {
      const j = JSON.parse(txt);
      return j?.message ?? j?.error ?? txt;
    } catch {
      return txt;
    }
  } catch {
    return '';
  }
}

export default {
  getDisponibilidadRepartidor,
  setDisponibilidadRepartidor,
};
