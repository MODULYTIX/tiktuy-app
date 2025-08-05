import type { Pedido } from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchPedidos(token: string): Promise<Pedido[]> {
  const res = await fetch(`${API_URL}/pedido`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

export async function fetchPedidoById(id: number, token: string): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Pedido no encontrado');
  return res.json();
}

export async function crearPedido(data: Partial<Pedido>, token: string): Promise<Pedido> {
  console.log('🚀 Enviando payload a /pedido:', data); // <-- Log del payload

  const res = await fetch(`${API_URL}/pedido`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    // 🔍 Capturar error devuelto por el backend
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al crear pedido - respuesta del backend:', error); // <-- Log del error del backend
    throw new Error('Error al crear pedido');
  }

  return res.json();
}
