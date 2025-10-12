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
  courier: string; // nombre comercial
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
