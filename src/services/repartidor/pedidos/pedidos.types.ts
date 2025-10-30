export type RepartidorVista = 'hoy' | 'pendientes' | 'terminados';

export interface ListPedidosHoyQuery {
  page?: number;
  perPage?: number;
}

export interface ListByEstadoQuery {
  page?: number;
  perPage?: number;
  desde?: string | Date;
  hasta?: string | Date;
  sortBy?: 'programada' | 'real' | 'creacion' | 'actualizada';
  order?: 'asc' | 'desc';
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

/* =========================
 * PEDIDOS LISTADO + DETALLE
 * ========================= */
export interface PedidoItemResumen {
  producto_id?: number;
  nombre: string;
  descripcion?: string | null;
  cantidad: number;
  precio_unitario?: string;
  subtotal?: string;
}

export interface PedidoListItem {
  id: number;
  codigo_pedido: string;
  estado_id: number;
  estado_nombre: string;

  fecha_entrega_programada: string | null;
  fecha_entrega_real: string | null;

  direccion_envio: string | null;

  ecommerce:
    | {
        id: number | null;
        nombre_comercial: string | null;
      }
    | null;

  motorizado?: { id: number; nombres?: string; apellidos?: string } | null;

  cliente: {
    nombre: string;
    celular: string;
    distrito: string;
    direccion?: string | null;
    referencia?: string | null;
  };

  monto_recaudar: string;

  metodo_pago?:
    | {
        id: number;
        nombre: string;
        requiere_evidencia: boolean;
      }
    | null;

  pago_evidencia_url?: string | null;
  observacion_estado?: string | null;

  items?: PedidoItemResumen[];
  items_total_cantidad?: number;
  items_total_monto?: string;

  reprogramacion_ultima?:
    | {
        fecha_anterior: string;
        fecha_nueva: string;
        motivo?: string | null;
        creado_en?: string;
        creado_por_id?: number;
      }
    | null;
}

/** Versión extendida para detalle (GET /:id) */
export type PedidoDetalle = PedidoListItem;

/* =========================
 * Tipos para CAMBIO DE ESTADO
 * ========================= */

// 1) Estado inicial (desde "Pendiente")
export type EstadoInicialResultado =
  | 'RECEPCION_HOY'
  | 'NO_RESPONDE'
  | 'REPROGRAMADO'
  | 'ANULO';

export interface UpdateEstadoInicialBody {
  resultado: EstadoInicialResultado;
  fecha_nueva?: string | Date;
  observacion?: string;
}

export interface UpdateEstadoInicialResponse {
  pedido_id: number;
  estado_id: number;
  estado_nombre: string;
  fecha_entrega_programada: string | null;
}

// 2) Resultado / Cierre de entrega
export type ResultadoEntrega = 'ENTREGADO' | 'RECHAZADO';

export interface UpdateResultadoBody {
  resultado: ResultadoEntrega;
  monto_recaudado?: number | string;
  observacion?: string;
  evidenciaFile?: File | Blob; // se envía en campo 'evidencia' del FormData
  fecha_entrega_real?: string | Date; // opcional: si no se envía, el backend usa "now()"
  // Solo para lógica de UI; el backend no lo consume
  metodo?: 'EFECTIVO' | 'BILLETERA' | 'DIRECTO_ECOMMERCE';
}

export interface UpdateResultadoResponse {
  pedido_id: number;
  estado_id: number;
  estado_nombre: string;
  fecha_entrega_real?: string | null;
  pago_evidencia_url?: string | null;
}
