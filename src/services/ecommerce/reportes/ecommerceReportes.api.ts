import type {
  EntregasReporteResp,
  IngresosReporteQuery,
  IngresosReporteResp,
  VistaReporte,
} from './ecommerceReportes.types';

/* ================== Config / Helpers ================== */
const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}`.replace(
  /\/$/,
  ''
);

function authHeaders(token: string, contentType?: 'json') {
  if (!token) throw new Error('Token vacío: falta Authorization.');
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  if (contentType === 'json') h['Content-Type'] = 'application/json';
  return h;
}

function withQuery(
  basePath: string,
  params: Record<string, string | number | boolean | undefined | null>
) {
  const url = new URL(basePath, BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      if (j) {
        msg =
          j.message ||
          j.error ||
          j.detail ||
          (Array.isArray(j.errors) &&
            j.errors.length &&
            (j.errors[0].message || j.errors[0])) ||
          msg;
      } else if (text) {
        msg = text;
      }
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================== API Calls (Ecommerce) ================== */

/**
 * GET /ecommerce/reportes/ingresos
 * Dashboard de ingresos (tabla + gráfico + KPIs)
 */
export async function getIngresosReporte(
  token: string,
  query: IngresosReporteQuery
): Promise<IngresosReporteResp> {
  const url = withQuery('/ecommerce/reportes/ingresos', {
    vista: query.vista,
    desde: query.desde,
    hasta: query.hasta,
  });

  const raw = await request<IngresosReporteResp>(url, {
    headers: authHeaders(token),
  });

  /* 🔒 Normalización defensiva (por si backend cambia) */
  return {
    filtros: {
      vista: raw.filtros.vista,
      desde: raw.filtros.desde,
      hasta: raw.filtros.hasta,
    },

    kpis: {
      ingresosTotales: Number(raw.kpis?.ingresosTotales ?? 0),
      totalPedidos: Number(raw.kpis?.totalPedidos ?? 0),
    },

    tabla: Array.isArray(raw.tabla)
      ? raw.tabla.map((t) => ({
          fecha: t.fecha,
          ingresos: Number(t.ingresos ?? 0),
          totalPedidos: Number(t.totalPedidos ?? 0),
        }))
      : [],

    grafico: {
      labels: raw.grafico?.labels ?? [],
      series: (raw.grafico?.series ?? []).map((n) => Number(n ?? 0)),
    },
  };
}

/**
 * GET /ecommerce/reportes/entregas
 * Dashboard de entregas (donut + KPIs)
 */
export async function getEntregasReporte(
  token: string,
  query: {
    vista: VistaReporte;
    desde?: string;
    hasta?: string;
  }
): Promise<EntregasReporteResp> {
  const url = withQuery('/ecommerce/reportes/entregas', {
    vista: query.vista,
    desde: query.desde,
    hasta: query.hasta,
  });

  const raw = await request<EntregasReporteResp>(url, {
    headers: authHeaders(token),
  });

  return {
    filtros: {
      vista: raw.filtros.vista,
      desde: raw.filtros.desde,
      hasta: raw.filtros.hasta,
    },

    kpis: {
      totalPedidos: Number(raw.kpis?.totalPedidos ?? 0),
      entregados: Number(raw.kpis?.entregados ?? 0),
      tasaEntrega: Number(raw.kpis?.tasaEntrega ?? 0),
    },

    donut: Array.isArray(raw.donut)
      ? raw.donut.map((d) => ({
          label: d.label,
          value: Number(d.value ?? 0),
        }))
      : [],

    couriers: Array.isArray(raw.couriers)
      ? raw.couriers.map(c => ({
          courierId: Number(c.courierId),
          courier: c.courier,
          total: Number(c.total ?? 0),
          entregados: Number(c.entregados ?? 0),
        }))
      : [],

    motorizados: Array.isArray(raw.motorizados)
      ? raw.motorizados.map(m => ({
          motorizadoId: Number(m.motorizadoId),
          motorizado: m.motorizado,
          total: Number(m.total ?? 0),
          entregados: Number(m.entregados ?? 0),
        }))
      : [],
  };
}
