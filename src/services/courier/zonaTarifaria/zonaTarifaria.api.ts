// src/services/courier/zona_tarifaria/zonaTarifaria.api.ts
import type {
  ApiResult,
  ZonaTarifaria,
  ZonaTarifariaPublic,
  ZonaTarifariaPublicFull,
  CrearZonaTarifariaPayload,
  CrearZonaTarifariaParaMiUsuarioPayload,
  ActualizarZonaTarifariaPayload,
} from "./zonaTarifaria.types";

/**
 * Usa VITE_API_URL (p.ej.: http://localhost:3000/api) o cae a un valor por defecto.
 * Se recorta cualquier "/" final.
 */
const BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

/** ---------------------------------------
 * Helpers comunes
 * ------------------------------------- */

/** Headers con/ sin Bearer */
function buildHeaders(token?: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as any)["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Construir querystring desde un objeto simple */
function qs(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Wrapper estándar: {ok, data} | {ok:false, error, status} */
async function handle<T>(res: Response): Promise<ApiResult<T>> {
  let body: any = null;

  try {
    const ct = res.headers.get("content-type") || "";
    if (res.status !== 204 && ct.includes("application/json")) {
      body = await res.json();
    } else if (res.status !== 204) {
      const txt = await res.text();
      try {
        body = JSON.parse(txt);
      } catch {
        body = txt ? { message: txt } : null;
      }
    }
  } catch {
    // sin body
  }

  if (res.ok) return { ok: true, data: (body ?? undefined) as T };

  const msg =
    body?.error ||
    body?.message ||
    `Error HTTP ${res.status}${res.statusText ? ` - ${res.statusText}` : ""}`;

  return { ok: false, error: msg, status: res.status };
}

/** (Opcional) timeout por request */
async function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Request timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

/* =========================================================
 *                         CRUD
 * =======================================================*/

/**
 * Crea una zona tarifaria **por sede_id explícito** (modo admin / interno).
 * Endpoint: POST /zona-tarifaria
 * Requiere token (Bearer) y payload:
 * { sede_id, ciudad, zona_tarifario, tarifa_cliente, pago_motorizado, estado_id? }
 */
export async function crearZonaTarifaria(
  payload: CrearZonaTarifariaPayload,
  token: string
): Promise<ApiResult<ZonaTarifaria>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    })
  );
  return handle<ZonaTarifaria>(res);
}

/**
 * Crea una zona tarifaria **para el usuario autenticado**.
 *
 * Endpoint: POST /zona-tarifaria/mias
 */
export async function crearZonaTarifariaParaMiUsuario(
  payload: CrearZonaTarifariaParaMiUsuarioPayload,
  token: string
): Promise<ApiResult<ZonaTarifaria>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/mias`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    })
  );
  return handle<ZonaTarifaria>(res);
}

/**
 * Actualiza una zona tarifaria por id (uso admin / interno).
 * Endpoint: PUT /zona-tarifaria/:id
 */
export async function actualizarZonaTarifaria(
  id: number,
  payload: ActualizarZonaTarifariaPayload,
  token: string
): Promise<ApiResult<ZonaTarifaria>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/${id}`, {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    })
  );
  return handle<ZonaTarifaria>(res);
}

/**
 * Actualiza una de "mis" zonas tarifarias (validando courier del usuario).
 * Endpoint: PUT /zona-tarifaria/mias/:id
 */
export async function actualizarMiZonaTarifaria(
  id: number,
  payload: ActualizarZonaTarifariaPayload,
  token: string
): Promise<ApiResult<ZonaTarifaria>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/mias/${id}`, {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    })
  );
  return handle<ZonaTarifaria>(res);
}

/**
 * Elimina una zona tarifaria por id (uso admin / interno).
 * Endpoint: DELETE /zona-tarifaria/:id
 */
export async function eliminarZonaTarifaria(
  id: number,
  token: string
): Promise<ApiResult<void>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token),
    })
  );
  return handle<void>(res);
}

/**
 * Elimina una de "mis" zonas tarifarias (validando courier del usuario).
 * Endpoint: DELETE /zona-tarifaria/mias/:id
 */
export async function eliminarMiZonaTarifaria(
  id: number,
  token: string
): Promise<ApiResult<void>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/mias/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token),
    })
  );
  return handle<void>(res);
}

/* =========================================================
 *                 LISTADOS (privado/ público)
 * =======================================================*/

/**
 * PRIVADO (incluye estado) – requiere token – por sede_id (admin / interno).
 * Endpoint: GET /zona-tarifaria/sede/:sede_id
 */
export async function fetchZonasBySedePrivado(
  sede_id: number,
  token: string
): Promise<ApiResult<ZonaTarifaria[]>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/sede/${sede_id}`, {
      method: "GET",
      headers: buildHeaders(token),
    })
  );
  return handle<ZonaTarifaria[]>(res);
}

