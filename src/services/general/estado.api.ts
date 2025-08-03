import type { Estado } from './estado.types';

export async function fetchEstados(token: string): Promise<Estado[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/estado`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener estados');
  return res.json();
}
