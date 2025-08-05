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

export type User = {
  uuid: string;
  nombres: string;
  apellidos: string;
  correo: string;
  DNI_CI: string;
  telefono?: string;
  estado: string;
  rol?: Rol;
  trabajador?: PerfilTrabajador;
};

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
