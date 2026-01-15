export interface AdminVentasFiltros {
    desde?: string; // YYYY-MM-DD
    hasta?: string; // YYYY-MM-DD
    courierId?: number;
    precio?: number; // Precio por pedido (default 1.00)
}

// ==========================================
// Dashboard (Ventas Diarias)
// ==========================================
export interface VentasDiariasResponse {
    filtros: {
        desde: string;
        hasta: string;
        precio: number;
        courierId?: number;
    };
    totales: {
        totalPedidos: number;
        totalCobrar: number;
    };
    detalle_diario: Array<{
        fecha: string; // YYYY-MM-DD o ISO
        cantidad_pedidos: number;
        monto_cobrar: number;
    }>;
}

// ==========================================
// Resumen Cobranza (Lista de Couriers)
// ==========================================
export interface CobranzaCourierItem {
    courier_id: number;
    courier_nombre: string;
    ruc: string;
    pedidos_entregados: number;
    monto_a_pagar: number;
}

export interface CobranzaCouriersResponse {
    filtros: {
        desde: string;
        hasta: string;
        precio: number;
    };
    data: CobranzaCourierItem[];
}
