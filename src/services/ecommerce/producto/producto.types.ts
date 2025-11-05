// src/services/ecommerce/producto/producto.types.ts
import type { Almacenamiento } from '../almacenamiento/almacenamiento.types';
import type { Categoria } from '../categoria/categoria.types';

/** Estado mínimo que devuelve el include { estado: true } */
export type EstadoBasico = {
  id: number;
  nombre: 'Activo' | 'Inactivo' | 'Descontinuado' | string;
};

/** Modelo del producto tal como lo devuelve el backend (includes) */
export interface Producto {
  id: number;
  uuid: string;
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion?: string | null;

  /** URL pública de la imagen (Cloudinary/S3). Puede ser null si no tiene. */
  imagen_url?: string | null;

  categoria_id?: number;               // puede venir si no se pide include
  almacenamiento_id: number;

  precio: number;
  stock: number;
  stock_minimo: number;
  peso: number;

  estado_id: number;

  // Fechas: el backend puede serializarlas como ISO string
  fecha_registro?: string | null;      // a veces lo usas; lo dejo opcional
  created_at?: string;                 // usado para order=new_first
  updated_at?: string;

  // Includes (pueden o no venir, según endpoint)
  categoria?: Categoria | null;
  almacenamiento?: Almacenamiento | null;
  estado?: EstadoBasico | null;
}

/** Filtros de listado (query params) */
export type ProductoListQuery = {
  q?: string;
  almacenamiento_id?: number;
  categoria_id?: number;
  estado?: 'activo' | 'inactivo' | 'descontinuado';
  stock_bajo?: boolean;

  // compat de flags del cliente (el backend los soporta)
  precio_bajo?: boolean;
  precio_alto?: boolean;

  order?: 'new_first' | 'price_asc' | 'price_desc';

  // paginación
  page?: number;     // default 1
  perPage?: number;  // default 10
};

/** Respuesta paginada estándar del backend */
export type Pagination = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: Pagination;
};

/** Para POST /productos
 *  Nota: puedes mandar categoria_id o un objeto categoria { nombre, descripcion?, es_global? }.
 *  Si adjuntas imagen desde el front, envía FormData con `file` (File) y estos campos como strings.
 */
export type ProductoCreateInput = {
  nombre_producto: string;
  descripcion?: string | null;

  almacenamiento_id: number;  // sede obligatoria

  // categoría: una de las dos opciones
  categoria_id?: number;
  categoria?: {
    nombre: string;
    descripcion?: string;
    es_global?: boolean;
  };

  codigo_identificacion?: string;
  precio: number;
  stock?: number;
  stock_minimo: number;
  peso: number;

  /** opcional: si la UI manda 'estado' como string, el backend lo entiende */
  estado?: 'Activo' | 'Inactivo' | 'Descontinuado';

  /** Imagen opcional: el front enviará multipart con este archivo */
  file?: File;               // ← se convierte en FormData; el backend leerá file.path
};

/** Para PATCH /productos/:uuid
 *  Todo opcional; mismas reglas de categoría.
 *  Si adjuntas nueva imagen, envía `file` (File) en FormData.
 *  Si quieres quitar la imagen, envía `imagen_url_remove: true`.
 */
export type ProductoUpdateInput = Partial<{
  nombre_producto: string;
  descripcion: string | null;

  almacenamiento_id: number;

  categoria_id: number;
  categoria: {
    nombre: string;
    descripcion?: string;
    es_global?: boolean;
  };

  codigo_identificacion: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  peso: number;

  estado_id: number;
  estado: 'Activo' | 'Inactivo' | 'Descontinuado';

  /** Imagen */
  imagen_url: string | null;   // lectura/escritura directa (poco común en front)
  imagen_url_remove: boolean;  // para borrar la referencia en el backend
  file: File;                  // nueva imagen (multipart/FormData)
}>;
