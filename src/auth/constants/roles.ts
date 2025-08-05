// Roles funcionales del sistema
export const validRoles = ['admin', 'ecommerce', 'courier', 'motorizado', 'trabajador'] as const;
export type Role = (typeof validRoles)[number];

// Rutas por defecto solo para roles principales
export const roleDefaultPaths: Record<Role, string> = {
  admin: '/admin',
  ecommerce: '/ecommerce',
  courier: '/courier',
  motorizado: '/motorizado',
  trabajador: '/trabajador',
};

// Nombres legibles para UI
export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  ecommerce: 'Comercio',
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
