// panel_control.types.ts

/** ----------- Payloads (DTOs) ----------- **/

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
  confirmar_contrasena: string;  // Debe ser obligatorio
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

/** ----------- Respuestas genéricas ----------- **/

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

/** ----------- Entidades mínimas que devuelve el backend ----------- **/

export interface UsuarioMin {
  id: number;
  nombres: string | null;
  apellidos: string | null;
  DNI_CI: string | null;
  correo: string;
  telefono: string | null;
  contrasena?: string | null; // ← agregado
  rol_id?: number | null;
  estado_id?: number | null;
  createdAt?: string; // ← agregado
  created_at?: string; // ← agregado
}

export interface Ecommerce {
  id: number;
  usuario_id: number;
  nombre_comercial: string;
  ruc: string | null;
  ciudad: string | null;
  direccion: string | null;
  rubro: string | null;
  estado_id: number;
  createdAt?: string; // ← agregado
  created_at?: string; // ← agregado
  usuario: UsuarioMin;
}

export interface EcommerceCourier {
  id: number;
  courier_id: number;
  ecommerce_id: number;
  estado_id: number;
  createdAt?: string; // ← agregado
  created_at?: string; // ← agregado
  ecommerce: Ecommerce;
}

/** ----------- Tipos de respuestas específicas ----------- **/

export interface MensajeResponse {
  mensaje: string;
}

export interface LinkResponse {
  link: string; // e.g. https://tiktuy.app/registro-invitacion?token=abc123
}
