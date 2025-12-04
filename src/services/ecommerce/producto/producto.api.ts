// src/services/ecommerce/producto/producto.api.ts
import type {
  Producto,
  Paginated,
  ProductoListQuery,
  ProductoCreateInput,
  ProductoUpdateInput,
  PaginatedProductosMovidos,
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
// Crear: usa FormData si viene archivo, sino JSON
export async function crearProducto(
  data: ProductoCreateInput,
  token: string
): Promise<Producto> {
  const hasFile = !!(data as any).file;

  if (hasFile) {
    const fd = new FormData();
    // archivo -> campo 'imagen'
    fd.append('imagen', (data as any).file as File);

    // campos obligatorios / comunes
    fd.append('nombre_producto', String(data.nombre_producto));
    fd.append('almacenamiento_id', String(data.almacenamiento_id));
    fd.append('precio', String(data.precio));
    fd.append('stock_minimo', String(data.stock_minimo));
    fd.append('peso', String(data.peso));

    // opcionales
    if (data.descripcion != null) fd.append('descripcion', String(data.descripcion));
    if (data.codigo_identificacion) fd.append('codigo_identificacion', String(data.codigo_identificacion));
    if (data.stock != null) fd.append('stock', String(data.stock));
    if (data.estado) fd.append('estado', String(data.estado));

    // categoría (recomendado: solo categoria_id)
    if (data.categoria_id != null) {
      fd.append('categoria_id', String(data.categoria_id));
    } else if (data.categoria?.nombre) {
      fd.append('categoria.nombre', data.categoria.nombre);
      if (data.categoria.descripcion) fd.append('categoria.descripcion', data.categoria.descripcion);
      if (typeof data.categoria.es_global === 'boolean') {
        fd.append('categoria.es_global', String(data.categoria.es_global));
      }
    }

    const res = await fetch(BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }, // NO pongas Content-Type, el browser lo setea
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Error al crear producto'));
    return res.json();
  }

  // sin archivo -> JSON
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error al crear producto'));
  return res.json();
}


// =====================
// ACTUALIZAR (**PUT**)
// =====================
/**
 * Actualiza campos parciales o totales vía **PUT** para alinearse con tu backend.
 * También puedes cambiar de categoría con categoria_id o categoria{...}.
 */
// Actualizar: FormData solo si hay archivo o si quieres enviar multipart; sino JSON
export async function actualizarProducto(
  uuid: string,
  data: ProductoUpdateInput,
  token: string
): Promise<Producto> {
  const hasFile = !!(data as any).file;

  if (hasFile) {
    const fd = new FormData();
    // archivo -> 'imagen'
    fd.append('imagen', (data as any).file as File);

    // campos opcionales
    if (data.nombre_producto != null) fd.append('nombre_producto', String(data.nombre_producto));
    if (data.descripcion != null) fd.append('descripcion', String(data.descripcion));
    if (data.almacenamiento_id != null) fd.append('almacenamiento_id', String(data.almacenamiento_id));
    if (data.categoria_id != null) fd.append('categoria_id', String(data.categoria_id));
    if (data.codigo_identificacion != null) fd.append('codigo_identificacion', String(data.codigo_identificacion));
    if (data.precio != null) fd.append('precio', String(data.precio));
    if (data.stock != null) fd.append('stock', String(data.stock));
    if (data.stock_minimo != null) fd.append('stock_minimo', String(data.stock_minimo));
    if (data.peso != null) fd.append('peso', String(data.peso));
    if (data.estado_id != null) fd.append('estado_id', String(data.estado_id));
    if (data.estado != null) fd.append('estado', String(data.estado));
    if (data.imagen_url_remove === true) fd.append('imagen_url_remove', 'true');

    // categoría por objeto (si no usas categoria_id). Mejor evita esto y usa categoria_id.
    if (data.categoria?.nombre) {
      fd.append('categoria.nombre', data.categoria.nombre);
      if (data.categoria.descripcion) fd.append('categoria.descripcion', data.categoria.descripcion);
      if (typeof data.categoria.es_global === 'boolean') {
        fd.append('categoria.es_global', String(data.categoria.es_global));
      }
    }

    const res = await fetch(`${BASE}/${uuid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Error al actualizar producto'));
    return res.json();
  }

  // sin archivo -> JSON (también sirve para eliminar imagen con imagen_url_remove: true)
  const res = await fetch(`${BASE}/${uuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error al actualizar producto'));
  return res.json();
}


// ==========================================
// LISTAR con filtros desde la UI (paginado)
// ==========================================
type UiFilters = {
  search?: string;
  almacenamiento_id?: number | string;
  categoria_id?: number | string;
  estado?: string;
  stock_bajo?: boolean;
  precio_bajo?: boolean;
  precio_alto?: boolean;
  order?: 'new_first' | 'price_asc' | 'price_desc';
  page?: number;
  perPage?: number;
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
    precio_bajo: !!ui.precio_bajo,
    precio_alto: !!ui.precio_alto,
    order: ui.precio_bajo
      ? 'price_asc'
      : ui.precio_alto
      ? 'price_desc'
      : ui.order || 'new_first',
    page: ui.page ?? 1,
    perPage: ui.perPage ?? 10,
  };

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
// ===============================
// LISTAR PRODUCTOS MOVIDOS (NEW)
// ===============================
export async function fetchProductosMovidos(
  token: string,
  params: { almacen_id: number; page?: number; perPage?: number }
): Promise<PaginatedProductosMovidos> {
  if (!params.almacen_id) throw new Error("almacen_id es obligatorio");

  const query = {
    almacen_id: params.almacen_id,
    page: params.page ?? 1,
    perPage: params.perPage ?? 10,
  };

  const res = await fetch(buildURL(`${BASE}/movimientos`, query), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error al obtener productos movidos');
  }

  return res.json();
}
