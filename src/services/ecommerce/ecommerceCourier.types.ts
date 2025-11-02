// src/services/ecommerce-courier/ecommerceCourier.types.ts

/** Estado general de la relación ecommerce ↔ courier */
export type EstadoAsociacion = 'Activo' | 'Inactivo' | 'Eliminado' | 'No Asociado';

/** Estado del representante de la sede en el courier */
export type RepresentanteEstado = 'Asignado' | 'Pendiente' | null;

/** Item usado cuando listamos couriers (GET /ecommerce-courier) */
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

/** Input para crear una nueva relación */
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

/** Item para la vista por SEDES (GET /ecommerce-courier/sedes) */
export interface SedeConEstado {
  sede_id: number;
  sede_uuid: string;

  // Ubicación
  departamento?: string | null;
  ciudad: string | null;
  direccion: string | null;

  // Courier propietario de la sede
  courier_id: number | null;
  courier_nombre: string | null;

  // Contacto
  telefono: string | null;

  // Estado general de la relación ecommerce ↔ courier (por sede, mapeado a general)
  estado_asociacion: EstadoAsociacion;

  // Datos que podrían no venir aún del backend
  representante_estado?: RepresentanteEstado;
  id_relacion?: number | null;
}

/** Tipo que consume el Modal de asociación */
export interface CourierAsociado {
  id: number; // courier_id
  nombre_comercial: string;
  telefono: string | null;
  ciudad: string | null;
  departamento: string | null;
  direccion: string | null;
  nombre_usuario: string;
  /** Para UI del modal */
  estado_asociacion: 'Activo' | 'No Asociado';
  id_relacion: number | null;

  /** NUEVO: permitir asociar por sede desde el modal */
  sede_id?: number;
  sede_uuid?: string;
}
