// API para exportación de PEDIDOS
const BASE = `${import.meta.env.VITE_API_URL ?? ''}`.replace(/\/+$/, '');

import type { ExportPedidosFilters, DownloadResult } from './exportPedidoExcel.type';

/** Extrae filename del header Content-Disposition si existe */
function getFilenameFromDisposition(disposition?: string | null, fallback = 'pedidos.xlsx') {
  if (!disposition) return fallback;
  // content-disposition: attachment; filename="pedidos_20250101_0900.xlsx"
  const m = /filename\*?=(?:UTF-8'')?"?([^"]+)"?/i.exec(disposition);
  return decodeURIComponent(m?.[1] ?? fallback);
}

/** Descarga la plantilla de pedidos (.xlsx) — público (sin token) */
export async function downloadPedidosTemplate(): Promise<DownloadResult> {
  const url = `${BASE}/export/excel/v1/pedidos/template`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(`Error al descargar plantilla: ${msg}`);
  }
  const blob = await res.blob();
  const filename = getFilenameFromDisposition(res.headers.get('Content-Disposition'), 'plantilla_pedidos.xlsx');
  return { filename, blob };
}

/** Exporta pedidos filtrados del ecommerce del usuario (.xlsx) — requiere Bearer token */
export async function exportPedidosFile(params: {
  token: string;
  filters?: ExportPedidosFilters;
}): Promise<DownloadResult> {
  const { token, filters } = params;
  const q = new URLSearchParams();

  if (filters?.from) q.set('from', filters.from);
  if (filters?.to) q.set('to', filters.to);
  if (typeof filters?.courierId === 'number') q.set('courierId', String(filters.courierId));
  if (typeof filters?.estadoId === 'number') q.set('estadoId', String(filters.estadoId));

  const url = `${BASE}/export/excel/v1/pedidos/file${q.toString() ? `?${q.toString()}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(`Error al exportar pedidos: ${msg}`);
  }

  const blob = await res.blob();
  const filename = getFilenameFromDisposition(res.headers.get('Content-Disposition'), 'pedidos.xlsx');
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
