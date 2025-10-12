import type {
  SolicitudCourierInput,
  SolicitudCourier,
  SolicitudResponse,
  CambioEstadoResponse,
} from './solicitud-courier.types';

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
