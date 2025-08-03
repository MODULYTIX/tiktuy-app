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
  const res = await fetch(`${API_URL}/pedido`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Error al crear pedido');
  return res.json();
}

export async function asignarMotorizado(
  id: number,
  motorizado_id: number,
  token: string
): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}/asignar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ motorizado_id }),
  });

  if (!res.ok) throw new Error('Error al asignar motorizado');
  return res.json();
}

export async function validarPedido(id: number, token: string): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}/validar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al validar pedido');
  return res.json();
}
