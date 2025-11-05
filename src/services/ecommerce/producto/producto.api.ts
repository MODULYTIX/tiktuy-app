// src/services/ecommerce/producto/producto.api.ts
import type {
  Producto,
  Paginated,
  ProductoListQuery,
  ProductoCreateInput,
  ProductoUpdateInput,
} from './producto.types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/productos`;

// ---------------------------
// Util: construir querystring
// ---------------------------
function buildURL(base: string, params?: Record<string, any>) {
  const url = new URL(base);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        v.forEach((x) => url.searchParams.append(k, String(x)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }
  // cache-buster
  url.searchParams.set('_ts', Date.now().toString());
  return url.toString();
}

// =======================================
// LISTAR (paginado) — default orden nuevo
// =======================================
/**
 * Lista paginada con defaults seguros:
 * - order=new_first
 * - page=1, perPage=10
 */
export async function fetchProductos(
  token: string,
  params: Partial<ProductoListQuery> = {}
): Promise<Paginated<Producto>> {
  const query: ProductoListQuery = {
    order: params.order ?? 'new_first',
    page: params.page ?? 1,
    perPage: params.perPage ?? 10,
    q: params.q,
    almacenamiento_id: params.almacenamiento_id,
    categoria_id: params.categoria_id,
    estado: params.estado,
    stock_bajo: params.stock_bajo,
    precio_bajo: params.precio_bajo,
    precio_alto: params.precio_alto,
  };

  const res = await fetch(buildURL(BASE, query), {
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

// ==================
// DETALLE POR UUID
// ==================
export async function fetchProductoByUuid(
  uuid: string,
  token: string
): Promise<Producto> {
  const res = await fetch(`${BASE}/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

// ===============
// CREAR PRODUCTO
// ===============
/**
 * Crea un producto ligado a una sede (almacenamiento_id requerido).
 * Acepta:
 *  - categoria_id  O
 *  - categoria { nombre, descripcion?, es_global? }
 */
export async function crearProducto(
  data: ProductoCreateInput,
  token: string
): Promise<Producto> {
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

// =====================
// ACTUALIZAR (PATCH)
// =====================
/**
 * Actualiza campos parciales. También puedes cambiar de categoría
 * pasando categoria_id o categoria{...} y mover de sede (validado en backend).
 */
export async function actualizarProducto(
  uuid: string,
  data: ProductoUpdateInput,
  token: string
): Promise<Producto> {
  const res = await fetch(`${BASE}/${uuid}`, {
    method: 'PATCH', // <- usamos PATCH (no PUT) según backend
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

// ==========================================
// LISTAR con filtros desde la UI (paginado)
// ==========================================
/**
 * Recibe los filtros de la UI y los mapea al backend.
 * Retorna siempre Paginated<Producto>.
 */
type UiFilters = {
  // texto libre
  search?: string;

  // ids
  almacenamiento_id?: number | string;
  categoria_id?: number | string;

  // estado: 'activo' | 'inactivo' | 'descontinuado'
  estado?: string;

  // flags
  stock_bajo?: boolean;
  precio_bajo?: boolean;
  precio_alto?: boolean;

  // orden
  order?: 'new_first' | 'price_asc' | 'price_desc';

  // paginación
  page?: number;
  perPage?: number;

  // extras
  [k: string]: any;
};

export async function fetchProductosFiltrados(
  ui: UiFilters,
  token: string
): Promise<Paginated<Producto>> {
  const query: ProductoListQuery = {
    q: ui.search?.trim() || undefined,
    almacenamiento_id: ui.almacenamiento_id
      ? Number(ui.almacenamiento_id)
      : undefined,
    categoria_id: ui.categoria_id ? Number(ui.categoria_id) : undefined,
    estado: ui.estado
      ? (ui.estado.toLowerCase() as ProductoListQuery['estado'])
      : undefined,
    stock_bajo: !!ui.stock_bajo,

    // compat de flags
    precio_bajo: !!ui.precio_bajo,
    precio_alto: !!ui.precio_alto,

    // orden
    order:
      ui.precio_bajo
        ? 'price_asc'
        : ui.precio_alto
        ? 'price_desc'
        : ui.order || 'new_first',

    // paginación
    page: ui.page ?? 1,
    perPage: ui.perPage ?? 10,
  };

  // pasar-through extras no conflictivos
  const passthrough: Record<string, any> = {};
  const reserved = new Set([
    'search',
    'almacenamiento_id',
    'categoria_id',
    'estado',
    'stock_bajo',
    'precio_bajo',
    'precio_alto',
    'order',
    'page',
    'perPage',
  ]);

  Object.entries(ui).forEach(([k, v]) => {
    if (reserved.has(k)) return;
    if (v === undefined || v === null || v === '') return;
    passthrough[k] = v;
  });

  const res = await fetch(buildURL(BASE, { ...query, ...passthrough }), {
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
