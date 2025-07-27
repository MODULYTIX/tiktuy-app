import type { Role } from '@/auth/constants/roles';

// Tipo que se usa en el frontend
export type User = {
  id: string;
  email: string;
  role: Role;
};

//
export type RawUser = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Role;
};

// Datos que se envían al hacer login
export type LoginCredentials = {
  email: string;
  password: string;
};

// registrar
export type RegisterData = {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rol_id: number;
  estado: string;
};

// login
export type LoginResponse = {
  token: string;
  user: User;
};
