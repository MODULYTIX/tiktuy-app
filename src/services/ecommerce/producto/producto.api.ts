import type { Producto } from './producto.types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchProductos(token: string): Promise<Producto[]> {
  const res = await fetch(`${API_URL}/productos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function fetchProductoByUuid(uuid: string, token: string): Promise<Producto> {
  const res = await fetch(`${API_URL}/productos/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

export async function crearProducto(data: Partial<Producto>, token: string): Promise<Producto> {
  const res = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Error al crear producto');
  return res.json();
}

// 🆕 Nuevo: Filtros dinámicos
export async function fetchProductosFiltrados(filters: Record<string, any>, token: string): Promise<Producto[]> {
  const query = new URLSearchParams();

  for (const key in filters) {
    if (filters[key]) query.append(key, filters[key]);
  }

  const res = await fetch(`${API_URL}/productos?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener productos filtrados');
  return res.json();
}
