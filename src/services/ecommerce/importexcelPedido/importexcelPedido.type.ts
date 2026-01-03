// ESTADOS
export type ImportEstado = 'ok' | 'parcial' | 'error';

/** Item del preview: viene directo desde el Excel mapeado por el backend */
export interface PreviewItemDTO {
  producto: string;
  cantidad: number | null;
  producto_id?: number;
  precio_unitario?: number;
  stock?: number;
}

/** Grupo del preview: representa un pedido con cabecera + items */
export interface PreviewGroupDTO {
  grupo: number;
  courier: string;         // nombre del courier tal cual viene del Excel
  nombre: string;
  telefono: string;
  distrito: string;
  direccion: string;
  referencia?: string | null;
  monto_total: number;     // total a recaudar
  fecha_entrega: string;   // ISO string (ej. "2025-08-14T15:00:00.000Z")
  monto_editado?: boolean;
  valido: boolean;
  items: PreviewItemDTO[];
  errores?: string[];

}

/** Respuesta del endpoint /import/excel/v1/ventas/preview */
export interface PreviewResponseDTO {
  estado: ImportEstado;
  total: number;
  ok: number;
  preview: PreviewGroupDTO[];
}

/**
 * Payload esperado por POST /import/excel/v1/ventas
 * - En modo single-courier, se envía courierId (override global).
 * - En modo multi-courier, NO se envía courierId, y cada grupo usa su g.courier.
 */
export interface ImportPayload {
  groups: PreviewGroupDTO[];
  courierId?: number;     // <- ahora opcional para soportar multi-courier
  trabajadorId?: number;
  estadoId?: number;
}

export interface ImportErrorFila {
  fila: number;
  errores: string[];
}

/** Respuesta genérica de la importación */
export interface ImportResultado {
  total?: ImportEstado;
  estado: ImportEstado;
  insertados?: number;
  errores?: ImportErrorFila[];
  detalles?: any;
}
