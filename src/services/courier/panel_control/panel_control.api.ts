// panel_control.api.ts
import type {
  ApiResult,
  MensajeResponse,
  LinkResponse,
  RegistroManualPayload,
  CompletarRegistroPayload,
  RegistroInvitacionPayload,
  EcommerceCourier,
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
  const h: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Helper: manejo de respuesta estándar del backend {mensaje} | {link} | objetos */
async function handle<T>(res: Response): Promise<ApiResult<T>> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // sin body JSON
  }

  if (res.ok) {
    return { ok: true, data: body as T };
  }

  const msg =
    body?.error ||
    body?.message ||
    `Error HTTP ${res.status}${res.statusText ? ` - ${res.statusText}` : ""}`;

  return { ok: false, error: msg, status: res.status };
}

/** ---------------- Endpoints: Courier-Ecommerce ---------------- **/

/**
 * POST /courier-ecommerce/registro-manual
 * Requiere token del courier
 */
export async function registrarManualEcommerce(
  payload: RegistroManualPayload,
  token: string
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(`${BASE_URL}/courier-ecommerce/registro-manual`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
  return handle<MensajeResponse>(res);
}

/**
 * POST /courier-ecommerce/completar-registro
 * No requiere auth (viene desde el email con token)
 */
export async function completarRegistro(
  payload: CompletarRegistroPayload
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(`${BASE_URL}/courier-ecommerce/completar-registro`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<MensajeResponse>(res);
}

/**
 * POST /courier-ecommerce/invitar
 * Genera link de invitación. Requiere token del courier.
 */
export async function generarLinkInvitacion(
  token: string
): Promise<ApiResult<LinkResponse>> {
  const res = await fetch(`${BASE_URL}/courier-ecommerce/invitar`, {
    method: "POST",
    headers: buildHeaders(token),
  });
  return handle<LinkResponse>(res);
}

/**
 * POST /courier-ecommerce/registro-invitacion
 * Registro completo desde el formulario de invitación
 */
export async function registrarDesdeInvitacion(
  payload: RegistroInvitacionPayload
): Promise<ApiResult<MensajeResponse>> {
  const res = await fetch(`${BASE_URL}/courier-ecommerce/registro-invitacion`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<MensajeResponse>(res);
}

/**
 * GET /courier-ecommerce/ecommerces
 * Lista ecommerces asociados al courier autenticado
 */
export async function listarEcommercesAsociados(
  token: string
): Promise<ApiResult<EcommerceCourier[]>> {
  const res = await fetch(`${BASE_URL}/courier-ecommerce/ecommerces`, {
    method: "GET",
    headers: buildHeaders(token),
  });
  return handle<EcommerceCourier[]>(res);
}

/** ---------------- Utilidades opcionales ---------------- **/

/**
 * Pequeño helper por si manejas el token en localStorage.
 * Si no lo usas, ignóralo.
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/**
 * Ejemplo de uso:
 * const token = getAuthToken();
 * if (!token) { ... }
 * const res = await listarEcommercesAsociados(token);
 */
