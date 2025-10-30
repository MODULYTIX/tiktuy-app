// src/api/almacenamientocourier.api.ts
import type {
  AlmacenamientoCourier,
  AlmacenCourierCreateDTO,
  AlmacenCourierUpdateDTO,
  MovimientoAlmacenCourier,
  MovimientoCourierCreateDTO,
} from './almacenCourier.type';

const BASE = `${import.meta.env.VITE_API_URL}/almacenamientocourier`;

/** Siempre retorna un HeadersInit válido (obj plano) */
function buildHeaders(token?: string, json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/* =========================================================
 * Tipos auxiliares (Sedes + invitación)
 * ======================================================= */

/** DTO que espera el endpoint POST /almacenamientocourier/sedes */
export type CrearSedeSecundariaCourierDTO = {
  nombre_sede: string;
  departamento?: string | null;
  provincia?: string | null;
  ciudad: string;
  direccion: string;
  representante: {
    nombres: string;
    apellidos: string;
    dni: string;
    celular?: string | null;
    correo: string;
  };
};

export type InvitacionSedeResponse = {
  sede: AlmacenamientoCourier;
  invitacion: {
    token: string;
    expiracion: string; // ISO
    correo: string;
    /** En no-prod el backend podría incluir link de prueba */
    link?: string;
  };
};

/* =========================
 * Almacenes (CRUD)
 * ========================= */

export async function fetchAlmacenesCourier(token: string): Promise<AlmacenamientoCourier[]> {
  const res = await fetch(BASE, { headers: buildHeaders(token) });
  return handleJson<AlmacenamientoCourier[]>(res);
}

export async function fetchAlmacenCourierByUuid(
  uuid: string,
  token: string
): Promise<AlmacenamientoCourier> {
  const res = await fetch(`${BASE}/${uuid}`, { headers: buildHeaders(token) });
  return handleJson<AlmacenamientoCourier>(res);
}

export async function createAlmacenCourier(
  payload: AlmacenCourierCreateDTO,
  token: string
): Promise<AlmacenamientoCourier> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return handleJson<AlmacenamientoCourier>(res);
}

export async function updateAlmacenCourier(
  uuid: string,
  payload: AlmacenCourierUpdateDTO,
  token: string
): Promise<AlmacenamientoCourier> {
  const res = await fetch(`${BASE}/${uuid}`, {
    method: 'PUT',
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return handleJson<AlmacenamientoCourier>(res);
}

export async function deleteAlmacenCourier(uuid: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/${uuid}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }
}

/* =========================
 * Movimientos
 * ========================= */

export async function createMovimientoCourier(
  payload: MovimientoCourierCreateDTO,
  token: string
): Promise<MovimientoAlmacenCourier> {
  const res = await fetch(`${BASE}/movimiento`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return handleJson<MovimientoAlmacenCourier>(res);
}

export async function fetchMovimientosCourier(token: string): Promise<MovimientoAlmacenCourier[]> {
  const res = await fetch(`${BASE}/movimientos`, {
    headers: buildHeaders(token),
  });
  return handleJson<MovimientoAlmacenCourier[]>(res);
}

/* =========================================================
 * Sedes (crear + invitación de representante)
 * ======================================================= */

/**
 * Crea una sede secundaria e inmediatamente genera y envía
 * la invitación para su representante.
 * Backend: AlmacenamientoCourierController.crearSedeSecundariaConInvitacion
 * Ruta esperada: POST ${BASE}/sedes
 */
export async function crearSedeSecundariaConInvitacion(
  payload: CrearSedeSecundariaCourierDTO,
  token: string
): Promise<InvitacionSedeResponse> {
  const res = await fetch(`${BASE}/sedes`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return handleJson<InvitacionSedeResponse>(res);
}

/**
 * Aceptar invitación (público, sin auth).
 * Backend: AlmacenamientoCourierController.aceptarInvitacionSedePublic
 * Ajusta la ruta si tu router usa otra: p.ej. POST ${BASE}/sedes/aceptar
 */
export async function aceptarInvitacionSedePublic(params: {
  token: string;
  password: string;
  passwordConfirm: string;
}): Promise<{
  message: string;
  usuario: { id: number; uuid: string; nombres: string; apellidos: string; correo: string };
}> {
  const res = await fetch(`${BASE}/sedes/aceptar`, {
    method: 'POST',
    headers: buildHeaders(undefined, true),
    body: JSON.stringify(params),
  });
  return handleJson(res);
}

/**
 * Reenviar invitación del representante de una sede (requiere auth).
 * Backend: AlmacenamientoCourierController.reenviarInvitacionRepresentante
 * El controller acepta el sedeId por params o por body; aquí usamos la ruta con params:
 * POST ${BASE}/sedes/:sedeId/reenviar
 */
export async function reenviarInvitacionRepresentante(
  sedeId: number,
  token: string,
  payload?: {
    correo?: string;
    representante?: {
      nombres: string;
      apellidos: string;
      dni: string;
      celular?: string | null;
    };
  }
): Promise<{
  sedeId: number;
  invitacion: { token: string; expiracion: string; correo: string; link?: string };
}> {
  const res = await fetch(`${BASE}/sedes/${sedeId}/reenviar`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify({ sedeId, ...(payload ?? {}) }),
  });
  return handleJson(res);
}
