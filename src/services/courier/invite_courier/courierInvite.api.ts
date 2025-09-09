// src/services/courierInvite/courierInvite.api.ts
import type {
  CourierWhatsappLink,
  UpdateWhatsappLinkBody,
  RequestWhatsappLinkBody,
} from './courierInvite.types';

const API = import.meta.env.VITE_API_URL;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
function jsonHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function withTimeout(ms = 12000) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, clear: () => clearTimeout(id) };
}

async function readMsg(r: Response): Promise<string | undefined> {
  try {
    const data = await r.json();
    return (data && (data.message || data.error)) as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * GET /courier-invite/whatsapp?otherId=123
 */
export async function getCourierWhatsappLink(
  token: string,
  otherId: number
): Promise<CourierWhatsappLink> {
  if (!Number.isFinite(otherId) || otherId <= 0) {
    throw new Error('otherId inválido');
  }
  const url = new URL(`${API}/courier-invite/whatsapp`);
  url.searchParams.set('otherId', String(otherId));

  const t = withTimeout();
  const r = await fetch(url.toString(), {
    headers: authHeaders(token),
    signal: t.signal,
  }).finally(t.clear);

  if (!r.ok) {
    const msg = await readMsg(r);
    if (r.status === 404) throw new Error('Asociación no encontrada');
    if (r.status === 401) throw new Error('No autorizado');
    throw new Error(msg || 'No se pudo obtener el link de WhatsApp');
  }
  return r.json();
}

/**
 * POST /courier-invite/whatsapp
 * body: { otherId, link }
 */
export async function createCourierWhatsappLink(
  token: string,
  body: UpdateWhatsappLinkBody
): Promise<CourierWhatsappLink> {
  const payload = { ...body, link: body.link?.trim?.() ?? body.link };

  const t = withTimeout();
  const r = await fetch(`${API}/courier-invite/whatsapp`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
    signal: t.signal,
  }).finally(t.clear);

  if (!r.ok) {
    const msg = await readMsg(r);
    if (r.status === 409) throw new Error('Ya existe un link para esta asociación');
    if (r.status === 400) throw new Error(msg || 'Datos inválidos');
    throw new Error(msg || 'No se pudo crear el link de WhatsApp');
  }
  return r.json();
}

/**
 * PATCH /courier-invite/whatsapp
 * body: { otherId, link }
 */
export async function updateCourierWhatsappLink(
  token: string,
  body: UpdateWhatsappLinkBody
): Promise<CourierWhatsappLink> {
  const payload = { ...body, link: body.link?.trim?.() ?? body.link };

  const t = withTimeout();
  const r = await fetch(`${API}/courier-invite/whatsapp`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
    signal: t.signal,
  }).finally(t.clear);

  if (!r.ok) {
    const msg = await readMsg(r);
    if (r.status === 400) throw new Error(msg || 'Link inválido');
    if (r.status === 404) throw new Error('Asociación no encontrada');
    throw new Error(msg || 'No se pudo actualizar el link de WhatsApp');
  }
  return r.json();
}

/**
 * POST /courier-invite/whatsapp/request
 * body: { otherId }
 */
export async function requestCourierWhatsappLink(
  token: string,
  body: RequestWhatsappLinkBody
): Promise<{ ok: boolean }> {
  const t = withTimeout();
  const r = await fetch(`${API}/courier-invite/whatsapp/request`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(body),
    signal: t.signal,
  }).finally(t.clear);

  if (!r.ok) {
    const msg = await readMsg(r);
    if (r.status === 404) throw new Error('Asociación no encontrada');
    if (r.status === 400) throw new Error(msg || 'Datos inválidos');
    throw new Error(msg || 'No se pudo enviar la solicitud de link de WhatsApp');
  }
  return r.json();
}
