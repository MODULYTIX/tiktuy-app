// src/shared/components/ecommerce/ModalAsociarseCourier.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type {
  CourierAsociado,
  NuevaRelacionInput,
} from "@/services/ecommerce/ecommerceCourier.types";
import Buttonx from "@/shared/common/Buttonx";

export type ModalMode = "view" | "associate" | "desassociate";

type ModalProps = {
  open: boolean;
  mode: ModalMode;
  token: string;
  entry: CourierAsociado;
  onClose: () => void;
  onAssociated: () => void;
  onDesassociated: () => void;
  crearRelacionCourier: (body: NuevaRelacionInput, token: string) => Promise<unknown>;
  asociarCourier: (relacionId: number, token: string) => Promise<unknown>;
  desasociarCourier: (relacionId: number, token: string) => Promise<unknown>;
};

export function ModalAsociarseCourier({
  open,
  mode,
  token,
  entry,
  onClose,
  onAssociated,
  onDesassociated,
  crearRelacionCourier,
  asociarCourier,
  desasociarCourier,
}: ModalProps) {
  const [confirmo, setConfirmo] = useState(false);
  const [confirmoDesasociar, setConfirmoDesasociar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  if (!open) return null;

  const asociado = entry.estado_asociacion === "Activo";
  const isAssociate = mode === "associate";
  const isDesassociate = mode === "desassociate";

  const sedeInfo = useMemo(() => {
    const anyEntry = entry as unknown as { sede_id?: number; sede_uuid?: string };
    return {
      isSede: Boolean(anyEntry.sede_id || anyEntry.sede_uuid),
      sede_id: anyEntry.sede_id,
      sede_uuid: anyEntry.sede_uuid,
    };
  }, [entry]);

  // Reset de checks y error cuando se abre o cambia el contenido/modo
  useEffect(() => {
    if (!open) return;
    setConfirmo(false);
    setConfirmoDesasociar(false);
    setErrMsg("");
    setSubmitting(false);
  }, [open, mode, entry?.id]);

  /** Construye el payload correcto según si viene desde sede o a nivel courier */
  const buildCreatePayload = (): NuevaRelacionInput => {
    if (sedeInfo.sede_id) return { sede_id: sedeInfo.sede_id };
    if (sedeInfo.sede_uuid) return { sede_uuid: sedeInfo.sede_uuid };
    return { courier_id: entry.id };
  };

  const handleAsociar = async () => {
    if (!token) return;

    setSubmitting(true);
    setErrMsg("");

    try {
      // Si viene desde sede, siempre POST con sede específica
      if (sedeInfo.isSede) {
        await crearRelacionCourier(buildCreatePayload(), token);
        onAssociated();
        return;
      }

      // Flujo general por courier:
      if (entry.id_relacion == null) {
        await crearRelacionCourier(buildCreatePayload(), token);
      } else {
        await asociarCourier(entry.id_relacion, token);
      }
      onAssociated();
    } catch (e: any) {
      setErrMsg(e?.message || "Error al asociar courier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDesasociar = async () => {
    if (!token || entry.id_relacion == null) return;

    setSubmitting(true);
    setErrMsg("");

    try {
      await desasociarCourier(entry.id_relacion, token);
      onDesassociated();
    } catch (e: any) {
      setErrMsg(e?.message || "Error al desasociar courier");
    } finally {
      setSubmitting(false);
    }
  };

  const statusPill = asociado
    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
    : "bg-gray20 text-gray80 border border-gray30";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      {/* Modal */}
      <div
        className="absolute left-1/2 top-1/2 w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-gray20">
          <div className="flex items-start gap-4 pr-10">
            {/* Avatar */}
            <div
              className="h-12 w-12 rounded-2xl bg-indigo-600 text-white grid place-items-center font-extrabold"
              aria-hidden
            >
              {entry.nombre_comercial?.[0]?.toUpperCase() ?? "C"}
            </div>

            <div className="flex-1">
              <h2 id="modal-title" className="text-[18px] font-extrabold text-gray90 leading-tight">
                {entry.nombre_comercial?.toUpperCase()}
              </h2>

              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${statusPill}`}>
                  {entry.estado_asociacion}
                </span>

                {sedeInfo.isSede && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-gray60">
                    <Icon icon="mdi:information-outline" width={16} height={16} />
                    Solo esta sede
                  </span>
                )}
              </div>

              <p className="mt-2 text-[13px] text-gray60 leading-relaxed">
                {isDesassociate
                  ? "Vas a cortar la relación actual con este courier."
                  : "Confirma para asociarte y acceder a los beneficios."}
              </p>
            </div>
          </div>

          {/* Close X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray60 hover:text-gray90 hover:bg-gray10 transition"
            aria-label="Cerrar"
            disabled={submitting}
          >
            <Icon icon="mdi:close" width={20} height={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-4">
          {/* Datos (card) */}
          <div className="rounded-2xl border border-gray20 bg-gray10 p-4">
            <p className="text-[13px] font-semibold text-gray80 mb-3 inline-flex items-center gap-2">
              <Icon icon="mdi:card-account-details-outline" width={18} height={18} />
              Información
            </p>

            <div className="grid grid-cols-1 gap-2 text-[13px] text-gray80">
              <div className="flex items-start gap-2">
                <Icon icon="mdi:map-marker-outline" className="text-gray60 mt-[2px]" width={18} height={18} />
                <div>
                  <span className="font-semibold">Ciudad:</span> {entry.ciudad || "-"}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Icon icon="mdi:home-map-marker" className="text-gray60 mt-[2px]" width={18} height={18} />
                <div>
                  <span className="font-semibold">Dirección:</span> {entry.direccion || "-"}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Icon icon="mdi:phone-outline" className="text-gray60 mt-[2px]" width={18} height={18} />
                <div>
                  <span className="font-semibold">Teléfono:</span> {entry.telefono || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Beneficios (card) */}
          <div className="rounded-2xl border border-gray20 bg-white p-4">
            <p className="text-[13px] font-semibold text-gray80 mb-3 inline-flex items-center gap-2">
              <Icon icon="mdi:star-outline" width={18} height={18} />
              Beneficios
            </p>

            <ul className="space-y-2 text-[13px] text-gray80">
              <li className="flex items-start gap-2">
                <Icon icon="mdi:check-circle-outline" className="text-gray60 mt-[2px]" width={18} height={18} />
                Almacenamiento de tu stock.
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="mdi:check-circle-outline" className="text-gray60 mt-[2px]" width={18} height={18} />
                Entrega y cobro para el día siguiente.
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="mdi:check-circle-outline" className="text-gray60 mt-[2px]" width={18} height={18} />
                Estado de entrega en tiempo real.
              </li>
            </ul>
          </div>

          {/* Confirmación (card) */}
          {isAssociate && (
            <div className="rounded-2xl border border-gray20 bg-gray10 p-4">
              <p className="text-[13px] font-semibold text-gray80 mb-2 inline-flex items-center gap-2">
                <Icon icon="mdi:shield-check-outline" width={18} height={18} />
                Confirmación
              </p>

              <label className="flex items-start gap-3 text-[13px] text-gray80">
                <input
                  type="checkbox"
                  checked={confirmo}
                  onChange={(e) => setConfirmo(e.target.checked)}
                  aria-checked={confirmo}
                  className="mt-[3px]"
                />
                <span>
                  Confirmo que quiero asociarme{" "}
                  <b>{sedeInfo.isSede ? "con esta sede" : "con este courier"}</b>.
                </span>
              </label>
            </div>
          )}

          {isDesassociate && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-[13px] font-semibold text-red-800 mb-2 inline-flex items-center gap-2">
                <Icon icon="mdi:alert-outline" width={18} height={18} />
                Confirmación de desasociación
              </p>

              <p className="text-[13px] text-red-800/90">
                Esta acción puede afectar tus operaciones con este courier.
              </p>

              <label className="mt-3 flex items-start gap-3 text-[13px] text-red-900">
                <input
                  type="checkbox"
                  checked={confirmoDesasociar}
                  onChange={(e) => setConfirmoDesasociar(e.target.checked)}
                  aria-checked={confirmoDesasociar}
                  className="mt-[3px]"
                />
                <span>
                  Confirmo que deseo <b>desasociarme</b>.
                </span>
              </label>
            </div>
          )}

          {/* Error */}
          {errMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {errMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray20 bg-white">
          <div className="flex items-center justify-end gap-3">
            <Buttonx
              type="button"
              onClick={onClose}
              label="Cerrar"
              variant="tertiary"
              disabled={submitting}
            />

            {isAssociate && (
              <Buttonx
                type="button"
                onClick={handleAsociar}
                disabled={!confirmo || submitting}
                variant="secondary"
                label={submitting ? "Asociando…" : "Asociarme"}
                icon={submitting ? "mdi:reload" : "mdi:link-variant-plus"}
                className={submitting ? "[&>span>svg]:animate-spin" : ""}
              />
            )}

            {isDesassociate && (
              <Buttonx
                type="button"
                onClick={handleDesasociar}
                disabled={!confirmoDesasociar || submitting || entry.id_relacion == null}
                variant="secondary"
                label={submitting ? "Procesando…" : "Desasociar"}
                icon={submitting ? "mdi:reload" : "mdi:link-off"}
                className={submitting ? "[&>span>svg]:animate-spin" : ""}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
