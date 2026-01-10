// src/services/courier/pedidos/pedidos.types.ts

export interface ListPedidosHoyQuery {
  page?: number;
  perPage?: number;
  desde?: string | Date; // ✅ nuevo
  hasta?: string | Date; // ✅ nuevo
}

export interface ListByEstadoQuery {
  page?: number;
  perPage?: number;
  // filtros opcionales
  desde?: string | Date;
  hasta?: string | Date;
  // Backend usa: 'programada' | 'actualizada' | 'creacion'
  sortBy?: 'programada' | 'actualizada' | 'creacion';
  order?: 'asc' | 'desc';
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

/* ----- Items de producto del pedido ----- */
export interface PedidoProductoItem {
  producto_id: number;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  precio_unitario: string; // viene como string desde el backend
  subtotal: string;        // cantidad * precio_unitario, string formateable
}

/* ----- Resumen mínimo para listados ----- */
export interface PedidoListItem {
  id: number;
  codigo_pedido: string;

  estado_id: number;
  estado_nombre: string;

  fecha_entrega_programada: string | null;
  fecha_entrega_real: string | null;

  /** Copia plana opcional; el componente puede usar también cliente.direccion */
  direccion_envio?: string;

  ecommerce: {
    id: number;
    nombre_comercial: string;
  };

  motorizado?: {
    id: number;
    nombres?: string;
    apellidos?: string;
  } | null;

  cliente: {
    nombre: string;
    celular: string;
    distrito: string;
    direccion?: string;          // <- usado por la UI
    referencia?: string | null;  // <- opcional
  };

  monto_recaudar: string;

  metodo_pago?: {
    id: number;
    nombre: string;
    requiere_evidencia: boolean;
  } | null;

  pago_evidencia_url?: string | null;
  observacion_estado?: string | null;

  // productos (cuando el backend los incluye)
  items?: PedidoProductoItem[];
  items_total_cantidad?: number;
  items_total_monto?: string;

  // para vista Reprogramados (última reprogramación)
  reprogramacion_ultima?: {
    fecha_anterior: string;
    fecha_nueva: string;
    motivo: string | null;
    creado_en: string;
    creado_por_id: number;
  } | null;
}

/* ----- Asignación en lote ----- */
export interface AssignPedidosPayload {
  motorizado_id: number;
  pedidos: number[];
}
export interface AssignPedidosResponse {
  updatedCount: number;
  updatedIds: number[];
  skipped: Array<{ id: number; reason: string }>;
}

/* ----- Reasignación individual ----- */
export interface ReassignPedidoPayload {
  pedido_id: number;
  motorizado_id: number;
  observacion?: string;
}

export interface ReassignPedidoResultCore {
  pedido_id: number;
  motorizado_anterior_id: number;
  motorizado_nuevo_id: number;
  nuevo_pedido_id: number;
  codigo_pedido_nuevo: string;
}

/**
 * Lo que responde tu controller actualmente:
 * res.status(200).json(result)  // result = ReassignPedidoResultCore
 */
export type ReassignPedidoApiResponse = ReassignPedidoResultCore;

/* ----- Detalle de pedido (para el ojito 👁️) ----- */
export interface PedidoDetalle {
  id: number;
  codigo_pedido: string;

  cliente: string;
  direccion_entrega: string;
  fecha_entrega_programada: string | null;
  cantidad_productos: number;
  monto_total: number;

  items: Array<{
    producto_id: number;
    nombre: string;
    descripcion: string;
    marca?: string | null;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

/* ----- Reprogramar (antes de asignar) ----- */
export interface ReprogramarPedidoPayload {
  pedido_id: number;
  fecha_entrega_programada: string | Date; 
  observacion?: string;
}

export interface ReprogramarPedidoResponse {
  pedido_id: number;
  codigo_pedido: string;
  estado_id: number;
  fecha_anterior: string | null;
  fecha_nueva: string; // ISO
  motivo: string | null;
  creado_en: string;
  creado_por_id: number;
}

export interface ExportPedidosAsignadosPdfPayload {
  pedidoIds: number[];
  sedeId?: number;
}

export type ExportPedidosAsignadosPdfResponse = Blob;

