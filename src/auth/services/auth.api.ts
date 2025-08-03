// --- Tipos de rol y módulos ---
export type Role = 'admin' | 'ecommerce' | 'courier' | 'motorizado';
export type ModuloAsignado = 'stock' | 'producto' | 'movimiento' | 'pedidos';

export type Rol = {
  id: number;
  nombre: Role;
};

export type Perfil = {
  nombre?: string;
  tipo?: string;
  modulo_asignado?: ModuloAsignado;
};

// --- Tipos de usuario ---
export type Trabajador = {
  id?: number;
  codigo_trabajador?: string;
  estado?: string;
  rol_perfil_id: number;
  modulo_asignado: ModuloAsignado;
  perfil?: Perfil;
};

export type User = {
  uuid: string;
  nombres: string;
  apellidos: string;
  correo: string;
  DNI_CI: string;
  estado: string;
  rol?: Rol;
  trabajador?: Trabajador;
};

// --- Tipos de login y registro ---
export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rol_id: number;
  estado: string;
  DNI_CI: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type RegisterTrabajadorData = {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string; // ✅ corregido
  estado: string;
  DNI_CI: string;
  rol_perfil_id: number;
  modulo: ModuloAsignado;
  codigo_trabajador?: string;
};

export type RegisterTrabajadorResponse = {
  usuario: User;
  perfilTrabajador: {
    id: number;
    estado: string;
    codigo_trabajador: string;
    modulo_asignado: ModuloAsignado;
    rol_perfil_id: number;
    perfil?: Perfil;
    usuario: User;
  };
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Login ---
export async function loginRequest(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: credentials.email,
      contrasena: credentials.password,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'Error al iniciar sesión');
  }

  return await res.json();
}

// --- Registro general ---
export async function registerRequest(
  userData: RegisterData,
  token: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      correo: userData.email,
      contrasena: userData.password,
      rol_id: userData.rol_id,
      estado_id: userData.estado, // solo si el backend espera estado_id
      DNI_CI: userData.DNI_CI,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'Error al registrar usuario');
  }

  return await res.json();
}

// --- Obtener usuario actual ---
export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Sesión inválida');
  }

  return await res.json();
}

// --- Registro de trabajador ---
export async function registerTrabajadorRequest(
  data: RegisterTrabajadorData,
  token: string
): Promise<RegisterTrabajadorResponse> {
  const res = await fetch(`${API_URL}/auth/register-trabajador`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'Error al registrar trabajador');
  }

  return await res.json();
}
