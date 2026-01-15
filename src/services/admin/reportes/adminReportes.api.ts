import type {
    AdminReportesFiltros,
    ResumenCourierResponse,
    BalanceFinancieroResponse,
} from "./adminReportes.types";

const VITE_API_URL = import.meta.env.VITE_API_URL as string;

// Helper para construir query string
function buildQuery(params: AdminReportesFiltros) {
    const query = new URLSearchParams();
    if (params.desde) query.append("desde", params.desde);
    if (params.hasta) query.append("hasta", params.hasta);
    if (params.courierId) query.append("courierId", String(params.courierId));
    return query.toString();
}

// ==========================================
// 1. Obtener Resumen Operativo (KPIs)
// ==========================================
export const getAdminResumenCourier = async (
    token: string,
    params: AdminReportesFiltros
): Promise<ResumenCourierResponse> => {
    const qs = buildQuery(params);

    const res = await fetch(`${VITE_API_URL}/admin-reportes/resumen-courier?${qs}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener resumen courier");
    }

    return await res.json();
};

// ==========================================
// 2. Obtener Balance Financiero
// ==========================================
export const getAdminBalanceFinanciero = async (
    token: string,
    params: AdminReportesFiltros
): Promise<BalanceFinancieroResponse> => {
    const qs = buildQuery(params);
    const res = await fetch(`${VITE_API_URL}/admin-reportes/balance-financiero?${qs}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener balance financiero");
    }

    return await res.json();
};