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

export interface ZonaTarifaria {
  id: number;
  uuid?: string;              // existe en el schema y puede venir del backend
  courier_id: number;
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: DecimalJSON;   // Prisma Decimal -> JSON string | number
  pago_motorizado: DecimalJSON;  // Prisma Decimal -> JSON string | number
  estado_id: number;

  // En tu schema existe fecha_registro, no created_at/updated_at
  fecha_registro?: string;

  // viene incluido en getByCourier (include: { estado: true })
  estado?: EstadoMin | null;
}

/** Payload para crear (service create() espera todos estos campos, con courier explícito) */
export interface CrearZonaTarifariaPayload {
  courier_id: number;
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: number;     // en payload enviamos number desde el front
  pago_motorizado: number;    // idem
  estado_id: number;
}

/** Payload para crear para el usuario autenticado (sin courier_id) */
export type CrearZonaTarifariaParaMiUsuarioPayload =
  Omit<CrearZonaTarifariaPayload, "courier_id">;

/** Payload para actualizar (backend permite campos opcionales; no incluye courier_id) */
export interface ActualizarZonaTarifariaPayload {
  distrito?: string;
  zona_tarifario?: string;
  tarifa_cliente?: number;
  pago_motorizado?: number;
  estado_id?: number;
}

/** Respuesta pública: solo distrito (select: { distrito: true }) */
export interface ZonaTarifariaPublic {
  distrito: string;
}

/**
 * Respuesta pública extendida cuando se usa onlyDistritos=false:
 * { distrito, zona_tarifario, tarifa_cliente, pago_motorizado }
 */
export interface ZonaTarifariaPublicFull {
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: DecimalJSON;
  pago_motorizado: DecimalJSON;
}
