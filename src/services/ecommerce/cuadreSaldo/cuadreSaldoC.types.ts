/* =========================================================
 * Tipos (Ecommerce -> Cuadre de Saldo)
 * ======================================================= */

export type AbonoEstado = "Sin Validar" | "Por Validar" | "Validado";

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
  /** default: true (solo fechas en 'Por Validar' y 'Validado' según tu backend) */
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
   * OJO: en el rol Ecommerce tu servicio "total" puede seguir siendo courier + repartidor
   * (esto es informativo). Si quieres que en ecommerce sea SOLO courier, lo cambiamos luego.
   */
  servicio: number;

  /** Neto = cobrado - servicio */
  neto: number;

  estado: AbonoEstado;

  /** voucher del abono (si existe) */
  evidencia?: string | null;
};

/** Pedido que se muestra en el modal “Ver” */
export type PedidoDiaItem = {
  id: number;
  cliente: string;

  /**
   * ✅ Alinear con backend:
   * tu service devuelve `metodoPago` (no `metodo_pago`)
   */
  metodoPago: string | null;

  monto: number;

  /** courier efectivo (tarifa de zona si servicio_courier es null) */
  servicioCourier: number;

  /** servicio del motorizado (si no hay, 0) */
  servicioRepartidor: number;

  /** agregado para la UI (si lo quieres seguir usando) */
  servicioTotal: number;

  abonado: boolean;

  /** ✅ voucher del abono (abono_evidencia_url) */
  evidencia?: string | null;

  /** ✅ evidencia registrada por el repartidor (pago_evidencia_url) */
  evidenciaRepartidor?: string | null;

  /** ✅ motivo del servicio repartidor (servicio_repartidor_motivo) */
  motivoRepartidor?: string | null;
};

/** Body para validar fechas (Por Validar -> Validado) */
export type ValidarFechasPayload = {
  courierId: number;
  /** Día único (alternativa a `fechas`) */
  fecha?: string; // YYYY-MM-DD
  /** Lista de días */
  fechas?: string[]; // YYYY-MM-DD[]
};

export type ValidarFechasResp = {
  updated: number;
  estadoNombre: "Validado";
  estadoId: number;
  fechas: string[]; // YYYY-MM-DD[]
  totalCobradoSeleccionado: number;
  totalServicioCourierSeleccionado: number;
};
