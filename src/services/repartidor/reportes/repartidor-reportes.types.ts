export interface RepartidorHistorialParams {
    courierId?: number;
    motorizadoId?: number;
    desde?: string; // YYYY-MM-DD
    hasta?: string; // YYYY-MM-DD
    page?: number;
    limit?: number;
}

export interface HistorialItem {
    id: number;
    unique_key: string;
    codigo: string;

    tipo_registro: 'ENTREGA_O_FALLO' | 'REPROGRAMACION';
    estado: string;
    motivo: string | null;
    ecommerce?: string;
    cliente: string;
    direccion: string;
    productos: string;
    monto: string;
    ganancia: string;
    fecha_hora: string;
}

export interface RepartidorHistorialResponse {
    filtros: {
        desde: string;
        hasta: string;
        motorizadoId: number;
        courierId?: number;
    };
    motorizado: {
        id: number;
        nombre: string;
    };
    paginacion: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    items: HistorialItem[];
}
