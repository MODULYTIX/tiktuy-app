// src/services/courier/zona_tarifaria/zona_tarifaria.types.ts

/** ----------- Tipos genéricos de API ----------- **/
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}
export interface ApiError {
  ok: false;
  error: string;
  status?: number;
}
export type ApiResult<T> = ApiSuccess<T> | ApiError;

/** ----------- Utilidades ----------- **/
/**
 * Prisma Decimal suele llegar como string en JSON (dependiendo de la config).
 * Para el front, permitimos number | string y luego casteamos donde toque.
 */
export type DecimalJSON = number | string;

/** ----------- Entidades / DTOs ----------- **/

export interface EstadoMin {
  id: number;
  nombre: string;
  tipo?: string | null;
}

/**
 * Versión mínima de la sede que puede venir incluida en algunas respuestas
 * (por ejemplo en GET /zona-tarifaria/mias donde se hace include: { sede: true }).
 *
 * Si el backend devuelve más campos, no pasa nada: este es el subconjunto
 * que el front necesita.
 */
export interface SedeMin {
  id: number;
  nombre_almacen: string;
  ciudad: string;
  departamento?: string | null;
  provincia?: string | null;
}

/**
 * Entidad principal que devuelve el backend en la mayoría de endpoints privados:
 *   - GET /zona-tarifaria/sede/:sede_id
 *   - GET /zona-tarifaria/mias
 *   - GET /zona-tarifaria/mias/sede/:sede_id
 *   - GET /zona-tarifaria/courier/:courier_id (compat)
 */
export interface ZonaTarifaria {
  id: number;
  uuid?: string;
  courier_id: number;

  // En el schema es Int? (puede venir null si hay registros antiguos sin sede)
  sede_id?: number | null;

  distrito: string; // <- nombre del campo en BD/JSON (en UI lo muestras como "Ciudad")
  zona_tarifario: string;
  tarifa_cliente: DecimalJSON;
  pago_motorizado: DecimalJSON;
  estado_id: number;
  fecha_registro?: string;

  estado?: EstadoMin | null;

  /**
   * Puede venir en respuestas donde el backend hace `include: { sede: true }`,
   * por ejemplo en GET /zona-tarifaria/mias o /zona-tarifaria/courier/:id.
   */
  sede?: SedeMin | null;
}

/**
 * Payload para crear zona (ruta "admin"):
 *   POST /zona-tarifaria
 * El backend espera sede_id explícito.
 *
 * ⚠️ IMPORTANTE:
 * - El backend espera `ciudad` en el body, no `distrito`.
 * - Este endpoint está pensado para uso interno/admin.
 */
export interface CrearZonaTarifariaPayload {
  sede_id: number;
  ciudad: string;          // <--- se mapea a "distrito" en el backend
  zona_tarifario: string;
  tarifa_cliente: number;
  pago_motorizado: number;
  estado_id?: number;      // opcional (backend hace fallback a "Activo/zona")
}

/**
 * Payload para crear zona para el usuario autenticado:
 *   POST /zona-tarifaria/mias
 *
 * ✅ IMPORTANTE:
 *  - El FRONT **NO envía `sede_id`**.
 *  - El backend resuelve (courier_id, sede_id) en base al usuario:
 *      - Si es dueño del courier -> sede principal o primera.
 *      - Si es representante de sede -> esa sede.
 *      - Si es trabajador del courier -> sede principal del courier.
 *  - Usa `ciudad` en lugar de `distrito`.
 */
export type CrearZonaTarifariaParaMiUsuarioPayload = {
  ciudad: string;
  zona_tarifario: string;
  tarifa_cliente: number;
  pago_motorizado: number;
  estado_id?: number;
};

/**
 * Payload para actualizar una zona:
 *   - PUT /zona-tarifaria/:id            (admin / interno)
 *   - PUT /zona-tarifaria/mias/:id       (validando que la zona sea del courier del usuario)
 *
 * El backend permite campos opcionales; no se envían ni sede_id ni courier_id.
 */
export interface ActualizarZonaTarifariaPayload {
  ciudad?: string;         // <--- el backend lo mapea a "distrito"
  zona_tarifario?: string;
  tarifa_cliente?: number;
  pago_motorizado?: number;
  estado_id?: number;
}

/** Respuesta pública: solo distrito (select: { distrito: true }) */
export interface ZonaTarifariaPublic {
  distrito: string;        // viene así desde el backend; en UI lo puedes mostrar como "Ciudad"
}

/**
 * Respuesta pública extendida cuando se usa onlyDistritos=false:
 * { distrito, zona_tarifario, tarifa_cliente, pago_motorizado }
 *
 * Endpoints:
 *   - GET /zona-tarifaria/public/sede/:sede_id?onlyDistritos=false
 *   - GET /zona-tarifaria/public/courier/:courier_id?onlyDistritos=false
 */
export interface ZonaTarifariaPublicFull {
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: DecimalJSON;
  pago_motorizado: DecimalJSON;
}
