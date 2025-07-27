export type Role = 'admin' | 'ecommerce' | 'courier' | 'motorizado';

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
};

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  user: User;
};

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Función de login
export async function loginRequest(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: credentials.email,
      contraseña: credentials.password,
    }),
  });

  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message || 'Error al iniciar sesión');
  }

  const data = await res.json();

  return {
    token: data.token,
    user: {
      id: String(data.user.id),
      email: data.user.correo,
      role: data.user.rol,
    },
  };
}

// Función de registro
export async function registerRequest(
  userData: RegisterData
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      correo: userData.email,
      contraseña: userData.password,
      rol_id: userData.rol_id,
      estado: userData.estado,
    }),
  });

  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message || 'Error al registrar usuario');
  }

  const data = await res.json();

  return {
    token: data.token,
    user: {
      id: String(data.user.id),
      email: data.user.correo,
      role: data.user.rol,
    },
  };
}

// Función para obtener el usuario actual mediante JWT
export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Sesión inválida');
  }

  const data = await res.json();

  return {
    id: String(data.id),
    email: data.correo,
    role: data.rol,
  }; 
}

