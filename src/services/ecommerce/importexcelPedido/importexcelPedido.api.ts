// src/services/ecommerce/importExcel/importexcel.api.ts
import type { PreviewResponseDTO, ImportPayload, ImportResultado } from './importexcelPedido.type';

const API_URL = import.meta.env.VITE_API_URL as string;

/**
 * POST /import/excel/v1/pedidos/preview
 * Envía multipart/form-data con 'file' (.xlsx) y devuelve la estructura PreviewResponseDTO.
 */
export async function previewVentasExcel(
  file: File,
  token: string
): Promise<PreviewResponseDTO> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_URL}/import/excel/v1/pedidos/preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || 'Error en preview de Excel');
  }

  return res.json();
}

/**
 * POST /import/excel/v1/pedidos
 * Envía JSON con { groups, courierId, trabajadorId?, estadoId? } e inserta en BD.
 */
export async function importVentasDesdePreview(
  payload: ImportPayload,
  token: string
): Promise<ImportResultado> {

  const res = await fetch(`${API_URL}/import/excel/v1/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(async () => ({
      message: await res.text().catch(() => 'Error desconocido'),
    }));
    throw new Error(errJson?.message || 'Error al importar pedidos');
  }

  return (await res.json()) as ImportResultado; 
}


/**
 * POST /import/excel/v1/pedidos/file
 * Variante “todo en uno”: sube archivo .xlsx y campos adicionales (form-data).
 * Internamente el backend reusa el pipeline del preview.
 */
export async function importVentasDesdeArchivo(args: {
  file: File;
  courierId: number;
  token: string;
  trabajadorId?: number;
  estadoId?: number;
}): Promise<ImportResultado> {
  const { file, courierId, token, trabajadorId, estadoId } = args;

  const form = new FormData();
  form.append('file', file);
  form.append('courierId', String(courierId));
  if (typeof trabajadorId === 'number') form.append('trabajadorId', String(trabajadorId));
  if (typeof estadoId === 'number') form.append('estadoId', String(estadoId));

  const res = await fetch(`${API_URL}/import/excel/v1/pedidos/file`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(async () => ({
      message: await res.text().catch(() => 'Error desconocido'),
    }));
    console.error('❌ Error al importar desde archivo — backend respondió:', errJson);
    throw new Error(errJson?.message || 'Error al importar desde archivo');
  }

  return res.json();
}

/* Aliases opcionales (para futura migración de nombres) */
export const previewPedidosExcel = previewVentasExcel;
export const importPedidosDesdePreview = importVentasDesdePreview;
export const importPedidosDesdeArchivo = importVentasDesdeArchivo;
