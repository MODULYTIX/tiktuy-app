// Tipos y DTOs para importar productos desde Excel

export type ImportEstado = 'ok' | 'parcial' | 'vacio' | 'error';

/** Fila del preview de productos (mapeada por el backend) */
export interface PreviewProductoDTO {
  fila: number;                 // 2-based (número de fila en Excel)
  valido: boolean;
  errores?: string[];
  nombre_producto: string;
  descripcion?: string | null;
  categoria: string;
  almacen: string;
  precio: number;               // >= 0
  cantidad: number;             // stock actual (>= 0)
  stock_minimo: number;         // >= 0
  peso: number;                 // >= 0
}

/** Respuesta del endpoint /import/excel/v1/productos/preview */
export interface PreviewProductosResponseDTO {
  estado: ImportEstado;         // ok | parcial | vacio
  total: number;                // filas procesadas
  ok: number;                   // filas válidas
  preview: PreviewProductoDTO[];
}

/**
 * Payload esperado por POST /import/excel/v1/productos
 * - Se envía únicamente el arreglo "groups" con las filas del preview (posiblemente editadas).
 */
export interface ImportProductosPayload {
  groups: PreviewProductoDTO[];
}

/** Respuesta genérica de la importación de productos */
export interface ImportProductosResultado {
  estado: ImportEstado;         // ok | parcial | vacio
  total?: number;               // filas procesadas
  insertados?: number;          // creados + actualizados
  errores?: Array<{ fila: number; errores: string[] }>;
  [key: string]: any;
}
