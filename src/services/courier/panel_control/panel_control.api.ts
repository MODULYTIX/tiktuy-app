import type {
  ApiResult,
  MensajeResponse,
  LinkResponse,
  // Ecommerce
  RegistroManualPayload,
  CompletarRegistroPayload,
  RegistroInvitacionPayload,
  EcommerceSede,
  // Motorizado
  RegistroManualMotorizadoPayload,
  CompletarRegistroMotorizadoPayload,
  RegistroInvitacionMotorizadoPayload,
  Motorizado,
} from "./panel_control.types";

/**
 * Usa VITE_API_URL (por ejemplo: http://localhost:3000/api) o cae a un valor por defecto.
 * Asegúrate de que tus rutas del backend estén montadas bajo /api o ajusta BASE_URL.
 */
const BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

/** Helper: compone headers con/ sin Bearer */
function buildHeaders(token?: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as any)["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Helper: manejo de respuesta estándar del backend { ok, data } | { data } | objeto puro */
async function handle<T>(res: Response): Promise<ApiResult<T>> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // sin body JSON
  }

  if (res.ok) {
    // backend puede devolver:
    // - { ok:true, data: ... }
    // - { data: ... }
    // - cualquier objeto T (p.ej. { mensaje }, array, etc.)
    if (body && typeof body === "object") {
      if ("ok" in body && "data" in body) {
        return { ok: true, data: body.data as T };
      }
      if ("data" in body && !("ok" in body)) {
        return { ok: true, data: body.data as T };
      }
    }
    return { ok: true, data: body as T };
  }

  const msg =
    body?.error ||
    body?.message ||
    `Error HTTP ${res.status}${res.statusText ? ` - ${res.statusText}` : ""}`;

  return { ok: false, error: msg, status: res.status };
}

/* =========================================================
 *                   COURIER — ECOMMERCE (POR SEDE)
 * =======================================================*/

/**
 * POST /courier-ecommerce/registro-manual
 * Requiere token del courier.
 * Admin puede enviar ?sedeId= para registrar en otra sede; representante usa siempre su sede fija.
 */
export async function registrarManualEcommerce(
  payload: RegistroManualPayload,
  token: string,
  opts?: { sedeId?: number }
): Promise<ApiResult<MensajeResponse>> {
  const query = opts?.sedeId
    ? `?sedeId=${encodeURIComponent(String(opts.sedeId))}`
    : "";
  const res = await fetch(
    `${BASE_URL}/courier-ecommerce/registro-manual${query}`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  return handle<MensajeResponse>(res);
}

/**
 * POST /courier-ecommerce/completar-registro
 * No requiere auth (viene desde el email con token).
 */
export async function completarRegistro(
  payload: CompletarRegistroPayload
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(
    `${BASE_URL}/courier-ecommerce/completar-registro`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handle<MensajeResponse>(res);
}

/**
 * POST /courier-ecommerce/invitar
 * Genera link de invitación. Requiere token del courier.
 * Admin puede enviar ?sedeId=; representante usa siempre su sede fija.
 */
export async function generarLinkInvitacion(
  token: string,
  opts?: { sedeId?: number }
): Promise<ApiResult<LinkResponse>> {
  const query = opts?.sedeId
    ? `?sedeId=${encodeURIComponent(String(opts.sedeId))}`
    : "";
  const res = await fetch(
    `${BASE_URL}/courier-ecommerce/invitar${query}`,
    {
      method: "POST",
      headers: buildHeaders(token),
    }
  );
  return handle<LinkResponse>(res);
}

/**
 * POST /courier-ecommerce/registro-invitacion
 * Registro completo desde el formulario de invitación.
 */
export async function registrarDesdeInvitacion(
  payload: RegistroInvitacionPayload
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(
    `${BASE_URL}/courier-ecommerce/registro-invitacion`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handle<MensajeResponse>(res);
}

/**
 * GET /courier-ecommerce/ecommerces
 * Lista ecommerces asociados a la sede actual (representante)
 * o a la sede elegida (?sedeId=) si es admin.
 * Devuelve filas de EcommerceSede (con { ecommerce, sede }).
 */
export async function listarEcommercesAsociados(
  token: string,
  opts?: { sedeId?: number }
): Promise<ApiResult<EcommerceSede[]>> {
  const query = opts?.sedeId
    ? `?sedeId=${encodeURIComponent(String(opts.sedeId))}`
    : "";
  const res = await fetch(
    `${BASE_URL}/courier-ecommerce/ecommerces${query}`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );
  return handle<EcommerceSede[]>(res);
}

/* =========================================================
 *                  COURIER — MOTORIZADO (POR SEDE)
 * =======================================================*/

/**
 * POST /courier-motorizado/registro-manual
 * Requiere token del courier.
 * El backend resuelve la sede:
 *  - Dueño del courier: sede principal.
 *  - Representante de sede: su sede fija.
 */
export async function registrarManualMotorizado(
  payload: RegistroManualMotorizadoPayload,
  token: string
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(
    `${BASE_URL}/courier-motorizado/registro-manual`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  return handle<MensajeResponse>(res);
}

/**
 * POST /courier-motorizado/completar-registro
 * No requiere auth (correo con token).
 */
export async function completarRegistroMotorizado(
  payload: CompletarRegistroMotorizadoPayload
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(
    `${BASE_URL}/courier-motorizado/completar-registro`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handle<MensajeResponse>(res);
}

/**
 * POST /courier-motorizado/invitar
 * Genera link de invitación. Requiere token del courier.
 * El backend guarda courier_id + sede_id que corresponde al usuario (dueño o representante).
 */
export async function generarLinkInvitacionMotorizado(
  token: string
): Promise<ApiResult<LinkResponse>> {
  const res = await fetch(
    `${BASE_URL}/courier-motorizado/invitar`,
    {
      method: "POST",
      headers: buildHeaders(token),
    }
  );
  return handle<LinkResponse>(res);
}

/**
 * POST /courier-motorizado/registro-invitacion
 * Registro desde el formulario público con token.
 */
export async function registrarDesdeInvitacionMotorizado(
  payload: RegistroInvitacionMotorizadoPayload
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(
    `${BASE_URL}/courier-motorizado/registro-invitacion`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handle<MensajeResponse>(res);
}

/**
 * GET /courier-motorizado/motorizados
 * - Dueño del courier: lista todos los motorizados del courier.
 * - Representante de sede: lista solo los motorizados de su sede.
 */
export async function listarMotorizadosAsociados(
  token: string
): Promise<ApiResult<Motorizado[]>> {
  const res = await fetch(
    `${BASE_URL}/courier-motorizado/motorizados`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );
  return handle<Motorizado[]>(res);
}

/* ---------------- Utilidades opcionales ---------------- */

/** Helper para leer el token de auth desde localStorage (si lo usas) */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}
