import type {
  ApiResult,
  ZonaTarifaria,
  ZonaTarifariaPublic,
  CrearZonaTarifariaPayload,
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

  // Intento parsear JSON si no es 204
  try {
    const ct = res.headers.get("content-type") || "";
    if (res.status !== 204 && ct.includes("application/json")) {
      body = await res.json();
    } else if (res.status !== 204) {
      // Si no vino JSON, intento texto para mensaje de error
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
 * Crea una zona tarifaria **con courier_id explícito**.
 * Requiere token (Bearer) y payload con:
 * { courier_id, distrito, zona_tarifario, tarifa_cliente, pago_motorizado, estado_id }
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
 * No requiere courier_id en el payload (el backend lo resuelve por el usuario).
 * Requiere token.
 * Payload: { distrito, zona_tarifario, tarifa_cliente, pago_motorizado, estado_id }
 */
export async function crearZonaTarifariaParaMiUsuario(
  payload: Omit<CrearZonaTarifariaPayload, "courier_id">,
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

/* =========================================================
 *                 LISTADOS (privado/ público)
 * =======================================================*/

/** PRIVADO (incluye estado) – requiere token */
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

/** Mis zonas (usuario autenticado) – requiere token */
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

/** Tipos para respuesta pública extendida (cuando onlyDistritos=false) */
export type ZonaTarifariaPublicFull = Pick<
  ZonaTarifaria,
  "distrito" | "zona_tarifario" | "tarifa_cliente" | "pago_motorizado"
>;

/**
 * PÚBLICO – sin token
 * Por defecto devuelve solo { distrito } (onlyDistritos=true).
 * Si envías onlyDistritos=false, el backend devolverá además zona_tarifario, tarifa_cliente, pago_motorizado.
 *
 * Overloads para type-safety:
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
): Promise<
  ApiResult<ZonaTarifariaPublic[] | ZonaTarifariaPublicFull[]>
> {
  const url = `${BASE_URL}/zona-tarifaria/public/courier/${courier_id}${qs({
    onlyDistritos,
  })}`;

  const res = await withTimeout(
    fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    })
  );

  // TypeScript entenderá el tipo a través de los overloads
  return handle<any>(res);
}
