// src/auth/constants/roles.ts

// Roles funcionales del sistema
export const validRoles = [
  'admin',
  'ecommerce',
  'representante_ecommerce',
  'representante_courier',
  'courier',
  'motorizado',
  'trabajador',
] as const;

export type Role = (typeof validRoles)[number];

// Rutas por defecto por rol
export const roleDefaultPaths: Record<Role, string> = {
  admin: '/admin',
  ecommerce: '/ecommerce',
  representante_ecommerce: '/ecommerce',
  representante_courier: '/courier',
  courier: '/courier',
  motorizado: '/motorizado',
  trabajador: '/trabajador',
};

// Nombres legibles para UI
export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  ecommerce: 'Comercio',
  representante_ecommerce: 'Representante Ecommerce',
  representante_courier: 'Representante Courier',
  courier: 'Courier',
  motorizado: 'Motorizado',
  trabajador: 'Trabajador',
};

// Módulos posibles que puede tener un trabajador (tipo de acceso por perfil)
export const moduloAsignadoValues = ['stock', 'producto', 'movimiento', 'pedidos'] as const;
export type ModuloAsignado = (typeof moduloAsignadoValues)[number];

// Etiquetas legibles para mostrar en UI
export const moduloLabels: Record<ModuloAsignado, string> = {
  stock: 'Stock',
  producto: 'Producto',
  movimiento: 'Movimiento',
  pedidos: 'Gestión de Pedidos',
};
