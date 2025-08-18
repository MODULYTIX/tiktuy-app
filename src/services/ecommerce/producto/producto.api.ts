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
export async function fetchProductosFiltrados(
  filters: Record<string, any>,
  token: string
): Promise<Producto[]> {
  const url = new URL(`${API_URL}/productos`);

  // Construye la query (soporta arrays) y evita enviar vacíos
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  // Cache-buster para forzar 200 en vez de 304
  url.searchParams.set('_ts', Date.now().toString());

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      // Pide explícitamente no usar caché intermedio
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    // Indica a fetch que no use caché del navegador
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error al obtener productos filtrados');
  }

  return res.json();
}