import type {
    CambiarEstadoPayload,
    CambiarEstadoResponse,
    ConfirmarPasswordPayload,
    ConfirmarPasswordResponse,
    ListarCouriersResponse,
    RegistrarCourierInput,
    RegistrarCourierResponse,
  } from './admin-invite.type';
  
  const BASE = `${import.meta.env.VITE_API_URL ?? ''}`.replace(/\/+$/, '');
  
  // ---- Admin auth helpers ----
  type TokenProvider = () => string | null | undefined;
  
  const resolveToken = (tk?: string | TokenProvider | null) =>
    typeof tk === 'function'
      ? tk() ?? null
      : typeof tk === 'string'
      ? tk
      : (() => {
          try {
            return localStorage.getItem('tk');
          } catch {
            return null;
          }
        })();
  
  function authHeaders(tk?: string | TokenProvider | null): Record<string, string> {
    const token = resolveToken(tk);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  // ---- JSON fetch con timeout y headers saneados ----
  async function jsonFetch<T>(
    url: string,
    init?: RequestInit & { timeoutMs?: number }
  ): Promise<T> {
    const { timeoutMs = 15000, ...rest } = init ?? {};
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
  
    try {
      // Fusionar headers SIN undefined
      const base: Record<string, string> = { 'Content-Type': 'application/json' };
      let incoming: Record<string, string> = {};
  
      if (rest.headers) {
        if (rest.headers instanceof Headers) {
          incoming = Object.fromEntries(rest.headers.entries());
        } else if (Array.isArray(rest.headers)) {
          incoming = Object.fromEntries(rest.headers as Array<[string, string]>);
        } else {
          incoming = rest.headers as Record<string, string>;
        }
      }
  
      const mergedHeaders: Record<string, string> = {
        ...base,
        ...incoming,
      };
  
      const res = await fetch(url, {
        ...rest,
        headers: mergedHeaders,
        signal: ac.signal,
      });
  
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
  
      if (!res.ok) {
        const msg =
          (data as any)?.error || (data as any)?.message || `Error ${res.status}`;
        throw new Error(String(msg));
      }
  
      return data as T;
    } catch (e: any) {
      if (e?.name === 'AbortError')
        throw new Error('La solicitud tardó demasiado (timeout).');
      throw e;
    } finally {
      clearTimeout(t);
    }
  }
  
  const R = {
    registrar: '/admin/solicitudes/courier',
    listar: '/admin/solicitudes/couriers',
    cambiarEstado: (uuid: string) => `/admin/solicitudes/couriers/${uuid}/estado`,
    confirmarPassword: '/admin/solicitudes/courier/confirmar-password',
    confirmarPasswordEcommerce: '/admin/solicitudes/ecommerce/confirmar-password',
  };
  
  // --------- Públicas ---------
  export function registrarSolicitudCourier(
    payload: RegistrarCourierInput
  ): Promise<RegistrarCourierResponse> {
    return jsonFetch<RegistrarCourierResponse>(`${BASE}${R.registrar}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  // Courier 
  export function confirmarPasswordInvitacion(
    payload: ConfirmarPasswordPayload
  ): Promise<ConfirmarPasswordResponse> {
    return jsonFetch<ConfirmarPasswordResponse>(`${BASE}${R.confirmarPassword}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  
// Ecommerce
export function confirmarPasswordInvitacionEcommerce(
  payload: ConfirmarPasswordPayload
): Promise<ConfirmarPasswordResponse> {
  return jsonFetch<ConfirmarPasswordResponse>(`${BASE}${R.confirmarPasswordEcommerce}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

  // --------- Admin (Bearer opcional según tu auth) ---------
  export function listarSolicitudesCouriers(
    token?: string | TokenProvider | null
  ): Promise<ListarCouriersResponse> {
    return jsonFetch<ListarCouriersResponse>(`${BASE}${R.listar}`, {
      method: 'GET',
      headers: {
        ...authHeaders(token), 
      },
    });
  }
  
  export function cambiarEstadoCourier(
    courierUuid: string,
    payload: CambiarEstadoPayload,
    token?: string | TokenProvider | null
  ): Promise<CambiarEstadoResponse> {
    return jsonFetch<CambiarEstadoResponse>(`${BASE}${R.cambiarEstado(courierUuid)}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    });
  }
  