// Tip: coloca este archivo en src/services/importexcel.type.ts (o donde mantengas tus DTOs)

// Estados posibles (el backend envía: ok | parcial | vacio)
export type ImportEstado = 'ok' | 'parcial' | 'vacio' | 'error';

/** Fila del preview de productos (mapeada por el backend) */
export interface PreviewProductoDTO {
  fila: number;                 // 2-based (número de fila en Excel)
  valido: boolean;
  errores?: string[];

  // Campos de producto
  nombre_producto: string;
  descripcion?: string | null;
  categoria: string;

  // NOTA: 'almacen' se elimina del flujo; la sede se resuelve en backend
  // almacen?: never;

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
 * - No incluye 'almacen'; la sede se determina en backend.
 */
export interface ImportProductosPayload {
  groups: PreviewProductoDTO[];
}

/** Respuesta de la importación de productos */
export interface ImportProductosResultado {
  estado: ImportEstado;         // ok | parcial | vacio
  total: number;                // filas procesadas
  insertados: number;           // productos creados
  actualizados: number;         // productos actualizados
  errores: Array<{ fila: number; errores: string[] }>;
  // Puedes extender con campos adicionales del backend si los agregas
}
