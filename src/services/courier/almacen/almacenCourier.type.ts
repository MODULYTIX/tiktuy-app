// src/api/almacenCourier.type.ts

/* =========================
 * Almacenes (Courier)
 * ========================= */

export interface AlmacenamientoCourier {
  id: number;
  uuid: string;

  nombre_almacen: string;
  direccion: string;
  departamento: string;
  ciudad: string;

  estado_id: number;
  fecha_registro: string; // ISO

  courier_id?: number | null;
  ecommerce_id?: number | null;

  created_at?: string;
  updated_at?: string;

  // Opcional: si el backend llega a incluir el estado poblado
  estado?: { id: number; nombre: string; tipo?: string };
}

export interface AlmacenCourierCreateDTO {
  nombre_almacen: string;
  direccion: string;
  departamento: string;
  ciudad: string;
}

export interface AlmacenCourierUpdateDTO {
  nombre_almacen?: string;
  direccion?: string;
  departamento?: string;
  ciudad?: string;
}

/* =========================
 * Movimientos (Courier)
 * ========================= */

export interface MovimientoCourierCreateDTO {
  almacen_origen_id: number;
  almacen_destino_id: number;
  descripcion?: string;
  productos: Array<{ producto_id: number; cantidad: number }>;
}

export interface MovimientoProductoItem {
  id: number;
  movimiento_id: number;
  producto_id: number;
  cantidad: number;
  producto?: {
    id: number;
    uuid: string;
    nombre_producto: string;
    codigo_identificacion: string;
    almacenamiento_id: number;
    stock: number;
    precio: number; // si en tu backend es string/Decimal, cámbialo a string
  };
}

export interface MovimientoAlmacenCourier {
  id: number;
  uuid: string;
  descripcion?: string | null;
  fecha_movimiento: string; // ISO
  estado_id: number;

  almacen_origen_id: number;
  almacen_destino_id: number;

  created_at?: string;
  updated_at?: string;

  estado?: { id: number; nombre: string; tipo: string };

  almacen_origen?: Pick<
    AlmacenamientoCourier,
    'id' | 'uuid' | 'nombre_almacen' | 'ciudad' | 'departamento' | 'direccion'
  >;

  almacen_destino?: Pick<
    AlmacenamientoCourier,
    'id' | 'uuid' | 'nombre_almacen' | 'ciudad' | 'departamento' | 'direccion'
  >;

  productos: MovimientoProductoItem[];
}
