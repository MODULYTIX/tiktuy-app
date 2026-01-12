// src/services/courier/cuadre_saldo/cuadreSaldo.types.ts

/* ========= Query ========= */
export type ListPedidosParams = {
  motorizadoId?: number;
  sedeId?: number;     // ✅ NUEVO (si filtras por sede en courier)
  desde?: string;      // YYYY-MM-DD
  hasta?: string;      // YYYY-MM-DD
  page?: number;
  pageSize?: number;
};

/* ========= Row (tabla principal) ========= */
export type PedidoListItem = {
  id: number;
  fechaEntrega: string | Date | null;

  ecommerce?: string;

  cliente: string;
  distrito: string | null;

  metodoPago: string | null;
  monto: number;

  servicioRepartidor: number | null;
  servicioSugerido: number | null;
  servicioEfectivo: number;

  // ✅ motivo del ajuste de servicio (no es rechazo)
  motivo?: string | null;

  // ✅ NUEVO: observación/nota del estado (ej: motivo de rechazo)
  observacionEstado?: string | null;

  // (opcional) alias para UI si quieres mostrarlo como “Motivo” cuando fue rechazo
  motivoRechazo?: string | null;

  servicioCourier: number | null;
  servicioCourierEfectivo: number;

  pagoEvidenciaUrl?: string | null;

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
  sedeId?: number; // ✅ NUEVO (si tu back lo acepta en /abonar)
};

/* ========= Motorizados (para llenar el select) ========= */
export type MotorizadoItem = {
  id: number;
  nombre: string;
};

/**
 * ✅ Recomendado:
 * La función listMotorizados() del api devuelve un ARRAY para que puedas hacer motorizados.map(...)
 */
export type ListMotorizadosResp = MotorizadoItem[];

/* ========= Sedes (si usas /sedes en el courier) ========= */
export type SedeCuadreItem = {
  id: number;
  nombre_almacen: string;
  ciudad: string;
  es_principal: boolean;
};

export type ListSedesCuadreResp = {
  sedeActualId: number;
  canFilterBySede: boolean;
  sedes: SedeCuadreItem[];
};

/* ========= ✅ NUEVO: Detalle servicios por día (nuevo endpoint) =========
   GET /courier/cuadre-saldo/detalle-servicios-dia?fecha=YYYY-MM-DD&sedeId?&motorizadoId?
*/
export type DetalleServiciosDiaParams = {
  fecha: string;       // YYYY-MM-DD
  sedeId?: number;
  motorizadoId?: number;
};

export type DetalleServicioPedidoItem = {
  id: number;
  fechaEntrega: string | Date | null;

  ecommerce?: string;
  cliente: string;
  distrito: string | null;

  metodoPago: string | null;
  monto: number;

  servicioSugerido: number | null;
  servicioRepartidor: number | null;
  servicioEfectivo: number;

  // ✅ motivo del ajuste de servicio (no rechazo)
  motivo?: string | null;

  // ✅ NUEVO: observación del estado (motivo del rechazo)
  observacionEstado?: string | null;

  // (opcional) alias UI
  motivoRechazo?: string | null;

  servicioCourier: number | null;
  servicioCourierEfectivo: number;

  pagoEvidenciaUrl: string | null;
};


export type DetalleServiciosDiaResp = {
  fecha: string; // YYYY-MM-DD
  sedeId?: number;
  motorizadoId?: number;

  totals: {
    servicioRepartidor: number;
    servicioCourier: number;
    servicioTotal: number;
  };

  items: DetalleServicioPedidoItem[];
};
