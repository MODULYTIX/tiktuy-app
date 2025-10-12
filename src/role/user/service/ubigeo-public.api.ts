// src/service/ubigeo-public.api.ts

// Estructura: { [DEPARTAMENTO]: { [PROVINCIA]: { [DISTRITO]: { ubigeo, id, inei? } } } }
type UbigeoTree = Record<
  string, // Departamento
  Record<
    string, // Provincia
    Record<
      string, // Distrito
      { ubigeo: string; id: number; inei?: string }
    >
  >
>;

const UBIGEOS_URL = 'https://free.e-api.net.pe/ubigeos.json';

// TitleCase con soporte unicode (no cambia tu UI, solo mejora visual)
function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b[\p{L}\p{M}]/gu, (c) => c.toUpperCase());
}

/** Obtiene la lista de nombres de Departamentos (Title Case) desde la API anidada. */
export async function fetchDepartamentosPublic(): Promise<string[]> {
  const res = await fetch(UBIGEOS_URL, { cache: 'force-cache' });
  if (!res.ok) throw new Error('No se pudieron cargar los departamentos');

  const data: UbigeoTree = await res.json();
  const deps = Object.keys(data || {});

  return deps
    .map((d) => toTitleCase(d.trim()))
    .sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtiene las "ciudades" (provincias) para un Departamento dado usando la API anidada.
 * Coincidencia case-insensitive entre el texto mostrado en el select y las claves del JSON.
 */
export async function fetchCiudadesPublic(departamento: string): Promise<string[]> {
  const depName = (departamento || '').trim();
  if (!depName) return [];

  const res = await fetch(UBIGEOS_URL, { cache: 'force-cache' });
  if (!res.ok) throw new Error('No se pudieron cargar las ciudades');
  const data: UbigeoTree = await res.json();

  // Buscar la clave exacta del depto en el JSON (las claves vienen en MAYÚSCULAS)
  const depKey =
    Object.keys(data || {}).find(
      (k) => k.trim().toLowerCase() === depName.toLowerCase()
    ) || null;

  if (!depKey) return [];

  const provinciasObj = data[depKey] || {};
  const provincias = Object.keys(provinciasObj);

  return provincias
    .map((p) => toTitleCase(p.trim()))
    .sort((a, b) => a.localeCompare(b, 'es'));
}

/* Si en el futuro quieres distritos según provincia:
export async function fetchDistritosPublic(departamento: string, provincia: string): Promise<string[]> {
  const dep = (departamento || '').trim().toLowerCase();
  const prov = (provincia || '').trim().toLowerCase();
  if (!dep || !prov) return [];

  const res = await fetch(UBIGEOS_URL, { cache: 'force-cache' });
  if (!res.ok) throw new Error('No se pudieron cargar los distritos');
  const data: UbigeoTree = await res.json();

  const depKey = Object.keys(data || {}).find((k) => k.toLowerCase() === dep)!;
  if (!depKey) return [];

  const provKey = Object.keys(data[depKey] || {}).find((k) => k.toLowerCase() === prov);
  if (!provKey) return [];

  return Object.keys(data[depKey][provKey] || {})
    .map((d) => toTitleCase(d.trim()))
    .sort((a, b) => a.localeCompare(b, 'es'));
}
*/
