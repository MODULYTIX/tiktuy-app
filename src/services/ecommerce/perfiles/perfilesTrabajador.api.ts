import type {
  CrearPerfilTrabajadorInput,
  EditarPerfilTrabajadorInput,
  PerfilTrabajador,
} from './perfilesTrabajador.types';

const API_URL = import.meta.env.VITE_API_URL;

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchPerfilesTrabajador(): Promise<PerfilTrabajador[]> {
  const res = await fetch(`${API_URL}/trabajador`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al obtener trabajadores');
  return res.json();
}

export async function crearPerfilTrabajador(
  data: CrearPerfilTrabajadorInput
): Promise<{
  usuario: PerfilTrabajador['usuario'];
  perfilTrabajador: PerfilTrabajador;
}> {
  const res = await fetch(`${API_URL}/trabajador`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear trabajador');
  return res.json();
}

export async function editarPerfilTrabajador(
  id: number,
  data: EditarPerfilTrabajadorInput
): Promise<PerfilTrabajador> {
  const res = await fetch(`${API_URL}/trabajador/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar trabajador');
  return res.json();
}

export async function eliminarPerfilTrabajador(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/trabajador/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar trabajador');
}
