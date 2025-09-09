// src/services/courier/cuadre_saldo/cuadreSaldo.types.ts
export type ListPedidosParams = {
  motorizadoId?: number;
  desde?: string;      // YYYY-MM-DD
  hasta?: string;      // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

export type PedidoListItem = {
  id: number;
  fechaEntrega: string | Date | null;
  cliente: string;
  metodoPago: string | null;
  monto: number;

  servicioRepartidor: number | null;  // editable
  servicioSugerido: number | null;    // de ZonaTarifario
  servicioEfectivo: number;           // COALESCE(editable, sugerido, 0)
  motivo?: string | null;             // <-- AGREGA ESTO

  abonado: boolean;
  motorizadoId: number | null;
};

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

export type AbonarPayload = {
  pedidoIds: number[];
  abonado: boolean;
};
