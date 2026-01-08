// --- Tipos de rol y módulos ---
export type Role = 'admin' | 'ecommerce' | 'courier' | 'motorizado' | 'trabajador';
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
  ecommerce_nombre: string;
  courier_nombre: string;
  motorizado_courier_nombre: string;
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
// --- Recuperar contraseña ---
export type RecoverPasswordRequest = {
  email: string;
};

export type RecoverPasswordConfirmRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type RecoverPasswordResponse = {
  ok: boolean;
  message?: string;
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
    const errorData = await res.json().catch(() => ({}));
    // Si el mensaje de error contiene una URL o parece un error de sistema, mostramos un mensaje genérico.
    const errorMessage = errorData.error || 'Error al iniciar sesión';
    if (errorMessage.includes('http') || errorMessage.includes('fetch') || errorMessage.length > 200) {
      throw new Error('Error de conexión con el servidor');
    }
    throw new Error(errorMessage);
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
      estado_id: userData.estado,
      DNI_CI: userData.DNI_CI,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Error al registrar usuario';
    if (errorMessage.includes('http') || errorMessage.includes('fetch') || errorMessage.length > 200) {
      throw new Error('Error al conectar con el servidor');
    }
    throw new Error(errorMessage);
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

// --- Solicitar recuperación de contraseña ---
export async function recoverPasswordRequest(
  data: RecoverPasswordRequest
): Promise<RecoverPasswordResponse> {
  const res = await fetch(`${API_URL}/auth/recuperar-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: data.email,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Error al solicitar recuperación';
    if (errorMessage.includes('http') || errorMessage.includes('fetch')) {
      throw new Error('Error de conexión con el servidor');
    }
    throw new Error(errorMessage);
  }

  return await res.json();
}

// --- Confirmar recuperación de contraseña ---
export async function confirmRecoverPasswordRequest(
  data: RecoverPasswordConfirmRequest
): Promise<RecoverPasswordResponse> {
  const res = await fetch(`${API_URL}/auth/recuperar-contrasena/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: data.token,
      contrasena: data.password,
      confirmar_contrasena: data.confirmPassword,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Error al confirmar recuperación';
    if (errorMessage.includes('http') || errorMessage.includes('fetch')) {
      throw new Error('Error de conexión con el servidor');
    }
    throw new Error(errorMessage);
  }

  return await res.json();
}
