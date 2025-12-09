// pedidos.api.ts
import type { Pedido, CrearPedidoDTO, ProductoSede, ZonaTarifariaSede } from './pedidos.types';

const API_URL = import.meta.env.VITE_API_URL;

// Estados que se usan ahora en el filtro del ecommerce
// Asignado  -> recién creado (ecommerce + courier lo ven aquí)
// Pendiente -> ya tiene motorizado asignado
// Entregado -> completado
type EstadoTab = 'Asignado' | 'Pendiente' | 'Entregado';

/* ==========================================================
   OBTENER CON PAGINACIÓN
   ========================================================== */
export async function fetchPedidos(
  token: string,
  estado?: EstadoTab,
  page = 1,
  perPage = 10
): Promise<{ data: Pedido[]; pagination: any }> {
  const url = new URL(`${API_URL}/pedido`);

  url.searchParams.set('page', String(page));
  url.searchParams.set('perPage', String(perPage));
  if (estado) url.searchParams.set('estado', estado);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

// Tabs nuevas (o actualizadas)
export const fetchPedidosAsignados = (t: string, p = 1, pp = 10) =>
  fetchPedidos(t, 'Asignado', p, pp);

export const fetchPedidosPendientes = (t: string, p = 1, pp = 10) =>
  fetchPedidos(t, 'Pendiente', p, pp);

// "Completados" en la UI = estado Entregado en BD
export const fetchPedidosCompletados = (t: string, p = 1, pp = 10) =>
  fetchPedidos(t, 'Entregado', p, pp);

// Si aún tienes algo usando "Generados", puedes:
// - O bien apuntarlo a Asignado
// - O eliminarlo cuando limpies el código legacy
// export const fetchPedidosGenerados = (t: string, p = 1, pp = 10) =>
//   fetchPedidos(t, 'Asignado', p, pp);

export async function fetchPedidoById(
  id: number,
  token: string
): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Pedido no encontrado');
  return res.json();
}

/* ==========================================================
   CREAR
   ========================================================== */
// El pedido se crea SIEMPRE en estado "Asignado" en el backend
export async function crearPedido(
  data: CrearPedidoDTO, // viene del formulario (usa sede_id, NO courier_id)
  token: string
): Promise<Pedido> {
  console.log('🚀 Enviando payload a /pedido:', data);

  const res = await fetch(`${API_URL}/pedido`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error al crear pedido (backend):', error);
    throw new Error('Error al crear pedido');
  }

  return res.json();
}

/* ==========================================================
   EDITAR ESTADO: GENERADO (LEGACY)
   Si ya no usas "Generado" en ninguna parte, puedes borrar
   este bloque y la ruta /pedido/generado/:id en el backend.
   ========================================================== */
export type UpdatePedidoGeneradoPayload = {
  nombre_cliente?: string;
  numero_cliente?: string | null;
  celular_cliente?: string;
  direccion_envio?: string;
  referencia_direccion?: string | null;
  distrito?: string;
  monto_recaudar?: number;
  fecha_entrega_programada?: string | null;

  detalle?: {
    producto_id?: number;
    cantidad?: number;
    precio_unitario?: number;
  };
};

export async function actualizarPedidoGenerado(
  id: number,
  data: UpdatePedidoGeneradoPayload,
  token: string
): Promise<Pedido> {
  const res = await fetch(`${API_URL}/pedido/generado/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error backend:', error);
    throw new Error('Error al actualizar pedido (generado)');
  }
  return res.json();
}

/* ==========================================================
   EDITAR ESTADO: ASIGNADO
   (cuando el ecommerce edita datos mientras está en Asignado)
   ========================================================== */
export async function actualizarPedidoAsignado(
  id: number,
  data: Partial<Pedido>,
  token: string
): Promise<Pedido> {
  // courier_id ya NO se manda desde frontend
  if ('courier_id' in data) delete (data as any).courier_id;

  const res = await fetch(`${API_URL}/pedido/asignado/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Sin cuerpo de error' }));
    console.error('❌ Error backend:', error);
    throw new Error('Error al actualizar pedido asignado');
  }
  return res.json();
}

export async function fetchProductosPorSede(
  sedeId: number,
  token: string
): Promise<ProductoSede[]> {
  const res = await fetch(`${API_URL}/pedido/sede/${sedeId}/productos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Sin cuerpo de error" }));
    console.error("❌ Error al obtener productos de la sede:", error);
    throw new Error("Error al obtener productos de la sede");
  }

  const data = await res.json();
  return data as ProductoSede[];
}

/* ==========================================================
   OBTENER ZONAS TARIFARIAS PARA ECOMMERCE (sin validar courier)
   ========================================================== */
export async function fetchZonasTarifariasPorSede(
  sedeId: number
): Promise<ZonaTarifariaSede[]> {
  const res = await fetch(`${API_URL}/zona-tarifaria/ecommerce/sede/${sedeId}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Sin cuerpo de error" }));
    console.error("❌ Error al obtener zonas tarifarias:", error);
    throw new Error("Error al obtener zonas tarifarias");
  }

  const json = await res.json();

  // ← Esto ahora SI está tipado correctamente
  return (json.data ?? []) as ZonaTarifariaSede[];
}
