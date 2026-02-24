export interface AdminReportesFiltros {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  courierId?: number;
  vista?: 'diario' | 'mensual' | 'anual';
  precio?: number;
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

// ==========================================
// Dashboard Graficos
// ==========================================
export interface DashboardGraficosResponse {
  filtros: any;
  kpis: {
    totalPedidos: number;
    entregados: number;
    noResponde: number;
    noHizo: number;
    anulados: number;
    gananciaTotal: string;
  };
  graficos: {
    evolucion: {
      label: string;
      cantidad: number;
      entregados: number;
      ganancia: number;
    }[];
    distribucion: {
      name: string;
      value: number;
    }[];
    ranking: {
      courier: string;
      entregados: number;
      ganancia: number;
    }[];
  }
}