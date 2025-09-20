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

/* ===================== NUEVAS/EXISTENTES RUTAS POR ESTADO ===================== */

// (Opcional) Lista pedidos en estado GENERADO del ecommerce del usuario
export async function fetchPedidosGenerados(token: string): Promise<Pedido[]> {
  // Si no implementas el endpoint backend /pedido/generados, puedes filtrar en frontend con fetchPedidos()
  const res = await fetch(`${API_URL}/pedido/generados`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener pedidos generados');
  return res.json();
}

// Lista solo pedidos en estado ASIGNADO del ecommerce del usuario
export async function fetchPedidosAsignados(token: string): Promise<Pedido[]> {
  const res = await fetch(`${API_URL}/pedido/asignados`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener pedidos asignados');
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

/* ===================== EDITAR POR ESTADO ===================== */

// Payload específico permitido para editar en GENERADO (coincide con tu backend)
export type UpdatePedidoGeneradoPayload = {
  nombre_cliente?: string;
  numero_cliente?: string | null;
  celular_cliente?: string;
  direccion_envio?: string;
  referencia_direccion?: string | null;
  distrito?: string;
  monto_recaudar?: number;
  fecha_entrega_programada?: string | null; // ISO o null

  // Edición ligera del primer detalle
  detalle?: {
    producto_id?: number;
    cantidad?: number;
    precio_unitario?: number;
  };
};

// Edita un pedido que está en estado GENERADO
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

// Edita un pedido que está en estado ASIGNADO (ya lo tenías)
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
