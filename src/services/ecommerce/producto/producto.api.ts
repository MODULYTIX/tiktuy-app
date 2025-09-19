// src/services/ecommerce/producto/producto.api.ts
import type { Producto } from './producto.types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/productos`;

/** Lista simple (con orden por defecto y cache-buster) */
export async function fetchProductos(token: string): Promise<Producto[]> {
  const url = new URL(BASE);
  url.searchParams.set('order', 'new_first');
  url.searchParams.set('_ts', Date.now().toString());

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

/** Detalle por UUID */
export async function fetchProductoByUuid(uuid: string, token: string): Promise<Producto> {
  const res = await fetch(`${BASE}/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

/** Crear producto */
export async function crearProducto(data: Partial<Producto>, token: string): Promise<Producto> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error al crear producto');
  }
  return res.json();
}

/** Actualizar producto por UUID (PUT) */
export async function actualizarProducto(
  uuid: string,
  data: Partial<Producto>,
  token: string
): Promise<Producto> {
  const res = await fetch(`${BASE}/${uuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error al actualizar producto');
  }
  return res.json();
}

// ===========================
//  Filtros dinámicos (UI → API)
// ===========================
type UiFilters = {
  almacenamiento_id?: string;
  categoria_id?: string;
  estado?: string;          // 'activo' | 'inactivo' | ''
  stock_bajo?: boolean;
  precio_bajo?: boolean;
  precio_alto?: boolean;
  search?: string;
  order?: 'new_first' | 'price_asc' | 'price_desc';
  [k: string]: any;
};

export async function fetchProductosFiltrados(
  uiFilters: UiFilters,
  token: string
): Promise<Producto[]> {
  const url = new URL(BASE);

  // 1) texto -> q
  if (uiFilters.search && uiFilters.search.trim()) {
    url.searchParams.set('q', uiFilters.search.trim());
  }

  // 2) ids directos
  if (uiFilters.almacenamiento_id) {
    url.searchParams.set('almacenamiento_id', String(uiFilters.almacenamiento_id));
  }
  if (uiFilters.categoria_id) {
    url.searchParams.set('categoria_id', String(uiFilters.categoria_id));
  }

  // 3) estado
  if (uiFilters.estado) {
    url.searchParams.set('estado', uiFilters.estado);
  }

  // 4) stock bajo
  if (uiFilters.stock_bajo) {
    url.searchParams.set('stock_bajo', '1');
  }

  // 5) orden
  if (uiFilters.precio_bajo) {
    url.searchParams.set('order', 'price_asc');
  } else if (uiFilters.precio_alto) {
    url.searchParams.set('order', 'price_desc');
  } else if (uiFilters.order) {
    url.searchParams.set('order', uiFilters.order);
  } else {
    url.searchParams.set('order', 'new_first');
  }

  // 6) soporta adicionales
  const passthroughKeys = new Set([
    'almacenamiento_id',
    'categoria_id',
    'estado',
    'stock_bajo',
    'precio_bajo',
    'precio_alto',
    'search',
    'order',
  ]);

  Object.entries(uiFilters || {}).forEach(([key, value]) => {
    if (passthroughKeys.has(key)) return;
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  // Cache-buster + no-cache
  url.searchParams.set('_ts', Date.now().toString());

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error al obtener productos filtrados');
  }

  return res.json();
}
