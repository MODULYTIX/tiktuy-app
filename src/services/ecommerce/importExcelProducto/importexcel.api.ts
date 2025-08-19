import type {
  PreviewProductosResponseDTO,
  ImportProductosPayload,
  ImportProductosResultado,
} from './importexcel.type';

const API_URL = import.meta.env.VITE_API_URL as string;

async function parseError(res: Response): Promise<never> {
  // Intenta JSON primero
  try {
    const data = await res.json();
    const msg =
      data?.message ||
      data?.error ||
      data?.detalle ||
      (typeof data === 'string' ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  } catch {
    // Si no es JSON, prueba texto
    try {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
  }
}

/**
 * POST /import/excel/v1/productos/preview
 * Envía multipart/form-data con 'file' (.xlsx) y devuelve la estructura PreviewProductosResponseDTO.
 */
export async function previewProductosExcel(
  file: File,
  token: string
): Promise<PreviewProductosResponseDTO> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_URL}/import/excel/v1/productos/preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) await parseError(res);
  return res.json();
}

/**
 * POST /import/excel/v1/productos
 * Envía JSON con { groups } e inserta/actualiza en BD.
 * Nota: si el backend devuelve 400 con estado "vacio", aquí se lanzará Error.
 */
export async function importProductosDesdePreview(
  payload: ImportProductosPayload,
  token: string
): Promise<ImportProductosResultado> {
  const res = await fetch(`${API_URL}/import/excel/v1/productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) await parseError(res);
  return res.json();
}

/**
 * POST /import/excel/v1/productos/file
 * Variante “todo en uno”: sube archivo .xlsx (form-data) e importa directamente.
 */
export async function importProductosDesdeArchivo(args: {
  file: File;
  token: string;
}): Promise<ImportProductosResultado> {
  const { file, token } = args;

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_URL}/import/excel/v1/productos/file`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) await parseError(res);
  return res.json();
}

/* Aliases opcionales para mantener compatibilidad con nombres previos */
export const previewExcelProductos = previewProductosExcel;
export const importDesdePreviewProductos = importProductosDesdePreview;
export const importDesdeArchivoProductos = importProductosDesdeArchivo;
