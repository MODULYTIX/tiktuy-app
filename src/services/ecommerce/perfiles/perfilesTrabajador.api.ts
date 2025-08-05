import type {
  ActualizarPerfilTrabajadorDTO,
  CrearPerfilTrabajadorDTO,
  PerfilDisponible,
  PerfilTrabajadorResponse,
} from './perfilesTrabajador.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Crear perfil trabajador (POST /perfil-trabajador) ---
export async function crearPerfilTrabajador(
  token: string,
  data: CrearPerfilTrabajadorDTO
): Promise<PerfilTrabajadorResponse> {
  const res = await fetch(`${API_URL}/perfil-trabajador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || 'Error al crear perfil trabajador');
  }

  return await res.json();
}

// --- Obtener todos los trabajadores registrados (GET /perfil-trabajador/all) ---
export async function fetchPerfilesRegistrados(
  token: string
): Promise<PerfilTrabajadorResponse[]> {
  const res = await fetch(`${API_URL}/perfil-trabajador/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error al obtener los perfiles registrados');
  }

  return await res.json();
}

// --- Obtener perfiles disponibles (GET /perfil-trabajador) ---
export async function fetchPerfilesDisponibles(
  token: string
): Promise<PerfilDisponible[]> {
  const res = await fetch(`${API_URL}/perfil-trabajador`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error al obtener los perfiles disponibles');
  }

  return await res.json();
}

// --- Actualizar perfil trabajador (PUT /perfil-trabajador/:id) ---
export async function actualizarPerfilTrabajador(
  token: string,
  id: number,
  data: ActualizarPerfilTrabajadorDTO
): Promise<PerfilTrabajadorResponse> {
  const res = await fetch(`${API_URL}/perfil-trabajador/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || 'Error al actualizar perfil trabajador');
  }

  return await res.json();
}

// --- Eliminar perfil trabajador (DELETE /perfil-trabajador/:id) ---
export async function eliminarPerfilTrabajador(
  token: string,
  id: number
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/perfil-trabajador/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Error al eliminar perfil trabajador');
  }

  return await res.json();
}

// --- Registrar trabajador completo (usuario + perfil) ---
export async function registrarTrabajador(
  token: string,
  data: CrearPerfilTrabajadorDTO
): Promise<PerfilTrabajadorResponse> {
  const res = await fetch(`${API_URL}/perfil-trabajador/register-trabajador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || 'Error al registrar trabajador');
  }

  return await res.json();
}
