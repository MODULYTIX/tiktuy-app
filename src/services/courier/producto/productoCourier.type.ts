// Estado genérico
export type Estado = {
  id: number;
  nombre: string;
  tipo: string | null;
};

/**
 * Almacenamiento = Sede física
 * Es la misma entidad que usas como sede del courier/ecommerce.
 */
export type Almacenamiento = {
  id: number;
  uuid: string;

  nombre_almacen: string;
  ciudad: string | null;
  departamento: string | null;
  provincia?: string | null;
  direccion: string | null;

  ecommerce_id: number | null;
  courier_id: number | null;

  representante_usuario_id?: number | null;
  es_principal?: boolean;

  estado_id: number;
  fecha_registro?: string;  // puede venir null o faltar en algunas respuestas
  created_at?: string;
  updated_at?: string;
};

// Categoría de producto (pertenece al ecommerce)
export type Categoria = {
  id: number;
  uuid: string;
  descripcion: string;
  ecommerce_id: number;
  estado_id: number;
  nombre: string;
};

// Producto gestionado por el courier (stock por almacenamiento/sede)
export type Producto = {
  id: number;
  uuid: string;

  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string | null;

  categoria_id: number;
  almacenamiento_id: number;

  ecommerce_origen_id: number | null;

  // 🔥 NUEVO (nombre ya resuelto en backend)
  ecommerce_origen_nombre?: string | null;

  stock: number;
  stock_minimo: number;

  // Prisma Decimal → string
  precio: string;
  peso: string;

  imagen_url?: string | null;

  estado_id: number;
  fecha_registro: string;
  created_at: string;
  updated_at: string;

  categoria?: Categoria;
  almacenamiento?: Almacenamiento;
  estado?: Estado;
};


/**
 * Payload para crear un Producto desde el panel del courier
 * (por sede/almacenamiento)
 */
export type CreateCourierProductoInput = {
  codigo_identificacion?: string;
  nombre_producto: string;
  descripcion?: string | null;
  categoria_id: number;
  almacenamiento_id: number;
  precio?: number;        // opcional (el backend pone 0 si falta)
  stock?: number;         // opcional
  stock_minimo?: number;  // opcional
  peso?: number;          // opcional
};
