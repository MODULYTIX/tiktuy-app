import type { Categoria } from './categoria.types';

export async function fetchCategorias(token: string): Promise<Categoria[]> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/categorias`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Error al obtener categorías');

  return res.json();
}
