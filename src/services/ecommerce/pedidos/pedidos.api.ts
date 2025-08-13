import type { Pedido } from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchPedidos(token: string): Promise<Pedido[]> {
  const res = await fetch(`${API_URL}/pedido`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

export async function fetchPedidoById(id: number, token: string): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Pedido no encontrado');
  return res.json();
}

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

/* ===================== NUEVAS RUTAS ===================== */

// Lista solo pedidos en estado ASIGNADO del ecommerce del usuario
export async function fetchPedidosAsignados(token: string): Promise<Pedido[]> {
  const res = await fetch(`${API_URL}/pedido/asignados`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener pedidos asignados');
  return res.json();
}

// Edita un pedido que está en estado ASIGNADO
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

// Lista solo pedidos en estado ENTREGADO (completados) del ecommerce del usuario
export async function fetchPedidosCompletados(token: string): Promise<Pedido[]> {
  const res = await fetch(`${API_URL}/pedido/completados`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener pedidos completados');
  return res.json();
}
