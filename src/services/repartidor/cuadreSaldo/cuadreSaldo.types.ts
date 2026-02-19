/* =====================
   Tipos: Cuadre de Saldo
   ===================== */

export type YMD = string; // 'YYYY-MM-DD'

/** Query para la lista (resumen por fecha) */
export type CuadreResumenQuery = {
  desde?: YMD | Date;
  hasta?: YMD | Date;
  page?: number;
  pageSize?: number;
};

/** Ítem del resumen diario */
export type CuadreResumenItem = {
  fecha: string; // ISO string del día (del backend), puedes formatear en UI
  totalPedidos: number;
  totalServicioMotorizado: number;
  validado: boolean;
  validadoEn: string | null; // ISO o null
  abonado: boolean;
};

/** Respuesta del resumen (paginada por días) */
export type CuadreResumenResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: CuadreResumenItem[];
};

/** Ítem del detalle por pedido */
export type CuadreDetallePedido = {
  id: number;
  codigo: string;
  fechaEntrega: string | null; // ISO o null
  cliente: string;
  metodoPago: string | null;
  monto: number; // monto_recaudar
  servicioCourier: number | null; // pago_motorizado
  distrito: string;
  tarifaFaltante: boolean;
};

/** Respuesta del detalle del día */
export type CuadreDetalleResponse = {
  fecha: YMD;
  totalRecaudado: number;
  totalServicioMotorizado: number;
  pedidos: CuadreDetallePedido[];
};

/** Body para validar / desvalidar un día */
export type UpdateValidacionBody = {
  validado: boolean;
};

/** (Opcional) Estructura mínima que devuelve el backend al validar */
export type LiquidacionDiariaMotorizado = {
  id: number;
  motorizado_id: number;
  courier_id: number;
  fecha: string; // ISO
  total_pedidos: number;
  total_servicio: number;
  total_recaudado: number | null;
  validado: boolean;
  validado_por_id: number | null;
  validado_en: string | null; // ISO o null
};

/** Respuesta del endpoint de validación */
export type UpdateValidacionResponse = {
  ok: boolean; // lo devuelve el backend
  data: LiquidacionDiariaMotorizado;
};
