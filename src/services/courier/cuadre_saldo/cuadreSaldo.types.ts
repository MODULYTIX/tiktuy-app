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

  // (si lo usas en la tabla)
  ecommerce?: string;

  cliente: string;
  distrito: string | null;

  metodoPago: string | null;
  monto: number;

  // Servicio para REPARTIDOR
  servicioRepartidor: number | null; // editable
  servicioSugerido: number | null;   // de ZonaTarifario
  servicioEfectivo: number;          // COALESCE(editable, sugerido, 0)
  motivo?: string | null;

  // Servicio para COURIER
  servicioCourier: number | null;          // editable
  servicioCourierEfectivo: number;         // COALESCE(servicio_courier, tarifa, 0)

  // ✅ (opcional) si tu back lo manda en este listado
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

  // monto del pedido (por si quieres mostrarlo en el detalle)
  monto: number;

  // repartidor
  servicioSugerido: number | null;
  servicioRepartidor: number | null;
  servicioEfectivo: number;
  motivo?: string | null;

  // courier
  servicioCourier: number | null;
  servicioCourierEfectivo: number;

  // ✅ evidencia por pedido (imagen/url)
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
