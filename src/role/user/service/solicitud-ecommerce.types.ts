// Tipos para solicitudes de Ecommerce

/** Payload público para registrar una solicitud de ecommerce */
export interface SolicitudEcommerceInput {
  // Datos personales (OBLIGATORIOS a nivel de negocio)
  nombres: string;
  /** Si lo manejas en un solo campo: va a Usuario.apellidos */
  apellido?: string;
  dni_ci: string;
  correo: string;
  telefono?: string;

  // Datos de la empresa (OPCIONALES en el formulario)
  /** Si se envía junto con ruc, se crea el registro Ecommerce */
  nombre_comercial?: string;
  /** Si se envía junto con nombre_comercial, se crea el registro Ecommerce */
  ruc?: string;
  /** Se valida formato solo si se envía */
  ciudad?: string;
  /** Se valida formato solo si se envía */
  direccion?: string;
  /** Se valida formato solo si se envía */
  rubro?: string;
}

/** Fila devuelta en el listado admin de solicitudes ecommerce */
export interface SolicitudEcommerce {
  uuid: string;
  ciudad: string;
  direccion: string;
  rubro: string;
  /** Alias del nombre comercial en el mapper del service */
  ecommerce: string;
  telefono: string | null;
  /** 'Asociado' | 'No asociado' según tenga o no contraseña real */
  estado: 'Asociado' | 'No asociado';
  tiene_password?: boolean;
}

/** Respuesta al crear solicitud pública */
export interface SolicitudEcommerceResponse {
  ok: boolean;
  message: string;
  /**
   * UUID del Ecommerce creado. Será:
   * - string cuando se creó el registro de empresa (se enviaron nombre_comercial y ruc válidos)
   * - null o undefined cuando solo se creó el Usuario (empresa no enviada)
   */
  ecommerce_uuid?: string | null;
}

/** Respuesta al asociar / desasociar una solicitud ecommerce */
export interface CambioEstadoResponseEcommerce {
  ok: boolean;
  accion: 'asociar' | 'desasociar';
  /** Si al asociar no tenía contraseña real, devuelve el link para crearla */
  passwordSetupUrl?: string | null;
}
