/* ========= Ecommerces del courier ========= */
export type EcommerceItem = {
  id: number;
  nombre: string;        // nombre_comercial
  ciudad?: string | null;
};

/* ========= Resumen diario ========= */
export type ResumenQuery = {
  ecommerceId: number;
  desde?: string;  // YYYY-MM-DD
  hasta?: string;  // YYYY-MM-DD
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
  servicioTotal: number;       // servicioCourier + servicioRepartidor
  abonado: boolean;
};

/* ========= Abono por FECHAS (Ecommerce) ========= */
export type AbonarEcommerceFechasPayload = {
  ecommerceId: number;
  fecha?: string;        // YYYY-MM-DD (opcional si envías una sola)
  fechas?: string[];     // lista de YYYY-MM-DD
  estado?: AbonoEstado;  // por defecto "Por Validar"
};

export type AbonarEcommerceFechasResp = {
  ecommerceId?: number;
  fechas: string[];                      // normalizadas a YYYY-MM-DD
  estado: AbonoEstado;
  updated: number;                       // pedidos afectados
  totalServicio?: number;                // si el BE lo envía
  // opcional si luego lo usas
  totalCobradoSeleccionado?: number;
  totalServicioCourierSeleccionado?: number;
};
