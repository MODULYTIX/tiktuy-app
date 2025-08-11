// src/services/ecommerce/importExcel/importexcel.api.ts
import type { PreviewResponseDTO, ImportPayload } from './importexcelPedido.type';

const API = import.meta.env.VITE_API_URL;

// PREVIEW (sube .xlsx y devuelve groups para validar/editar)
export async function previewVentasExcel(file: File, token: string): Promise<PreviewResponseDTO> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API}/import/excel/v1/pedidos/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// IMPORT (envía JSON con los groups editados)
export async function importVentasDesdePreview(payload: ImportPayload, token: string) {
  const res = await fetch(`${API}/import/excel/v1/pedidos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
