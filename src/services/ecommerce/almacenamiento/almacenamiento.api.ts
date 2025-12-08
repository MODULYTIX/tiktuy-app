// src/services/ecommerce/almacenamiento/almacenamiento.api.ts
import type {
  Almacenamiento,
  MovimientoAlmacen,
  MovimientoPayload,
  CrearSedeSecundariaDTO,
  CrearSedeSecundariaResponse,
  AceptarInvitacionDTO,
  AceptarInvitacionResponse,
  ReenviarInvitacionDTO,
  ReenviarInvitacionResponse,
  EntidadesConAlmacenResponse,
  SedeConRepresentante,
} from './almacenamiento.types';

const BASE_URL = `${import.meta.env.VITE_API_URL}/almacenamiento`;

/** Siempre devuelve HeadersInit plano (evita unions raras que rompen el tipo de fetch) */
function buildHeaders(token?: string, json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/** Manejo consistente de respuestas JSON o texto con mensajes de error amigables */
async function handleJson<T>(res: Response): Promise<T> {
  const raw = await res.text();
  const maybeJson = raw ? safeJson(raw) : undefined;

  if (!res.ok) {
    const msg =
      (maybeJson && (maybeJson.message || maybeJson.error)) ||
      raw ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (maybeJson as T) ?? ({} as T);
}

function safeJson(str: string): any | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

/* ===== Tipos internos opcionales (no exportados) ===== */
type PaginatedResponse<T> = {
  data: T[];
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

/* =========================
 * Almacenes (CRUD + listados)
 * ========================= */

/**
 * Soporta ambas respuestas del backend:
 *  - Formato antiguo: Almacenamiento[]
 *  - Formato nuevo:   { data: Almacenamiento[], pagination: { ... } }
 * Si está paginado, concatena TODAS las páginas y retorna un único array.
 */
export async function fetchAlmacenes(token: string): Promise<Almacenamiento[]> {
  // Primera llamada (por defecto page=1 si tu backend lo toma así)
  const firstRes = await fetch(BASE_URL, { headers: buildHeaders(token) });
  const firstJson = await handleJson<any>(firstRes);

  // Formato antiguo: ya es array
  if (Array.isArray(firstJson)) return firstJson as Almacenamiento[];

  // Formato nuevo
  const dataPrimera = Array.isArray(firstJson?.data)
    ? (firstJson.data as Almacenamiento[])
    : [];
  const pag = firstJson?.pagination;

  // Si no hay paginación o solo hay una página, devuelve lo que hay
  if (!pag || !Number.isFinite(pag.totalPages) || pag.totalPages <= 1) {
    return dataPrimera;
  }

  // Hay más páginas: traerlas todas
  const totalPages = Number(pag.totalPages) || 1;
  const perPage = Number(pag.perPage) || dataPrimera.length || 10;

  const promises: Promise<Almacenamiento[]>[] = [];
  for (let page = 2; page <= totalPages; page++) {
    const u = new URL(BASE_URL);
    u.searchParams.set('page', String(page));
    u.searchParams.set('perPage', String(perPage));

    promises.push(
      fetch(u.toString(), { headers: buildHeaders(token) })
        .then((r) => handleJson<PaginatedResponse<Almacenamiento> | Almacenamiento[]>(r))
        .then((j) => {
          if (Array.isArray(j)) return j as Almacenamiento[];
          return Array.isArray(j?.data) ? (j.data as Almacenamiento[]) : [];
        })
        .catch(() => [])
    );
  }

  const rest = await Promise.all(promises);
  return dataPrimera.concat(...rest);
}

export async function fetchAlmacenesEcommerCourier(token: string): Promise<Almacenamiento[]> {
  const res = await fetch(`${BASE_URL}/ecommer-courier`, { headers: buildHeaders(token) });
  return handleJson<Almacenamiento[]>(res);
}

export async function fetchEntidadesConAlmacen(token: string): Promise<EntidadesConAlmacenResponse> {
  const res = await fetch(`${BASE_URL}/entidades-con-almacen`, { headers: buildHeaders(token) });
  return handleJson<EntidadesConAlmacenResponse>(res);
}

/** Nuevo: listar solo sedes que tienen representante y son visibles para el usuario */
export async function fetchSedesConRepresentante(token: string): Promise<SedeConRepresentante[]> {
  const res = await fetch(`${BASE_URL}/con-representante`, { headers: buildHeaders(token) });
  return handleJson<SedeConRepresentante[]>(res);
}

export async function fetchAlmacenByUuid(uuid: string, token: string): Promise<Almacenamiento> {
  const res = await fetch(`${BASE_URL}/${uuid}`, { headers: buildHeaders(token) });
  return handleJson<Almacenamiento>(res);
}

export async function createAlmacenamiento(
  data: Partial<Pick<Almacenamiento, 'nombre_almacen' | 'direccion' | 'departamento' | 'provincia' | 'ciudad'>>,
  token: string
): Promise<Almacenamiento> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleJson<Almacenamiento>(res);
}

export async function updateAlmacenamiento(
  uuid: string,
  data: Partial<Pick<Almacenamiento, 'nombre_almacen' | 'direccion' | 'departamento' | 'provincia' | 'ciudad'>>,
  token: string
): Promise<Almacenamiento> {
  const res = await fetch(`${BASE_URL}/${uuid}`, {
    method: 'PUT',
    headers: buildHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleJson<Almacenamiento>(res);
}

export async function deleteAlmacenamiento(uuid: string, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${uuid}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  await handleJson<unknown>(res);
}

/* =========================
 * Movimientos
 * ========================= */

export async function registrarMovimiento(
  data: MovimientoPayload,
  token: string
): Promise<MovimientoAlmacen> {
  const res = await fetch(`${BASE_URL}/movimiento`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleJson<MovimientoAlmacen>(res);
}

export async function fetchMovimientos(token: string): Promise<MovimientoAlmacen[]> {
  const res = await fetch(`${BASE_URL}/movimientos`, { headers: buildHeaders(token) });
  const payload = await handleJson<any>(res);

  // Normalización robusta
  if (Array.isArray(payload)) return payload as MovimientoAlmacen[];
  if (Array.isArray(payload?.data)) return payload.data as MovimientoAlmacen[];
  return [];
}

export async function validarMovimiento(
  uuid: string,
  token: string,
  body: FormData
): Promise<MovimientoAlmacen> {
  const res = await fetch(`${BASE_URL}/movimientos/${uuid}/validar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // NO poner Content-Type con FormData
    },
    body, // Aquí se envía el FormData
  });

  return handleJson<MovimientoAlmacen>(res);
}

/* =========================
 * Sedes (invitaciones / representante)
 * ========================= */

export async function crearSedeSecundariaConInvitacion(
  dto: CrearSedeSecundariaDTO,
  token: string
): Promise<CrearSedeSecundariaResponse> {
  const res = await fetch(`${BASE_URL}/sedes`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(dto),
  });
  return handleJson<CrearSedeSecundariaResponse>(res);
}

export async function aceptarInvitacionSede(
  dto: AceptarInvitacionDTO
): Promise<AceptarInvitacionResponse> {
  const res = await fetch(`${BASE_URL}/invitaciones/aceptar`, {
    method: 'POST',
    headers: buildHeaders(undefined, true),
    body: JSON.stringify(dto),
  });
  return handleJson<AceptarInvitacionResponse>(res);
}

export async function reenviarInvitacionRepresentante(
  sedeId: number,
  token: string,
  body?: Omit<ReenviarInvitacionDTO, 'sedeId'>
): Promise<ReenviarInvitacionResponse> {
  const res = await fetch(`${BASE_URL}/sedes/${sedeId}/reenviar-invitacion`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(body ?? {}),
  });
  return handleJson<ReenviarInvitacionResponse>(res);
}
