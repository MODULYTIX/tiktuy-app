// pedidos.api.ts
import type { Pedido, CrearPedidoDTO } from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;

type EstadoTab = 'Generado' | 'Asignado' | 'Entregado';

/* ==========================================================
   OBTENER CON PAGINACIÓN
   ========================================================== */
export async function fetchPedidos(
  token: string,
  estado?: EstadoTab,
  page = 1,
  perPage = 10
): Promise<{ data: Pedido[]; pagination: any }> {
  const url = new URL(`${API_URL}/pedido`);

  url.searchParams.set('page', String(page));
  url.searchParams.set('perPage', String(perPage));
  if (estado) url.searchParams.set('estado', estado);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

// Aliases viejos siguen funcionando
export const fetchPedidosGenerados = (t: string, p = 1, pp = 10) =>
  fetchPedidos(t, 'Generado', p, pp);

export const fetchPedidosAsignados = (t: string, p = 1, pp = 10) =>
  fetchPedidos(t, 'Asignado', p, pp);

export const fetchPedidosCompletados = (t: string, p = 1, pp = 10) =>
  fetchPedidos(t, 'Entregado', p, pp);

export async function fetchPedidoById(id: number, token: string): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Pedido no encontrado');
  return res.json();
}

/* ==========================================================
   CREAR
   ========================================================== */
export async function crearPedido(
  data: CrearPedidoDTO, // viene del formulario (usa sede_id, NO courier_id)
  token: string
): Promise<Pedido> {
  console.log('🚀 Enviando payload a /pedido:', data);

  const res = await fetch(`${API_URL}/pedido`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al crear pedido (backend):', error);
    throw new Error('Error al crear pedido');
  }

  return res.json();
}

/* ==========================================================
   EDITAR ESTADO: GENERADO
   ========================================================== */
export type UpdatePedidoGeneradoPayload = {
  nombre_cliente?: string;
  numero_cliente?: string | null;
  celular_cliente?: string;
  direccion_envio?: string;
  referencia_direccion?: string | null;
  distrito?: string;
  monto_recaudar?: number;
  fecha_entrega_programada?: string | null;

  detalle?: {
    producto_id?: number;
    cantidad?: number;
    precio_unitario?: number;
  };
};

export async function actualizarPedidoGenerado(
  id: number,
  data: UpdatePedidoGeneradoPayload,
  token: string
): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/generado/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error backend:', error);
    throw new Error('Error al actualizar pedido (generado)');
  }
  return res.json();
}

/* ==========================================================
   EDITAR ESTADO: ASIGNADO
   ========================================================== */
export async function actualizarPedidoAsignado(
  id: number,
  data: Partial<Pedido>,
  token: string
): Promise<Pedido> {
  // courier_id ya NO se manda desde frontend
  if ('courier_id' in data) delete (data as any).courier_id;

  const res = await fetch(`${API_URL}/pedido/asignado/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error backend:', error);
    throw new Error('Error al actualizar pedido asignado');
  }
  return res.json();
}
