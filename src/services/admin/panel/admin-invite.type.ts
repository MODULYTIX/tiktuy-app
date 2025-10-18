// Tipos compartidos para Solicitudes Courier (frontend)

export type RegistrarCourierInput = {
    nombres: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    correo: string;
    dni_ci: string;
    telefono?: string;
    nombre_comercial: string;
    ruc: string;
    representante: string;
    departamento: string;
    ciudad: string;
    direccion: string;
  };
  
  export type OkResponse = {
    ok: boolean;
    message?: string;
  };
  
  export type RegistrarCourierResponse = OkResponse & {
    courier_uuid?: string;
  };
  
  export type CourierAdminItem = {
    uuid: string;
    departamento: string;
    ciudad: string;
    direccion: string;
    courier: string;
    telefono: string | null;
    estado: 'Asociado' | 'No asociado';
    tiene_password: boolean;
  };
  
  export type ListarCouriersResponse = CourierAdminItem[];
  
  export type ConfirmarPasswordPayload = {
    token: string;
    contrasena: string;
    confirmar_contrasena: string;
  };
  
  export type ConfirmarPasswordResponse = OkResponse & {
    usuario_id?: number;
  };
  
  export type AccionAsociar = 'asociar' | 'desasociar';
  
  export type CambiarEstadoPayload = {
    accion: AccionAsociar;
  };
  
  export type CambiarEstadoResponse = OkResponse & {
    accion: AccionAsociar;
    passwordSetupUrl?: string | null;
  };
  