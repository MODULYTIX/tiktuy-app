// Tipos para solicitudes de Ecommerce

/** Payload público para registrar una solicitud de ecommerce */
export interface SolicitudEcommerceInput {
    // Datos personales
    nombres: string;
    /** Si lo manejas en un solo campo: va a Usuario.apellidos */
    apellido?: string;
    dni_ci: string;
    correo: string;
    telefono?: string;
  
    // Datos de la empresa
    nombre_comercial: string;
    ruc: string;
    ciudad: string;
    direccion: string;
    rubro: string;
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
    estado: string | null;
    tiene_password?: boolean;
  }
  
  /** Respuesta al crear solicitud pública */
  export interface SolicitudEcommerceResponse {
    ok: boolean;
    message: string;
    ecommerce_uuid?: string;
  }
  
  /** Respuesta al asociar / desasociar una solicitud ecommerce */
  export interface CambioEstadoResponseEcommerce {
    ok: boolean;
    accion: 'asociar' | 'desasociar';
    /** Si al asociar no tenía contraseña real, devuelve el link para crearla */
    passwordSetupUrl?: string | null;
  }
  