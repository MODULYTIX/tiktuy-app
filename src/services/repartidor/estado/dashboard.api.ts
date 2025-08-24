// src/services/repartidor/dashboard.api.ts

// Servicio para KPIs del panel del motorizado
export type KpisResponse = {
  asignadosHoy: number;
  completados: number;
  pendientes: number;
  reprogramados: number;
};

/** Lee la base URL desde Vite (.env) y normaliza (sin slash final) */
function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  return base ? base.replace(/\/+$/, '') : '';
}

/** Une paths evitando dobles slashes (soporta proxy en dev si VITE_API_URL está vacío) */
function joinUrl(base: string, path: string) {
  if (!base) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

const API_BASE = getApiBase();
// Ruta real según tu backend (sin /api y en singular)
const PATH = joinUrl(API_BASE, '/motorizado/me/dashboard-kpis');

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

/**
 * Obtiene KPIs del motorizado para el día actual.
 * Lanza Error con mensaje claro si la respuesta no es OK.
 */
export async function fetchKpisMotorizado(
  token: string,
  signal?: AbortSignal
): Promise<KpisResponse> {
  const r = await fetch(PATH, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });

  if (!r.ok) {
    throw new Error((await safeMessage(r)) || 'No se pudieron obtener los KPIs');
  }

  const data = (await r.json()) as Partial<KpisResponse>;

  // Normaliza y asegura números
  return {
    asignadosHoy: Number.isFinite(data.asignadosHoy as number) ? (data.asignadosHoy as number) : 0,
    completados: Number.isFinite(data.completados as number) ? (data.completados as number) : 0,
    pendientes: Number.isFinite(data.pendientes as number) ? (data.pendientes as number) : 0,
    reprogramados: Number.isFinite(data.reprogramados as number) ? (data.reprogramados as number) : 0,
  };
}

export default {
  fetchKpisMotorizado,
};
