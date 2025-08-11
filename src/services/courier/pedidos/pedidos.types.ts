// src/services/courier/pedidos/pedidos.types.ts

export interface ListPedidosHoyQuery {
  page?: number;
  perPage?: number;
}

export interface ListByEstadoQuery {
  page?: number;
  perPage?: number;
  // filtros opcionales (si los usas más adelante)
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
  producto_id: number;
  nombre: string;
  cantidad: number;
}

export interface PedidoListItem {
  id: number;
  codigo_pedido: string;
  estado_id: number;
  estado_nombre: string;

  fecha_entrega_programada: string | null;
  fecha_entrega_real: string | null;

  // 👇 ESTE ES EL CAMPO QUE FALTA EN TU TYPE
  direccion_envio: string | null; // si prefieres estricto, cámbialo a: string

  ecommerce: { id: number; nombre_comercial: string };
  motorizado?: { id: number; nombres?: string; apellidos?: string } | null;

  cliente: { nombre: string; celular: string; distrito: string };
  monto_recaudar: string;

  metodo_pago?: { id: number; nombre: string; requiere_evidencia: boolean } | null;
  pago_evidencia_url?: string | null;
  observacion_estado?: string | null;

  // usados por la tabla
  items?: PedidoItemResumen[];
  items_total_cantidad?: number;

  // para vista Reprogramados
  reprogramacion_ultima?: {
    fecha_anterior: string;
    fecha_nueva: string;
    motivo?: string | null;
  } | null;
}

/* Asignación/Reasignación (si las usas en el front) */
export interface AssignPedidosPayload {
  motorizado_id: number;
  pedidos: number[];
}
export interface AssignPedidosResponse {
  updatedCount: number;
  updatedIds: number[];
  skipped: Array<{ id: number; reason: string }>;
}

export interface ReassignPedidoPayload {
  pedido_id: number;
  motorizado_id: number;
  observacion?: string;
}
export interface ReassignPedidoResponse {
  pedido_id: number;
  motorizado_anterior_id: number;
  motorizado_nuevo_id: number;
}
