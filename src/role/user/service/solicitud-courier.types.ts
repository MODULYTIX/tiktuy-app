// Tipos para solicitudes de courier

export interface SolicitudCourierInput {
  // Datos personales
  nombres: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo: string;
  dni_ci: string;
  telefono?: string;

  // Datos de empresa
  nombre_comercial: string;
  ruc: string;
  representante: string;
  departamento: string;
  ciudad: string;
  direccion: string;
}

export interface SolicitudCourier {
  uuid: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  dni_ci: string;
  correo: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombres: string;
  courier: string; // nombre comercial
  nombre_comercial: string;
  telefono: string | null;
  estado: string | null; // Asociado | No asociado
  tiene_password?: boolean;
}

export interface SolicitudResponse {
  ok: boolean;
  message: string;
  courier_uuid?: string;
}

export interface CambioEstadoResponse {
  ok: boolean;
  accion: 'asociar' | 'desasociar';
  passwordSetupUrl?: string | null;
}

export interface SolicitudCourierCompleto {
  uuid: string;

  // Datos de empresa
  nombre_comercial: string;
  ruc: string;
  representante: string;
  departamento: string;
  ciudad: string;
  direccion: string;

  // Datos personales del usuario
  nombres: string;
  apellidos: string;
  dni_ci: string;
  correo: string;
  telefono: string | null;

  // Estados
  estado_usuario: string | null;
  estado_courier: string | null;

  tiene_password: boolean;
}
