// src/auth/utils/resolveDefaultPath.ts
import { roleDefaultPaths, validRoles, type Role } from '@/auth/constants/roles';

// Type guards simples
const isRole = (r: unknown): r is Role =>
  typeof r === 'string' && (validRoles as readonly string[]).includes(r as string);

type AnyUser = {
  rol?: { nombre?: string };
  // vínculos directos (cuando el user es dueño/representante “registrado” del recurso)
  courier?: unknown;
  ecommerce?: unknown;
  ecommerce_id?: number | null;

  // perfil de trabajador (cuando es representante asignado vía perfil)
  perfil_trabajador?: {
    courier_id?: number | null;
    ecommerce_id?: number | null;
    modulo_asignado?: string | null;
  } | null;
};

export function resolveDefaultPath(user: AnyUser): string {
  const roleName = user?.rol?.nombre?.toLowerCase?.();

  if (!isRole(roleName)) return '/';

  // Representante: decidir destino por CONTEXTO
  if (roleName === 'representante') {
    const pt = user.perfil_trabajador;

    // 1) Si tiene vínculo a courier (directo o por perfil) => representante de courier
    if (user.courier || pt?.courier_id) return '/courier';

    // 2) Si tiene vínculo a ecommerce (directo, por perfil o flag ecommerce_id) => representante de ecommerce
    if (user.ecommerce || pt?.ecommerce_id || user.ecommerce_id) return '/ecommerce';

    // 3) Fallback (si no hay contexto suficiente)
    return roleDefaultPaths.representante; // normalmente '/ecommerce' en tu config
  }

  // Otros roles van por el mapping estándar
  return roleDefaultPaths[roleName];
}
