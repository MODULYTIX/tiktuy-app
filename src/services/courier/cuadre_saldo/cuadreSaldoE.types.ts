/* ========= Ecommerces del courier ========= */
export type EcommerceItem = {
  id: number;
  nombre: string;         // nombre_comercial (alias en el SELECT)
  ciudad?: string | null; // opcional por si en algún momento el BE la incluye
};

/* ========= Sedes para cuadre de saldo ========= */
export type SedeCuadreItem = {
  id: number;
  nombre_almacen: string;
  ciudad: string | null;
  es_principal: boolean;
};

export type SedesCuadreResponse = {
  sedeActualId: number;
  canFilterBySede: boolean;
  sedes: SedeCuadreItem[];
};

/* ========= Resumen diario ========= */
export type ResumenQuery = {
  ecommerceId: number;
  sedeId?: number;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
};

export type AbonoEstado = "Sin Validar" | "Por Validar" | "Validado";

/**
 * ✅ IMPORTANTE:
 * En cuadre de saldo Ecommerce el "servicio" debe ser SOLO el servicio courier.
 * neto = cobrado - servicioCourier
 */
export type ResumenDia = {
  fecha: string;       // YYYY-MM-DD
  pedidos: number;     // conteo de pedidos del día
  cobrado: number;     // SUM(monto_recaudar)

  /** ✅ nuevo nombre correcto (solo courier) */
  servicioCourier: number;

  /**
   * (opcional compat) si ya tienes UI leyendo "servicio",
   * puedes mapearlo a servicioCourier en tu adapter.
   * Ideal: eliminarlo cuando migres todo.
   */
  servicio?: number;

  neto: number;        // cobrado - servicioCourier
  estado: AbonoEstado;
};

/* ========= Pedidos del día (Ecommerce) ========= */
/**
 * ✅ Para el modal del ecommerce:
 * - el cuadre usa servicioCourier como el "servicio"
 * - pero igual mostramos servicioRepartidor si quieres visualizarlo
 * - y además: motivo + evidencia del repartidor
 */
export type PedidoDiaItem = {
  id: number;
  cliente: string;
  metodoPago: string | null;
  monto: number;

  servicioCourier: number;     // efectivo para courier (usa tarifa si no hay)
  servicioRepartidor: number;  // efectivo para repartidor (editado si aplica)

  /**
   * (opcional) si lo quieres mostrar en tabla detalle como "courier + repartidor"
   * NO usarlo como "servicio del cuadre"
   */
  servicioTotal?: number;

  /** ✅ nuevo: motivo del ajuste del repartidor */
  motivo?: string | null;

  /** ✅ nuevo: evidencia registrada por el repartidor (pago_evidencia_url) */
  pagoEvidenciaUrl?: string | null;

   // ✅ NUEVO: observación que deja el repartidor (solo la mostrarás si es rechazado)
  observacionEstado?: string | null;

  // (opcional) si el endpoint también manda el nombre del estado
  estadoNombre?: string | null;

  abonado: boolean;

  // ✅ NUEVO: estado de abono ecommerce por pedido (para bloquear selección)
  abonoEcomEstado?: AbonoEstado; // "Sin Validar" | "Por Validar" | "Validado"
};

/* ========= Abono por FECHAS (Ecommerce) ========= */
export type AbonarEcommerceFechasPayload = {
  ecommerceId: number;
  sedeId?: number;
  fecha?: string;      // YYYY-MM-DD
  fechas?: string[];
  estado?: AbonoEstado;
};

/**
 * ✅ Ahora el backend debería devolver también:
 * totalAbonoSeleccionado = totalCobradoSeleccionado - totalServicioCourierSeleccionado
 */
export type AbonarEcommerceFechasResp = {
  updated: number;
  estadoNombre: AbonoEstado | string;
  estadoId: number;
  fechas: string[];
  totalCobradoSeleccionado: number;

  /** ✅ SOLO courier (NO courier + repartidor) */
  totalServicioCourierSeleccionado: number;

  /** ✅ NUEVO: lo que realmente se abona al ecommerce */
  totalAbonoSeleccionado: number;
};
