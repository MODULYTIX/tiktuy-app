export interface PerfilTrabajador {
  id: number;
  usuario_id: number;
  rol_perfil_id: number;
  ecommerce_id?: number | null;
  courier_id?: number | null;
  estado: string;
  codigo_trabajador: string;
  fecha_creacion: string;

  usuario: {
    nombres: string;
    apellidos: string;
    DNI_CI: string;
    correo: string;
    telefono: string;
  };

  perfil: {
    nombre_rol: string;
    modulo_asignado: string;
  };
}

export interface CrearPerfilTrabajadorInput {
  usuario_id: number;
  rol_perfil_id: number;
  estado?: string;
  codigo_trabajador?: string;
  ecommerce_id?: number | null;
  courier_id?: number | null;
  modulo?: string; 
}

export interface EditarPerfilTrabajadorInput {
  estado?: string;
  rol_perfil_id?: number;
  codigo_trabajador?: string;
}

export interface CrearTrabajadorPayload {
  nombres: string;
  apellidos: string;
  DNI_CI: string;
  correo: string;
  telefono: string;
  contraseña: string;
  rol_perfil_id: number;
  codigo_trabajador?: string;
  estado?: string;
}

