import type {
  SolicitudCourierInput,
  SolicitudCourier,
  SolicitudResponse,
  CambioEstadoResponse,
  SolicitudCourierCompleto,
} from './solicitud-courier.types';

import type {
  SolicitudEcommerceInput,
  SolicitudEcommerce,
  SolicitudEcommerceResponse,
  CambioEstadoResponseEcommerce,
} from './solicitud-ecommerce.types';

/* ==========================================================
     COURIER 
   ========================================================== */

/**
 * Registrar nueva solicitud de courier (público)
 */
export async function registrarSolicitudCourier(
  data: SolicitudCourierInput
): Promise<SolicitudResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/solicitudes/courier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar la solicitud');
  return res.json();
}

/**
 * Listar todas las solicitudes de courier (solo admin)
 */
export async function fetchSolicitudesCourier(token: string): Promise<SolicitudCourier[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/solicitudes/couriers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return res.json();
}

/**
 * Cambiar estado de un courier (asociar / desasociar)
 */
export async function cambiarEstadoCourier(
  token: string,
  courierUuid: string,
  accion: 'asociar' | 'desasociar'
): Promise<CambioEstadoResponse> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/admin/solicitudes/couriers/${courierUuid}/estado`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accion }),
    }
  );
  if (!res.ok) throw new Error('Error al cambiar el estado del courier');
  return res.json();
}

/* ==========================================================
     ECOMMERCE 
   ========================================================== */

/**
 * Registrar nueva solicitud de ecommerce (público)
 * POST /admin/solicitudes/ecommerce
 */
export async function registrarSolicitudEcommerce(
  data: SolicitudEcommerceInput
): Promise<SolicitudEcommerceResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/solicitudes/ecommerce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar la solicitud de ecommerce');
  return res.json();
}

/**
 * Listar todas las solicitudes de ecommerce (solo admin)
 * GET /admin/solicitudes/ecommerces
 */
export async function fetchSolicitudesEcommerce(token: string): Promise<SolicitudEcommerce[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/solicitudes/ecommerces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes de ecommerce');
  return res.json();
}

/**
 * Cambiar estado de un ecommerce (asociar / desasociar)
 * PATCH /admin/solicitudes/ecommerces/:uuid/estado
 */
export async function cambiarEstadoEcommerce(
  token: string,
  ecommerceUuid: string,
  accion: 'asociar' | 'desasociar'
): Promise<CambioEstadoResponseEcommerce> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/admin/solicitudes/ecommerces/${ecommerceUuid}/estado`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accion }),
    }
  );
  if (!res.ok) throw new Error('Error al cambiar el estado del ecommerce');
  return res.json();
}

/**
 * Confirmar creación de contraseña de invitación (público)
 * POST /admin/solicitudes/ecommerce/confirmar-password
 */
export async function confirmarPasswordEcommerce(params: {
  token: string;
  contrasena: string;
  confirmar_contrasena: string;
}): Promise<{ ok: boolean; message: string; usuario_id?: number }> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/admin/solicitudes/ecommerce/confirmar-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }
  );
  if (!res.ok) throw new Error('Error al confirmar la contraseña del ecommerce');
  return res.json();
}

/**
 * Listar couriers con datos completos (admin)
 * GET /admin/solicitudes/couriers/completo
 */
export async function fetchSolicitudesCourierCompleto(
  token: string
): Promise<SolicitudCourierCompleto[]> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/admin/solicitudes/couriers/completo`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error('Error al obtener solicitudes completas de courier');
  return res.json();
}
