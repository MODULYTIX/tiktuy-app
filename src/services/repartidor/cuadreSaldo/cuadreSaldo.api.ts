import type {
  CuadreResumenQuery,
  CuadreResumenResponse,
  CuadreDetalleResponse,
  UpdateValidacionBody,
  UpdateValidacionResponse,
} from './cuadreSaldo.types';

const API_URL = import.meta.env.VITE_API_URL;
// Si montaste el router como `app.use('/api', routes)` y en routes usaste `router.use('/', cuadreSaldoRouter)`,
// entonces BASE_URL debería incluir ese prefijo (normalmente API_URL ya trae /api).
const BASE_URL = `${API_URL}/cuadre-saldo`;

/* --------------------------
   Helpers
---------------------------*/

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

function toYMD(val: string | Date): string {
  // El backend valida YYYY-MM-DD estrictamente
  if (typeof val === 'string') return val.slice(0, 10);
  return val.toISOString().slice(0, 10);
}

function toQueryResumen(q: CuadreResumenQuery = {}): string {
  const sp = new URLSearchParams();
  if (q.page !== undefined) sp.set('page', String(q.page));
  if (q.pageSize !== undefined) sp.set('pageSize', String(q.pageSize));
  if (q.desde !== undefined) sp.set('desde', toYMD(q.desde));
  if (q.hasta !== undefined) sp.set('hasta', toYMD(q.hasta));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function hasMessage(v: unknown): v is { message: string } {
  return typeof v === 'object' && v !== null && typeof (v as { message?: unknown }).message === 'string';
}

async function handle<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (res.status === 204) return null as unknown as T;

  if (!res.ok) {
    let message = fallbackMsg;
    try {
      const body: unknown = await res.json();
      if (hasMessage(body)) message = body.message;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/* --------------------------
   GET: Resumen por fecha (usuario logueado)
   Endpoint backend: GET /cuadre-saldo
---------------------------*/
export async function fetchCuadreResumen(
  token: string,
  query: CuadreResumenQuery = {},
  opts?: { signal?: AbortSignal }
): Promise<CuadreResumenResponse> {
  const res = await fetch(`${BASE_URL}${toQueryResumen(query)}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });

  // El backend responde { ok: true, ...data }
  const json = await handle<{ ok: boolean } & CuadreResumenResponse>(res, 'Error al obtener el resumen del cuadre');
  // Devolvemos solo la data útil (sin la bandera ok)
  const { page, pageSize, total, items } = json;
  return { page, pageSize, total, items };
}

/* --------------------------
   GET: Detalle por fecha (usuario logueado)
   Endpoint backend: GET /cuadre-saldo/:fecha
---------------------------*/
export async function fetchCuadreDetalle(
  token: string,
  fechaYMD: string, // 'YYYY-MM-DD'
  opts?: { signal?: AbortSignal }
): Promise<CuadreDetalleResponse> {
  const res = await fetch(`${BASE_URL}/${fechaYMD}`, {
    headers: authHeaders(token),
    signal: opts?.signal,
  });

  const json = await handle<{ ok: boolean } & CuadreDetalleResponse>(res, 'Error al obtener el detalle del día');
  const { fecha, totalRecaudado, totalServicioMotorizado, pedidos } = json;
  return { fecha, totalRecaudado, totalServicioMotorizado, pedidos };
}

/* --------------------------
   PUT: Validar / desvalidar un día (usuario logueado)
   Endpoint backend: PUT /cuadre-saldo/:fecha/validar
---------------------------*/
export async function putCuadreValidacion(
  token: string,
  fechaYMD: string, // 'YYYY-MM-DD'
  body: UpdateValidacionBody,
  opts?: { signal?: AbortSignal }
): Promise<UpdateValidacionResponse> {
  const res = await fetch(`${BASE_URL}/${fechaYMD}/validar`, {
    method: 'PUT',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: opts?.signal,
  });

  // Aquí mantenemos la forma original { ok, data } por si quieres mostrar más del registro
  return handle<UpdateValidacionResponse>(res, 'Error al validar el día');
}
