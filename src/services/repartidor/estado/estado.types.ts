// src/services/repartidor/estado/estado.types.ts

// Representa un estado genérico que viene de la BD
export interface Estado {
  id: number;
  nombre: string;     // ej: "Disponible", "No Disponible"
  descripcion?: string;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

// Estados específicos que vamos a usar en el repartidor
export type EstadoRepartidor = 'DISPONIBLE' | 'NO_DISPONIBLE';

// Mapeo de los IDs de la tabla estado (si necesitas estos IDs en el front)
export const ESTADOS_REPARTIDOR = {
  DISPONIBLE: 18,
  NO_DISPONIBLE: 19,
} as const;

// Tipo que representa la respuesta del backend para la disponibilidad
export interface DisponibilidadResponse {
  estado_id: number;  // 18 o 19
  activo: boolean;    // true (disponible) | false (no disponible)
}
