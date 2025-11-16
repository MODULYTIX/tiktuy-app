/** ----------- Resultado genérico de API ----------- **/

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

/** ----------- Catálogos / enums ----------- **/

// Catálogo unificado de tipos de vehículo (usa tilde en "Camión")
export const TIPOS_VEHICULO = ['Auto', 'Motocicleta', 'Camión'] as const;
export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

/** ----------- Entidades mínimas (backend) ----------- **/

export interface UsuarioMin {
  id: number;
  nombres: string | null;
  apellidos: string | null;
  DNI_CI: string | null;
  correo: string;
  telefono: string | null;
  contrasena?: string | null;
  rol_id?: number | null;
  estado_id?: number | null;
  createdAt?: string;
  created_at?: string;
}

/* --- Sede (Almacenamiento mínimo) --- */
export interface SedeMin {
  id: number;
  nombre_almacen: string;
  ciudad: string | null;
  departamento: string | null;
  direccion: string | null;
  es_principal: boolean;
}

/* --- Ecommerce --- */
export interface Ecommerce {
  id: number;
  usuario_id: number;
  nombre_comercial: string;
  ruc: string | null;
  ciudad: string | null;
  direccion: string | null;
  rubro: string | null;
  estado_id: number;
  createdAt?: string;
  created_at?: string;
  usuario: UsuarioMin;
}

/* --- EcommerceSede (relación por sede: courier + ecommerce + sede) --- */
export interface EcommerceSede {
  id: number;
  ecommerce_id: number;
  courier_id: number;
  sede_id: number;
  estado_id: number;
  fecha_asociacion?: string | null;
  ecommerce: Ecommerce;
  sede: SedeMin;
}

/* --- Motorizado --- */
export interface TipVehiculo {
  id: number;
  descripcion: TipoVehiculo; // del catálogo TIPOS_VEHICULO
}

export interface Motorizado {
  id: number;
  usuario_id: number;
  courier_id: number;
  sede_id?: number | null; // asignado a una sede concreta (o null)
  tip_vehiculo_id: number;
  licencia: string;
  placa: string;
  estado_id: number;
  createdAt?: string;
  created_at?: string;

  // relaciones opcionales (según include del backend)
  usuario?: UsuarioMin | null;
  tipo_vehiculo?: TipVehiculo | null;
  sede?: SedeMin | null; // include: { sede: true } en backend
}

/** ----------- Payloads (DTOs) — ECOMMERCE ----------- **/

export interface RegistroManualPayload {
  nombres: string;
  apellidos: string;
  dni_ci: string;
  correo: string;
  telefono: string;
  nombre_comercial: string;
  ruc: string;
  ciudad: string;
  direccion: string;
  rubro: string;
  usuario?: UsuarioMin;
}

export interface CompletarRegistroPayload {
  token: string;
  contrasena: string;
  confirmar_contrasena: string;
}

export interface RegistroInvitacionPayload {
  token: string;
  correo: string;
  contrasena: string;
  confirmar_contrasena: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  dni_ci: string;
  nombre_comercial: string;
  ruc: string;
  ciudad: string;
  direccion: string;
  rubro: string;
}

/** ----------- Payloads (DTOs) — MOTORIZADO ----------- **/

// Registro manual (hecho por el courier desde su panel, por sede)
export interface RegistroManualMotorizadoPayload {
  nombres: string;
  apellidos: string;
  dni_ci: string;
  correo: string;
  telefono: string;
  licencia: string;
  /** Debe pertenecer al catálogo TIPOS_VEHICULO */
  tipo_vehiculo: TipoVehiculo;
  placa: string;
}

// Completar registro (crear contraseña) desde correo
export interface CompletarRegistroMotorizadoPayload {
  token: string;
  contrasena: string;
  confirmar_contrasena: string;
}

// Registro completo desde invitación (form público con token)
export interface RegistroInvitacionMotorizadoPayload {
  token: string;
  correo: string;
  contrasena: string;
  confirmar_contrasena: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  dni_ci: string;
  licencia: string;
  /** Debe pertenecer al catálogo TIPOS_VEHICULO */
  tipo_vehiculo: TipoVehiculo;
  placa: string;
}

/** ----------- Tipos de respuestas específicas ----------- **/

export interface MensajeResponse {
  mensaje: string;
}

export interface LinkResponse {
  link: string; // p.ej.: https://tiktuy.app/registro-invitacion?token=abc123
}
