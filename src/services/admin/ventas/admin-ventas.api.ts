import type {
    AdminVentasFiltros,
    VentasDiariasResponse,
    CobranzaCouriersResponse,
} from "./admin-ventas.types";

const VITE_API_URL = import.meta.env.VITE_API_URL as string;

// Helper para construir query string
function buildQuery(params: AdminVentasFiltros) {
    const query = new URLSearchParams();
    if (params.desde) query.append("desde", params.desde);
    if (params.hasta) query.append("hasta", params.hasta);
    if (params.courierId) query.append("courierId", String(params.courierId));
    if (params.precio) query.append("precio", String(params.precio));
    return query.toString();
}

// ==========================================
// 1. Dashboard: Ventas por día y Totales
// Endpoint: /admin-ventas/dashboard
// ==========================================
export async function getAdminVentasDashboard(
    token: string,
    params: AdminVentasFiltros
): Promise<VentasDiariasResponse> {
    const qs = buildQuery(params);
    const res = await fetch(`${VITE_API_URL}/admin-ventas/dashboard?${qs}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener dashboard ventas");
    }

    return await res.json();
}

// ==========================================
// 2. Resumen de Cobranza por Courier
// Endpoint: /admin-ventas/courier-cobranza
// ==========================================
export async function getAdminCobranzaCouriers(
    token: string,
    params: AdminVentasFiltros
): Promise<CobranzaCouriersResponse> {
    const qs = buildQuery(params);
    const res = await fetch(`${VITE_API_URL}/admin-ventas/courier-cobranza?${qs}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener cobranza couriers");
    }

    return await res.json();
}

// ==========================================
// 3. Descargar PDF de Cobranza
// Endpoint: /admin-ventas/pdf-cobranza
// ==========================================
export async function downloadPdfCobranza(
    token: string,
    courierId: number,
    params: AdminVentasFiltros
): Promise<void> {
    const res = await fetch(`${VITE_API_URL}/admin-ventas/pdf-cobranza`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            courierId,
            desde: params.desde,
            hasta: params.hasta,
            precio: params.precio,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al descargar PDF");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cobranza_courier_${courierId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

// ==========================================
// 4. Listar todos los Couriers
// Endpoint: /admin-ventas/couriers
// ==========================================
export async function getAdminAllCouriers(token: string): Promise<any[]> {
    const res = await fetch(`${VITE_API_URL}/admin-ventas/couriers`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener lista de couriers");
    }

    return await res.json();
}
