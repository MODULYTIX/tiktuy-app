// src/services/courier/cuadre_saldo/cuadreSaldo.types.ts

/* ========= Query ========= */
export type ListPedidosParams = {
  motorizadoId?: number;
  desde?: string;      // YYYY-MM-DD
  hasta?: string;      // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

/* ========= Row ========= */
export type PedidoListItem = {
  id: number;
  fechaEntrega: string | Date | null;
  cliente: string;
  metodoPago: string | null;
  monto: number;
 distrito: string;

  // Servicio para REPARTIDOR
  servicioRepartidor: number | null;  // editable
  servicioSugerido: number | null;    // de ZonaTarifario
  servicioEfectivo: number;           // COALESCE(editable, sugerido, 0)
  motivo?: string | null;

  // Servicio para COURIER (nuevo)
  servicioCourier?: number | null;          // editable (puede no venir si BE no lo expone)
  servicioCourierEfectivo?: number;         // COALESCE(servicio_courier, tarifa, 0)

  abonado: boolean;
  motorizadoId: number | null;
};

/* ========= Responses ========= */
export type ListPedidosResp = {
  page: number;
  pageSize: number;
  total: number;
  items: PedidoListItem[];
};

export type UpdateServicioPayload = {
  servicio: number;
  motivo?: string;
};

export type UpdateServicioCourierPayload = {
  servicio: number;
};

export type AbonarPayload = {
  pedidoIds: number[];
  abonado: boolean;
};

/* ========= Motorizados (para llenar el select) ========= */
export type MotorizadoItem = {
  id: number;
  nombre: string;
};
export type ListMotorizadosResp = MotorizadoItem[]; // <- lo mantenemos como array

