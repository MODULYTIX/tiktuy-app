import type { EditarTrabajadorPayload, PerfilTrabajador, RegistrarTrabajadorPayload } from './perfilesTrabajador.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Obtener todos los trabajadores
export const fetchPerfilTrabajadores = async (token: string): Promise<PerfilTrabajador[]> => {
  const res = await fetch(`${API_URL}/perfil-trabajador`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al obtener trabajadores')
  return await res.json()
}

// Registrar un nuevo trabajador
export const registerTrabajador = async (
  data: RegistrarTrabajadorPayload,
  token: string
): Promise<PerfilTrabajador> => {
  const res = await fetch(`${API_URL}/perfil-trabajador/register-trabajador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar trabajador');
  return await res.json();
};


// Editar trabajador existente
export const editarTrabajador = async (
  id: number,
  data: EditarTrabajadorPayload,
  token: string
): Promise<PerfilTrabajador> => {
  const res = await fetch(`${API_URL}/perfil-trabajador/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al editar trabajador')
  return await res.json()
}

// Eliminar (desactivar) trabajador
export const eliminarTrabajador = async (id: number, token: string): Promise<void> => {
  const res = await fetch(`${API_URL}/perfil-trabajador/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al eliminar trabajador')
}
