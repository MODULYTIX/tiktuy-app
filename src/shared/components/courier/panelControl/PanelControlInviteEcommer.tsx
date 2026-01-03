// src/shared/components/courier/panelControl/PanelControlInviteMotorizado.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/auth/context/useAuth";
import {
  getCourierWhatsappLink,
  createCourierWhatsappLink,
  updateCourierWhatsappLink,
} from "@/services/courier/invite_courier/courierInvite.api";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx } from "@/shared/common/Inputx";

type Props = {
  open: boolean; 
  otherId?: number; 
  sedeId?: number; 
  onClose: () => void;
  onSaved?: () => void;
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
  const [requesting, ] = useState(false);
  const [link, setLink] = useState("");
  const [initialLink, setInitialLink] = useState<string>(""); // estado previo
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Validación: chat.whatsapp.com o *.whatsapp.com, con pathname no vacío
  const isValid = useMemo(() => {
    const value = link.trim();
    if (!value) return false;
    try {
      const u = new URL(value);
      const hostOk =
        u.hostname === "chat.whatsapp.com" ||
        u.hostname.endsWith(".whatsapp.com");
      return hostOk && u.pathname.length > 1;
    } catch {
      return false;
    }
  }, [link]);

  const changed = useMemo(
    () => link.trim() !== (initialLink ?? ""),
    [link, initialLink]
  );

  const canAct =
    Boolean(token) &&
    typeof otherId === "number" &&
    Number.isFinite(otherId) &&
    otherId > 0 &&
    typeof sedeId === "number" &&
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
      setLink("");
      setInitialLink("");
      setLoading(false);
      return () => clearTimeout(t);
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        //  FIX: ahora el API recibe (token, { otherId, sedeId })
        const res = await getCourierWhatsappLink(token, {
          otherId: otherId!,
          sedeId: sedeId!,
        });

        const current = res?.link_whatsapp ?? "";
        if (!mounted) return;
        setLink(current);
        setInitialLink(current);
      } catch {
        if (!mounted) return;
        setLink("");
        setInitialLink("");
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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        setOkMsg("Link de WhatsApp actualizado");
      } else {
        await createCourierWhatsappLink(token!, {
          otherId: otherId!,
          sedeId: sedeId!,
          link: trimmed,
        });
        setOkMsg("Link de WhatsApp registrado");
      }

      setInitialLink(trimmed);
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el link");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-[92%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-start gap-4 pr-10">
            {/* Icon bubble */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
              <Icon icon="logos:whatsapp-icon" width={26} height={26} />
            </div>

            <div className="flex-1">
              <h2 className="text-[20px] font-extrabold text-gray90 leading-tight">
                Invitar a grupo de WhatsApp
              </h2>
              <p className="mt-1 text-[13px] text-gray60 leading-relaxed">
                Registra o actualiza el enlace del grupo para coordinar con el
                ecommerce.
              </p>
            </div>
          </div>

          {/* Close (X normal) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray60 hover:text-gray90 hover:bg-gray10 transition"
            aria-label="Cerrar"
          >
            <Icon icon="mdi:close" width={20} height={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Sub-card */}
          <div className="rounded-2xl border border-gray20 bg-gray10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon
                icon="mdi:link-variant"
                className="text-gray60"
                width={18}
                height={18}
              />
              <p className="text-[13px] font-semibold text-gray80">
                Link del grupo
              </p>
            </div>

            <Inputx
              label=""
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/"
              disabled={loading || saving || requesting}
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />

            {/* Helper / Mensajes */}
            <div className="mt-3 min-h-[22px]">
              {loading && (
                <p className="text-[12px] text-gray60">Cargando enlace…</p>
              )}

              {!loading && !link && (
                <p className="text-[12px] text-gray60">
                  Pega el enlace desde WhatsApp:{" "}
                  <span className="font-semibold">
                    “Invitar mediante enlace”
                  </span>
                  .
                </p>
              )}

              {!loading && link && !isValid && (
                <p className="text-[12px] text-orange-600">
                  Enlace inválido. Debe ser de WhatsApp (chat.whatsapp.com o
                  *.whatsapp.com).
                </p>
              )}

              {!loading && error && (
                <p className="text-[12px] text-red-600">{error}</p>
              )}

              {!loading && okMsg && (
                <p className="text-[12px] text-emerald-600">{okMsg}</p>
              )}

              {!canAct && (
                <p className="text-[12px] text-orange-600">
                  Selecciona una contraparte válida y una sede válida (sedeId)
                  para asociar el link.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2 bg-white">
          <div className="flex items-center justify-end gap-3">
            <Buttonx
              label="Cancelar"
              variant="tertiary"
              onClick={onClose}
              disabled={saving || requesting}
            />

            <Buttonx
              label={
                saving ? "Guardando…" : initialLink ? "Actualizar" : "Guardar"
              }
              icon="mdi:content-save-outline"
              variant="secondary"
              onClick={handleSave}
              disabled={
                saving ||
                loading ||
                requesting ||
                !isValid ||
                !changed ||
                !canAct
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
