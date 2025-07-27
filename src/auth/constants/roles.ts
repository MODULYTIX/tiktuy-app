
export const validRoles = ['admin', 'ecommerce', 'courier', 'motorizado'] as const;

export type Role = (typeof validRoles)[number];

// Ruta por defecto para cada rol (útil para redirección)
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
