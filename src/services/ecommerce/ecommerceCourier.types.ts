// src/services/ecommerce-courier/ecommerceCourier.types.ts

/** Estado general de la relación ecommerce ↔ courier */
export type EstadoAsociacion = 'Activo' | 'Inactivo' | 'Eliminado' | 'No Asociado';

/** Estado del representante de la sede en el courier */
export type RepresentanteEstado = 'Asignado' | 'Pendiente' | null;

/** Item usado cuando listamos couriers (endpoint GET /ecommerce-courier) */
export interface CourierConEstado {
  id: number;
  nombre_comercial: string;
  telefono: string | null;
  departamento: string | null;
  ciudad: string | null;
  direccion: string | null;
  nombre_usuario: string;
  /** Estado general de la asociación con el ecommerce */
  estado_asociacion: EstadoAsociacion;
  /** ID de la relación ecommerce_courier si existe; null si aún no fue creada */
  id_relacion: number | null;
}

/**
 * Input para crear una nueva relación.
 * Puedes enviar:
 *  - courier_id directamente, o
 *  - sede_id / sede_uuid para que el backend resuelva el courier propietario.
 */
export type NuevaRelacionInput =
  | { courier_id: number; sede_id?: never; sede_uuid?: never }
  | { sede_id: number; courier_id?: never; sede_uuid?: never }
  | { sede_uuid: string; courier_id?: never; sede_id?: never };

/** Respuesta mínima al crear la relación */
export interface CreatedRelacion {
  id: number;
  ecommerce_id: number;
  courier_id: number;
  estado_id: number;
}

/**
 * Item principal para la vista por SEDES (endpoint GET /ecommerce-courier/sedes)
 * El front normalmente mostrará solo las sedes con representante_estado === 'Asignado'.
 */
export interface SedeConEstado {
  /** Identificadores de la sede (almacenamiento) */
  sede_id: number;
  sede_uuid: string;

  /** Ubicación / datos de la sede */
  departamento?: string | null;
  ciudad: string | null;
  direccion: string | null;

  /** Courier al que pertenece la sede */
  courier_id: number | null;
  courier_nombre: string | null;

  /** Contacto del courier (usuario dueño) */
  telefono: string | null;

  /** Estado de la asociación ecommerce ↔ courier (general) */
  estado_asociacion: EstadoAsociacion;

  /**
   * Estado del representante de la sede:
   *  - 'Asignado' => sede con representante_usuario_id no nulo (se muestra)
   *  - 'Pendiente' => invitación enviada pero sin representante (no se muestra si filtras)
   *  - null => no aplica / desconocido
   */
  representante_estado: RepresentanteEstado;

  /** ID de la relación ecommerce_courier si existe; null si no */
  id_relacion: number | null;
}

/**
 * Tipo que consume el Modal de asociación (compatibilidad con UI).
 * Es un “courier con estado” simplificado para el modal.
 */
export interface CourierAsociado {
  id: number;
  nombre_comercial: string;
  telefono: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  nombre_usuario: string;
  /** 'Activo' | 'No Asociado' para UI del modal */
  estado_asociacion: 'Activo' | 'No Asociado';
  id_relacion: number | null;
}
