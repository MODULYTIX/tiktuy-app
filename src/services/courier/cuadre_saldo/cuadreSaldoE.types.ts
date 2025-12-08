/* ========= Ecommerces del courier ========= */
export type EcommerceItem = {
  id: number;
  nombre: string;         // nombre_comercial (alias en el SELECT)
  ciudad?: string | null; // opcional por si en algún momento el BE la incluye
};

/* ========= Sedes para cuadre de saldo ========= */
/**
 * Respuesta del endpoint:
 * GET /courier/cuadre-saldo/ecommerce/sedes
 *
 * El backend devuelve los campos en snake_case, así que dejamos
 * los nombres tal cual para no tener que mapear en el API.
 */
export type SedeCuadreItem = {
  id: number;
  nombre_almacen: string;
  ciudad: string | null;
  es_principal: boolean;
};

export type SedesCuadreResponse = {
  sedeActualId: number;        // id de la sede donde está scoped el usuario
  canFilterBySede: boolean;    // true solo dueño / sede principal
  sedes: SedeCuadreItem[];     // lista completa de sedes del courier
};

/* ========= Resumen diario ========= */
export type ResumenQuery = {
  ecommerceId: number;
  sedeId?: number;   // sede a filtrar (opcional, solo se respeta si puede)
  desde?: string;    // YYYY-MM-DD
  hasta?: string;    // YYYY-MM-DD
};

export type AbonoEstado = 'Sin Validar' | 'Por Validar' | 'Validado';

export type ResumenDia = {
  fecha: string;          // YYYY-MM-DD (normalizado)
  pedidos: number;        // conteo de pedidos del día
  cobrado: number;        // SUM(monto_recaudar)
  servicio: number;       // SUM(servicio_courier + servicio_repartidor)
  neto: number;           // cobrado - servicio
  estado: AbonoEstado;    // estado agregado del día
};

/* ========= Pedidos del día ========= */
export type PedidoDiaItem = {
  id: number;
  cliente: string;
  metodoPago: string | null;
  monto: number;
  servicioCourier: number;     // efectivo para courier (usa tarifa si no hay)
  servicioRepartidor: number;  // efectivo para repartidor (editado si aplica)
  servicioTotal: number;       // servicioCourier + servicioRepartidor (calculado en el front)
  abonado: boolean;
};

/* ========= Abono por FECHAS (Ecommerce) ========= */
export type AbonarEcommerceFechasPayload = {
  ecommerceId: number;
  sedeId?: number;       // sede a la que aplica el abono (opcional)
  fecha?: string;        // YYYY-MM-DD (opcional si envías una sola)
  fechas?: string[];     // lista de YYYY-MM-DD
  estado?: AbonoEstado;  // por defecto "Por Validar"
};

/**
 * Shape real que devuelve el backend en abonarEcommerceFechasForUser
 */
export type AbonarEcommerceFechasResp = {
  updated: number;
  estadoNombre: string;                  // "Sin Validar" | "Por Validar" | "Validado"
  estadoId: number;
  fechas: string[];                      // normalizadas a YYYY-MM-DD
  totalCobradoSeleccionado: number;
  totalServicioCourierSeleccionado: number;
};
