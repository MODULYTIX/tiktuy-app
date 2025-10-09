// pedidos.api.ts
import type { Pedido } from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;

type EstadoTab = 'Generado' | 'Asignado' | 'Entregado';

/* ========================= OBTENER ========================= */

export async function fetchPedidos(token: string, estado?: EstadoTab): Promise<Pedido[]> {
  const url = new URL(`${API_URL}/pedido`);
  if (estado) url.searchParams.set('estado', estado);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

// Aliases para mantener compatibilidad con UI existente
export const fetchPedidosGenerados   = (t: string) => fetchPedidos(t, 'Generado');
export const fetchPedidosAsignados   = (t: string) => fetchPedidos(t, 'Asignado');
export const fetchPedidosCompletados = (t: string) => fetchPedidos(t, 'Entregado');

export async function fetchPedidoById(id: number, token: string): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Pedido no encontrado');
  return res.json();
}

/* ========================= CREAR ========================= */

export async function crearPedido(data: Partial<Pedido>, token: string): Promise<Pedido> {
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
    console.error('❌ Error al crear pedido - backend:', error);
    throw new Error('Error al crear pedido');
  }
  return res.json();
}

/* ===================== EDITAR POR ESTADO ===================== */

export type UpdatePedidoGeneradoPayload = {
  nombre_cliente?: string;
  numero_cliente?: string | null;
  celular_cliente?: string;
  direccion_envio?: string;
  referencia_direccion?: string | null;
  distrito?: string;
  monto_recaudar?: number;
  fecha_entrega_programada?: string | null; // ISO o null
  detalle?: { // Edición ligera del primer detalle
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
    console.error('❌ Error al actualizar pedido (generado) - backend:', error);
    throw new Error('Error al actualizar pedido (generado)');
  }
  return res.json();
}

export async function actualizarPedidoAsignado(
  id: number,
  data: Partial<Pedido>,
  token: string
): Promise<Pedido> {
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
    console.error('❌ Error al actualizar pedido asignado - backend:', error);
    throw new Error('Error al actualizar pedido asignado');
  }
  return res.json();
}
