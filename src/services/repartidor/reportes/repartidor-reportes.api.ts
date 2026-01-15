import type { RepartidorHistorialParams, RepartidorHistorialResponse } from "./repartidor-reportes.types";

const VITE_API_URL = import.meta.env.VITE_API_URL as string;

export const getHistorialRepartidor = async (
    params: RepartidorHistorialParams,
    token?: string
): Promise<RepartidorHistorialResponse> => {
    // 1. Validar URL base
    const baseUrl = (VITE_API_URL || '').replace(/\/$/, '');
    const url = new URL(`${baseUrl}/repartidor-reportes/historial`);

    // 2. Query Params
    if (params.courierId) url.searchParams.append('courierId', String(params.courierId));
    if (params.motorizadoId) url.searchParams.append('motorizadoId', String(params.motorizadoId));
    if (params.desde) url.searchParams.append('desde', params.desde);
    if (params.hasta) url.searchParams.append('hasta', params.hasta);
    if (params.page) url.searchParams.append('page', String(params.page));
    if (params.limit) url.searchParams.append('limit', String(params.limit));

    // 3. Headers con Auth
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. Fetch con manejo de errores mejorado
    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            // Intentar leer el mensaje de error del backend
            const errorBody = await response.json().catch(() => ({}));
            const msg = errorBody.error || errorBody.message || `Error ${response.status}: ${response.statusText}`;
            throw new Error(msg);
        }

        const data = await response.json();
        return data as RepartidorHistorialResponse;

    } catch (error: any) {
        // Relanzar error para que el componente lo maneje
        throw new Error(error.message || 'Error de conexión al obtener historial');
    }
};