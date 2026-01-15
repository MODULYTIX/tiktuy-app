export interface AdminReportesFiltros {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  courierId?: number;
}
// ==========================================
// Resumen Operativo (KPIs)
// ==========================================
export interface ResumenCourierResponse {
  filtros: {
    desde: string;
    hasta: string;
    courierId?: number;
  };
  kpis: {
    totalPedidos: number;
    entregados: number;
    anulados: number;
    sinContestar: number;
    reprogramados: number;
    tasaEntrega: string; // Ejemplo: "95.5%"
  };
}
// ==========================================
// Balance Financiero
// ==========================================
export interface BalanceFinancieroResponse {
  filtros: {
    desde: string;
    hasta: string;
    courierId?: number;
  };
  balance: {
    pedidosEntregados: number;
    totalRecaudado: string; // Ejemplo: "1500.00"
    ingresosNetos: string;
  };
}