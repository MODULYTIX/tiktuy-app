// API para exportación de PRODUCTOS
const BASE = `${import.meta.env.VITE_API_URL ?? ''}`.replace(/\/+$/, '');

import type { DownloadResult } from './exportProductoExcel.type';

/** Extrae filename del header Content-Disposition si existe */
function getFilenameFromDisposition(disposition?: string | null, fallback = 'productos.xlsx') {
  if (!disposition) return fallback;
  const m = /filename\*?=(?:UTF-8'')?"?([^"]+)"?/i.exec(disposition);
  return decodeURIComponent(m?.[1] ?? fallback);
}

/** Descarga la plantilla de productos (.xlsx) — público (sin token) */
export async function downloadProductosTemplate(): Promise<DownloadResult> {
  const url = `${BASE}/export/excel/v1/productos/template`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(`Error al descargar plantilla: ${msg}`);
  }
  const blob = await res.blob();
  const filename = getFilenameFromDisposition(res.headers.get('Content-Disposition'), 'plantilla_productos.xlsx');
  return { filename, blob };
}

/** Exporta productos del ecommerce del usuario (.xlsx) — requiere Bearer token */
export async function exportProductosFile(token: string): Promise<DownloadResult> {
  const url = `${BASE}/export/excel/v1/productos/file`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(`Error al exportar productos: ${msg}`);
  }
  const blob = await res.blob();
  const filename = getFilenameFromDisposition(res.headers.get('Content-Disposition'), 'productos.xlsx');
  return { filename, blob };
}

/** Utilidad opcional: dispara la descarga en el navegador */
export function triggerBrowserDownload({ filename, blob }: DownloadResult) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function safeError(res: Response) {
  try {
    const data = await res.json();
    return data?.error || data?.message || res.statusText;
  } catch {
    return res.statusText;
  }
}
