// Roles principales del sistema (no incluye trabajadores)
export const validRoles = ['admin', 'ecommerce', 'courier', 'motorizado'] as const;

export type Role = (typeof validRoles)[number];

// Ruta por defecto para cada rol principal (útil para redirección)
export const roleDefaultPaths: Record<Role, string> = {
  admin: '/admin',
  ecommerce: '/ecommerce',
  courier: '/courier',
  motorizado: '/motorizado',
};

// Nombres legibles para mostrar en UI si necesitas
export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  ecommerce: 'Comercio',
  courier: 'Courier',
  motorizado: 'Motorizado',
};

// Opcional: Módulos posibles que puede tener un trabajador (solo si quieres tiparlos)
export const moduloAsignadoValues = ['stock', 'producto', 'movimiento', 'pedidos'] as const;
export type ModuloAsignado = (typeof moduloAsignadoValues)[number];

// (Opcional) etiquetas legibles para módulos si los muestras en UI
export const moduloLabels: Record<ModuloAsignado, string> = {
  stock: 'Stock',
  producto: 'Producto',
  movimiento: 'Movimiento',
  pedidos: 'Gestión de Pedidos',
};