/**
 * Mis zonas (usuario autenticado) – requiere token.
 * Endpoint: GET /zona-tarifaria/mias
 *
 * Devuelve todas las zonas de todas las sedes del courier
 * donde el usuario es dueño/trabajador/representante.
 */
export async function fetchMisZonas(
  token: string
): Promise<ApiResult<ZonaTarifaria[]>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/mias`, {
      method: "GET",
      headers: buildHeaders(token),
    })
  );
  return handle<ZonaTarifaria[]>(res);
}

/**
 * Mis zonas de una sede específica (usuario autenticado).
 * Endpoint: GET /zona-tarifaria/mias/sede/:sede_id
 *
 * Valida en backend que la sede pertenezca al courier del usuario.
 */
export async function fetchMisZonasPorSede(
  sede_id: number,
  token: string
): Promise<ApiResult<ZonaTarifaria[]>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/mias/sede/${sede_id}`, {
      method: "GET",
      headers: buildHeaders(token),
    })
  );
  return handle<ZonaTarifaria[]>(res);
}

/**
 * PRIVADO (compat por courier) – requiere token.
 * Endpoint: GET /zona-tarifaria/courier/:courier_id
 */
export async function fetchZonasByCourierPrivado(
  courier_id: number,
  token: string
): Promise<ApiResult<ZonaTarifaria[]>> {
  const res = await withTimeout(
    fetch(`${BASE_URL}/zona-tarifaria/courier/${courier_id}`, {
      method: "GET",
      headers: buildHeaders(token),
    })
  );
  return handle<ZonaTarifaria[]>(res);
}

/**
 * PÚBLICO – sin token – por sede_id
 * Endpoint: GET /zona-tarifaria/public/sede/:sede_id?onlyDistritos=...
 *
 * Overloads para type-safety.
 */
// onlyDistritos = true
export async function fetchZonasBySedePublic(
  sede_id: number
): Promise<ApiResult<ZonaTarifariaPublic[]>>;
// onlyDistritos = true
export async function fetchZonasBySedePublic(
  sede_id: number,
  onlyDistritos: true
): Promise<ApiResult<ZonaTarifariaPublic[]>>;
// onlyDistritos = false
export async function fetchZonasBySedePublic(
  sede_id: number,
  onlyDistritos: false
): Promise<ApiResult<ZonaTarifariaPublicFull[]>>;
export async function fetchZonasBySedePublic(
  sede_id: number,
  onlyDistritos: boolean = true
): Promise<ApiResult<ZonaTarifariaPublic[] | ZonaTarifariaPublicFull[]>> {
  const url = `${BASE_URL}/zona-tarifaria/public/sede/${sede_id}${qs({
    onlyDistritos,
  })}`;

  const res = await withTimeout(
    fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    })
  );

  return handle<ZonaTarifariaPublic[] | ZonaTarifariaPublicFull[]>(res);
}

/**
 * PÚBLICO – sin token – por courier_id (compat)
 * Endpoint: GET /zona-tarifaria/public/courier/:courier_id?onlyDistritos=...
 */
// onlyDistritos = true
export async function fetchZonasByCourierPublic(
  courier_id: number
): Promise<ApiResult<ZonaTarifariaPublic[]>>;
// onlyDistritos = true
export async function fetchZonasByCourierPublic(
  courier_id: number,
  onlyDistritos: true
): Promise<ApiResult<ZonaTarifariaPublic[]>>;
// onlyDistritos = false
export async function fetchZonasByCourierPublic(
  courier_id: number,
  onlyDistritos: false
): Promise<ApiResult<ZonaTarifariaPublicFull[]>>;
export async function fetchZonasByCourierPublic(
  courier_id: number,
  onlyDistritos: boolean = true
): Promise<ApiResult<ZonaTarifariaPublic[] | ZonaTarifariaPublicFull[]>> {
  const url = `${BASE_URL}/zona-tarifaria/public/courier/${courier_id}${qs({
    onlyDistritos,
  })}`;

  const res = await withTimeout(
    fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    })
  );

  return handle<ZonaTarifariaPublic[] | ZonaTarifariaPublicFull[]>(res);
}
