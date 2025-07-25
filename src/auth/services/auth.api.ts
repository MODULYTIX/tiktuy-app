export type Role = 'admin' | 'ecommerce' | 'courier' | 'motorizado';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  role: Role;
  token: string;
};

// 🧪 Simulación de usuarios
const fakeUsers: User[] = [
  {
    id: '1',
    email: 'admin@tiktuy.com',
    role: 'admin',
    token: 'admin-token',
  },
  {
    id: '2',
    email: 'ecom@tiktuy.com',
    role: 'ecommerce',
    token: 'ecom-token',
  },
  {
    id: '3',
    email: 'courier@tiktuy.com',
    role: 'courier',
    token: 'courier-token',
  },
  {
    id: '4',
    email: 'moto@tiktuy.com',
    role: 'motorizado',
    token: 'moto-token',
  },
];


// SIMULADO - eliminar cuando tengas tu backend real
export async function loginRequest(
  credentials: LoginCredentials
): Promise<User> {
  await new Promise((res) => setTimeout(res, 600)); // Simula latencia

  const { email, password } = credentials;
  const validPassword = '123456';

  const user = fakeUsers.find((u) => u.email === email);

  if (user && password === validPassword) {
    return user;
  }

  throw new Error('Correo o contraseña incorrectos');
}


export async function registerRequest(userData: {
  email: string;
  password: string;
}): Promise<User> {
  await new Promise((res) => setTimeout(res, 600)); // Simula latencia

  return {
    id: crypto.randomUUID(),
    email: userData.email,
    role: 'ecommerce', // por defecto, el rol de registro
    token: 'new-user-token',
  };
}

export async function fetchMe(token: string): Promise<User> {
  await new Promise((res) => setTimeout(res, 500)); // Simula latencia

  const user = fakeUsers.find((u) => u.token === token);

  if (!user) {
    throw new Error('Sesión inválida');
  }

  return user;
}

