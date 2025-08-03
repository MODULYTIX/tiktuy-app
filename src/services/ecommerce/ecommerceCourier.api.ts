const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface EcommerceCourier {
  id: number;
  uuid: string;
  ecommerce_id: number;
  courier_id: number;
  fecha_asociacion: string;
  estado: 'Asociado' | 'No Asociado';
  ecommerce: {
    id: number;
    uuid: string;
    usuario_id: number;
    nombre_comercial: string;
    ruc: string;
    ciudad: string;
    direccion: string;
    rubro: string;
    estado: string;
    created_at: string;
    updated_at: string;
  };
  courier: {
    id: number;
    uuid: string;
    usuario_id: number;
    nombre_comercial: string;
    ruc: string;
    representante: string;
    departamento: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    estado: string;
    created_at: string;
    updated_at: string;
  };
}


export type NuevaRelacionInput = {
  courier_id: number;
};

// Obtener asociaciones ecommerce-courier
export async function fetchEcommerceCourier(token: string): Promise<EcommerceCourier[]> {
  const res = await fetch(`${API_URL}/ecommerce-courier`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al obtener relaciones ecommerce-courier');

  return await res.json();
}

// Asociar courier
export async function asociarCourier(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/ecommerce-courier/${id}/asociar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al asociar courier');
}

// Desasociar courier
export async function desasociarCourier(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/ecommerce-courier/${id}/desasociar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Error al desasociar courier');
}

// Crear nueva relación
export async function crearRelacionCourier(input: NuevaRelacionInput, token: string): Promise<EcommerceCourier> {
  const res = await fetch(`${API_URL}/ecommerce-courier`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error || 'Error al crear relación');
  }

  return await res.json();
}
