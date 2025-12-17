// src/shared/components/courier/panelControl/PanelControlInviteMotorizado.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/auth/context/useAuth';
import {
  getCourierWhatsappLink,
  createCourierWhatsappLink,
  updateCourierWhatsappLink,
  requestCourierWhatsappLink,
} from '@/services/courier/invite_courier/courierInvite.api';

type Props = {
  open: boolean; // visibilidad del modal
  otherId?: number; // Courier => ecommerce_id, Ecommerce => courier_id
  sedeId?: number; // ✅ NUEVO: sede_id de la asociación (EcommerceSede)
  onClose: () => void; // cerrar modal
  onSaved?: () => void; // callback al guardar/actualizar/solicitar OK
};

export default function PanelControlInviteEcommer({
  open,
  otherId,
  sedeId,
  onClose,
  onSaved,
}: Props) {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [link, setLink] = useState('');
  const [initialLink, setInitialLink] = useState<string>(''); // estado previo
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Validación: chat.whatsapp.com o *.whatsapp.com, con pathname no vacío
  const isValid = useMemo(() => {
    const value = link.trim();
    if (!value) return false;
    try {
      const u = new URL(value);
      const hostOk =
        u.hostname === 'chat.whatsapp.com' || u.hostname.endsWith('.whatsapp.com');
      return hostOk && u.pathname.length > 1;
    } catch {
      return false;
    }
  }, [link]);

  const changed = useMemo(() => link.trim() !== (initialLink ?? ''), [link, initialLink]);

  // ✅ Ahora la asociación requiere otherId + sedeId
  const canAct =
    Boolean(token) &&
    typeof otherId === 'number' &&
    Number.isFinite(otherId) &&
    otherId > 0 &&
    typeof sedeId === 'number' &&
    Number.isFinite(sedeId) &&
    sedeId > 0;

  // Carga inicial al abrir
  useEffect(() => {
    if (!open) return;

    setError(null);
    setOkMsg(null);

    // focus suave en el input
    const t = setTimeout(() => inputRef.current?.focus(), 50);

    // Si falta token / otherId / sedeId, no intentamos cargar
    if (!token || !canAct) {
      setLink('');
      setInitialLink('');
      setLoading(false);
      return () => clearTimeout(t);
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        // ✅ FIX: ahora el API recibe (token, { otherId, sedeId })
        const res = await getCourierWhatsappLink(token, { otherId: otherId!, sedeId: sedeId! });

        const current = res?.link_whatsapp ?? '';
        if (!mounted) return;
        setLink(current);
        setInitialLink(current);
      } catch {
        if (!mounted) return;
        setLink('');
        setInitialLink('');
        // No mostramos error duro aquí: puede no existir aún y es válido
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      clearTimeout(t);
      mounted = false;
    };
  }, [open, token, canAct, otherId, sedeId]);

  // Cerrar modal con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSave() {
    if (!canAct || !isValid || !changed) return;

    setSaving(true);
    setError(null);
    setOkMsg(null);

    try {
      const trimmed = link.trim();

      if (initialLink) {
        await updateCourierWhatsappLink(token!, {
          otherId: otherId!,
          sedeId: sedeId!,
          link: trimmed,
        });
        setOkMsg('Link de WhatsApp actualizado');
      } else {
        await createCourierWhatsappLink(token!, {
          otherId: otherId!,
          sedeId: sedeId!,
          link: trimmed,
        });
        setOkMsg('Link de WhatsApp registrado');
      }

      setInitialLink(trimmed);
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el link');
    } finally {
      setSaving(false);
    }
  }

  async function handleRequest() {
    if (!canAct) return;

    setRequesting(true);
    setError(null);
    setOkMsg(null);

    try {
      await requestCourierWhatsappLink(token!, { otherId: otherId!, sedeId: sedeId! });
      setOkMsg('Solicitud enviada al contraparte');
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar la solicitud');
    } finally {
      setRequesting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[92%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <h2 className="text-[20px] font-bold text-[#1E3A8A]">Invitar a grupo de WhatsApp</h2>
            <button onClick={onClose} className="text-sm text-[#1E3A8A] hover:underline">
              Cerrar
            </button>
          </div>
          <p className="mt-1 text-[13px] text-gray-600">
            Registra o actualiza el link del grupo de WhatsApp para coordinar con el ecommerce.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="inline-flex items-center gap-2">
              <Icon icon="mdi:whatsapp" className="text-2xl text-green-500" />
              Link de Grupo
            </span>
          </label>

          <input
            ref={inputRef}
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/XXXXXXXXXXXXXXX"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#EEF4FF]"
            disabled={loading || saving || requesting}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Mensajes */}
          <div className="mt-2 min-h-[20px]">
            {loading && <p className="text-[13px] text-gray-500">Cargando…</p>}
            {!loading && error && <p className="text-[13px] text-red-600">{error}</p>}
            {!loading && okMsg && <p className="text-[13px] text-green-600">{okMsg}</p>}
            {!loading && link && !isValid && (
              <p className="text-[12px] text-orange-600">
                Debe ser un enlace válido de WhatsApp (chat.whatsapp.com o subdominios *.whatsapp.com)
              </p>
            )}
            {!canAct && (
              <p className="text-[12px] text-orange-600">
                Selecciona primero una contraparte válida y una sede válida (sedeId) para asociar el
                link.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Solicitar link: solo si NO hay link aún y hay otherId+sedeId */}
            {!initialLink && (
              <button
                type="button"
                onClick={handleRequest}
                disabled={requesting || loading || !canAct}
                className={`rounded-md px-4 py-2 text-sm font-medium text-[#1E3A8A] border border-[#1E3A8A] ${
                  requesting || loading || !canAct
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-[#EEF4FF]'
                }`}
                title="Enviar una notificación al contraparte para que comparta el link"
              >
                {requesting ? 'Enviando…' : 'Solicitar link'}
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={saving || requesting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || !isValid || !changed || !canAct}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                saving || loading || !isValid || !changed || !canAct
                  ? 'bg-[#93A6D1] cursor-not-allowed'
                  : 'bg-[#1E3A8A] hover:bg-[#162d6b]'
              }`}
            >
              {saving ? 'Guardando…' : initialLink ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
