/** Estado general de la relación ecommerce ↔ courier */
export type EstadoAsociacion = 'Activo' | 'Inactivo' | 'Eliminado' | 'No Asociado';

/** Estado del representante */
export type RepresentanteEstado = 'Asignado' | 'Pendiente' | null;

/** Vista por couriers */
export interface CourierConEstado {
  id: number;
  nombre_comercial: string;
  telefono: string | null;
  departamento: string | null;
  ciudad: string | null;
  direccion: string | null;
  nombre_usuario: string;
  estado_asociacion: EstadoAsociacion;
  id_relacion: number | null;
}

/** Input para POST */
export type NuevaRelacionInput =
  | { courier_id: number; sede_id?: never; sede_uuid?: never }
  | { sede_id: number; courier_id?: never; sede_uuid?: never }
  | { sede_uuid: string; courier_id?: never; sede_id?: never };

/** Respuesta al crear relación */
export interface CreatedRelacion {
  id: number;
  ecommerce_id: number;
  courier_id: number;
  estado_id: number;
}

/** Vista clásica por sedes */
export interface SedeConEstado {
  sede_id: number;
  sede_uuid: string;

  departamento?: string | null;
  ciudad: string | null;
  direccion: string | null;

  courier_id: number | null;
  courier_nombre: string | null;

  telefono: string | null;

  estado_asociacion: EstadoAsociacion;

  representante_estado?: RepresentanteEstado;
  id_relacion?: number | null;
}

/** Para modal de asociación */
export interface CourierAsociado {
  id: number;
  nombre_comercial: string;
  telefono: string | null;
  ciudad: string | null;
  departamento: string | null;
  direccion: string | null;
  nombre_usuario: string;

  estado_asociacion: 'Activo' | 'No Asociado';
  id_relacion: number | null;

  sede_id?: number;
  sede_uuid?: string;
}

/* ============================================================
 * NUEVO — SOLO AÑADIDO PARA IMPORTACIÓN DESDE EXCEL
 * ============================================================ */

/**
 * Cuando el Excel manda "courier" ahora significa NOMBRE DE LA SEDE.
 * Este tipo representa la búsqueda básica.
 */
export interface SedeLookupFromExcel {
  nombre_sede_excel: string; // lo que viene en la columna (trim)
}

/**
 * Cuando resolvemos la sede real que pertenece al ecommerce:
 * - Obtenemos courier automático
 * - Obtenemos ciudad/distrito automático
 * - Esto termina usándose para PedidoCreateDTO
 */
export interface SedeResolvedForImport {
  sede_id: number;
  sede_uuid: string;

  nombre_sede: string;        // nombre_almacen real
  ciudad: string | null;      // reemplaza distrito del Excel
  direccion: string | null;

  courier_id: number | null
  courier_nombre: string | null;

  telefono: string | null;
}

/* ============================================================
 * Vista correcta para CrearPedidoModal — SE MANTIENE
 * ============================================================ */
export interface SedeEcommerceAsociada {
  sede_id: number;
  sede_uuid: string;

  nombre: string; // nombre_almacen
  ciudad: string | null;
  direccion: string | null;

  courier_id: number | null;
  courier_nombre: string | null;

  telefono: string | null;

  estado_asociacion: 'Activo';
}

export interface SedeLookupFromExcel {
  nombre_sede_excel: string; // lo que viene en la columna (trim)
}

/**
 * Cuando resolvemos la sede real que pertenece al ecommerce:
 * - Obtenemos courier automático si lo tiene
 * - Si NO tiene courier → courier_id será null y el pedido quedará en Estado Generado
 * - ciudad reemplaza el distrito del Excel
 */
export interface SedeResolvedForImport {
  sede_id: number;
  sede_uuid: string;

  nombre_sede: string;        // nombre_almacen real
  ciudad: string | null;      // reemplaza distrito del Excel
  direccion: string | null;

  // AHORA puede ser null si la sede NO tiene courier
  courier_id: number | null;
  courier_nombre: string | null;

  telefono: string | null;
}