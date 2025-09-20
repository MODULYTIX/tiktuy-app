/* =========================================================
 * Tipos (Ecommerce -> Cuadre de Saldo)
 * ======================================================= */

export type AbonoEstado = 'Sin Validar' | 'Por Validar' | 'Validado';

/** Courier asociado al ecommerce autenticado */
export type CourierItem = {
  id: number;
  nombre: string;
};

/** Query para el resumen por fechas */
export type ResumenQuery = {
  courierId: number;
  /** YYYY-MM-DD (opcional) */
  desde?: string;
  /** YYYY-MM-DD (opcional) */
  hasta?: string;
  /** default: true (solo fechas en 'Por Validar') */
  soloPorValidar?: boolean;
};

/** Item del resumen por día para la tabla principal */
export type ResumenDia = {
  /** YYYY-MM-DD */
  fecha: string;
  pedidos: number;
  /** SUM(monto_recaudar) */
  cobrado: number;
  /**
   * Servicio total = COALESCE(servicio_courier, tarifa_zona, 0)
   *                + COALESCE(servicio_repartidor, 0)
   */
  servicio: number;
  /** Neto = cobrado - servicio */
  neto: number;
  estado: AbonoEstado;
};

/** Pedido que se muestra en el modal “Ver” */
export type PedidoDiaItem = {
  id: number;
  cliente: string;
  /** puede venir null */
  metodo_pago: string | null;
  monto: number;
  /** courier efectivo (tarifa de zona si servicio_courier es null) */
  servicioCourier: number;
  /** servicio del motorizado (si no hay, 0) */
  servicioRepartidor: number;
  /** agregado para la UI */
  servicioTotal: number;
  abonado: boolean;
};

/** Body para validar fechas (Por Validar -> Validado) */
export type ValidarFechasPayload = {
  courierId: number;
  /** Día único (alternativa a `fechas`) */
  fecha?: string;      // YYYY-MM-DD
  /** Lista de días */
  fechas?: string[];   // YYYY-MM-DD[]
};

export type ValidarFechasResp = {
  updated: number;
  estadoNombre: 'Validado';
  estadoId: number;
  fechas: string[]; // YYYY-MM-DD[]
  totalCobradoSeleccionado: number;
  totalServicioCourierSeleccionado: number;
};
