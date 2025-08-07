import type { Role, ModuloAsignado } from '@/auth/constants/roles';

export type Rol = {
  id: number;
  nombre: Role;
};

export type Perfil = {
  nombre?: string;
  tipo?: string;
  modulo_asignado?: ModuloAsignado;
};

export type PerfilTrabajador = {
  id: number;
  codigo_trabajador?: string;
  fecha_creacion?: Date;
  modulo_asignado: ModuloAsignado;
  rol_perfil_id: number;
  perfil?: Perfil;
};

export interface User {
  uuid: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  perfil_trabajador?: {
    id: number;
    usuario_id: number;
    ecommerce_id: number | null;
    courier_id: number | null;
    rol_perfil_id: number;
    estado_id: number;
    codigo_trabajador: string | null;
    modulo_asignado: string;
    fecha_creacion: string;
    perfil: {
      id: number;
      uuid: string;
      nombre: string;
      descripcion: string | null;
      tipo: string;
      estado_id: number;
      created_at: string;
      updated_at: string;
    };
  };
}


// Login
export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

// Registro general
export type RegisterData = {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rol_id: number;
  estado: string;
  DNI_CI: string;
};

// Registro de trabajador (para perfiles internos)
export type RegisterTrabajadorData = {
  nombres: string;
  apellidos: string;
  correo: string;       
  contrasena: string;     
  estado: string;
  DNI_CI: string;
  rol_perfil_id: number;
  modulo: ModuloAsignado;
  codigo_trabajador?: string;
};
