// 🔐 PRIVADO (requiere token) – usado por el Courier autenticado
export async function fetchZonasByCourierPrivado(courier_id: number, token: string) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/zona-tarifaria/courier/${courier_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error('Error al obtener zonas tarifarias privadas');
  return res.json();
}

// 🌐 PÚBLICO (sin token) – usado por el Ecommerce al crear pedido
export async function fetchZonasByCourierPublic(courier_id: number) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/zona-tarifaria/public/courier/${courier_id}`
  );
  if (!res.ok) throw new Error('Error al obtener zonas tarifarias públicas');
  return res.json();
}
