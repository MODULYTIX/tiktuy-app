/* =========================================================
 * Tipos compartidos
 * ======================================================= */

/** Vista temporal del reporte */
export type VistaReporte = 'diario' | 'mensual' | 'anual';

/* =========================================================
 * INGRESOS
 * ======================================================= */

/** Query para dashboard de ingresos */
export type IngresosReporteQuery = {
  vista: VistaReporte;
  /** YYYY-MM-DD (solo para vista diaria) */
  desde?: string;
  /** YYYY-MM-DD (solo para vista diaria) */
  hasta?: string;
};

/** Item de la tabla de ingresos */
export type IngresoTablaItem = {
  /** YYYY-MM-DD */
  fecha: string;
  ingresos: number;
  totalPedidos: number;
};

/** KPIs de ingresos */
export type IngresosKpis = {
  ingresosTotales: number;
};

/** Datos para gráfico de ingresos */
export type IngresosGrafico = {
  labels: string[];
  series: number[];
};

/** Response completa del dashboard de ingresos */
export type IngresosReporteResp = {
  filtros: {
    vista: VistaReporte;
    desde?: string;
    hasta?: string;
  };

  kpis: IngresosKpis;

  tabla: IngresoTablaItem[];

  grafico: IngresosGrafico;
};

/* =========================================================
 * ENTREGAS
 * ======================================================= */

/** Item del gráfico donut de entregas */
export type EntregaDonutItem = {
  label: string;
  value: number;
};

/** KPIs del reporte de entregas */
export type EntregasKpis = {
  /** Total de pedidos en el período */
  totalPedidos: number;

  /** Total de pedidos entregados */
  entregados?: number;

  /** % de entregas exitosas */
  tasaEntrega?: number;
};

/** Métrica por courier */
export type EntregaCourierItem = {
  courierId: number;
  courier: string;
  total: number;
  entregados: number;
};

/** Métrica por motorizado */
export type EntregaMotorizadoItem = {
  motorizadoId: number;
  motorizado: string;
  total: number;
  entregados: number;
};

/** Response completa del dashboard de entregas */
export type EntregasReporteResp = {
  filtros: {
    vista: VistaReporte;
    desde?: string;
    hasta?: string;
  };

  kpis: EntregasKpis;

  /** Donut por estado de pedidos */
  donut: EntregaDonutItem[];

  /** Breakdown por courier (ranking) */
  couriers?: EntregaCourierItem[];

  /** Breakdown por motorizado (ranking) */
  motorizados?: EntregaMotorizadoItem[];
};
