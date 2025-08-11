// src/services/repartidor/pedidos/pedidos.types.ts

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
  sortBy?: 'programada' | 'real' | 'creacion';
  order?: 'asc' | 'desc';
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PedidoItemResumen {
  producto_id?: number;
  nombre: string;
  descripcion?: string | null;
  cantidad: number;
  /** Si el backend lo envía, lo recibimos sin problemas */
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

  /** Dirección completa (para la columna de “Dirección de Entrega”) */
  direccion_envio: string | null;

  ecommerce: { id: number; nombre_comercial: string };
  motorizado?: { id: number; nombres?: string; apellidos?: string } | null;

  cliente: {
    nombre: string;
    celular: string;
    distrito: string;
    /** Algunos listados lo usan para tooltip */
    direccion?: string | null;
    referencia?: string | null;
  };

  monto_recaudar: string;

  metodo_pago?: { id: number; nombre: string; requiere_evidencia: boolean } | null;
  pago_evidencia_url?: string | null;
  observacion_estado?: string | null;

  // Para tablas/resúmenes
  items?: PedidoItemResumen[];
  items_total_cantidad?: number;
  items_total_monto?: string;

  // Solo cuando el estado es “Reprogramado”
  reprogramacion_ultima?: {
    fecha_anterior: string;
    fecha_nueva: string;
    motivo?: string | null;
    creado_en?: string;
    creado_por_id?: number;
  } | null;
}
