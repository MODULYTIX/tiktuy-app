import type {
    VistaReporte,
} from '@/services/ecommerce/reportes/ecommerceReportes.types';
import type { CourierEntregasReporteResp, CourierIngresosReporteResp } from './reporteCourier.types';

/* ================== Config ================== */
const API = import.meta.env.VITE_API_URL;

function authHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
}

function withQuery(
    path: string,
    params: Record<string, string | undefined>
) {
    const url = new URL(path, API);
    Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
    });
    return url.toString();
}

/* =========================================================
   API CALLS
========================================================= */

export async function getCourierEntregasReporte(
    token: string,
    query: {
        vista: VistaReporte;
        desde?: string;
        hasta?: string;
    }
): Promise<CourierEntregasReporteResp> {
    const url = withQuery('/courier/reportes/entregas', query);

    const res = await fetch(url, {
        headers: authHeaders(token),
    });

    if (!res.ok) throw new Error('Error al cargar entregas');

    return res.json();
}

export async function getCourierIngresosReporte(
    token: string,
    query: {
        vista: VistaReporte;
        desde?: string;
        hasta?: string;
    }
): Promise<CourierIngresosReporteResp> {
    const url = withQuery('/courier/reportes/ingresos', query);

    const res = await fetch(url, {
        headers: authHeaders(token),
    });

    if (!res.ok) throw new Error('Error al cargar ingresos');

    return res.json();
}
