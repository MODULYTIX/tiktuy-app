import { Icon } from "@iconify/react";
import type { PedidoListItem } from "@/services/repartidor/pedidos/pedidos.types";
import { useCallback, useMemo, useRef, useState } from "react";
import Buttonx from "@/shared/common/Buttonx";
import { InputxTextarea } from "@/shared/common/Inputx";

// ✅ tus componentes
import ImageUploadx from "@/shared/common/ImageUploadx";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

type ResultadoFinal = "ENTREGADO" | "RECHAZADO";
type MetodoPagoUI = "EFECTIVO" | "BILLETERA" | "DIRECTO_ECOMMERCE";

type ConfirmPayload =
  | { pedidoId: number; resultado: "RECHAZADO"; observacion?: string }
  | {
      pedidoId: number;
      resultado: "ENTREGADO";
      metodo: MetodoPagoUI;
      observacion?: string;
      evidenciaFile?: File;
      fecha_entrega_real?: string;
    };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  onConfirm?: (data: ConfirmPayload) => Promise<void> | void;
};

type Paso = "resultado" | "pago" | "evidencia" | "rechazo";

export default function ModalEntregaRepartidor({
  isOpen,
  onClose,
  pedido,
  onConfirm,
}: Props) {
  const [paso, setPaso] = useState<Paso>("resultado");
  const [submitting, setSubmitting] = useState(false);

  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagoUI | null>(null);

  // evidencia
  const [evidenciaFile, setEvidenciaFile] = useState<File | undefined>(
    undefined
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>("");

  // compat (no usados para EFECTIVO)
  const [, setObservacion] = useState<string>("");
  const [, setFechaEntregaReal] = useState<string>(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
  });

  // rechazo
  const [obsRechazo, setObsRechazo] = useState<string>("");

  const resumen = useMemo(() => {
    if (!pedido) return null;
    const fechaProg =
      pedido.fecha_entrega_programada || pedido.fecha_entrega_real;
    const distrito = pedido.cliente?.distrito || "—";
    const telefono = pedido.cliente?.celular || "—";
    const codigo =
      pedido.codigo_pedido || `C${String(pedido.id).padStart(2, "0")}`;
    const direccion = pedido.direccion_envio || "—";
    const cliente = pedido.cliente?.nombre || "—";
    const ecommerce = pedido.ecommerce?.nombre_comercial || "—";
    const referencia = pedido.cliente?.referencia || "—";
    const monto = Number(pedido.monto_recaudar || 0);
    return {
      fechaProg,
      distrito,
      telefono,
      codigo,
      direccion,
      cliente,
      ecommerce,
      referencia,
      monto,
    };
  }, [pedido]);

  const requiresEvidencia = (m: MetodoPagoUI | null): boolean =>
    m === "BILLETERA" || m === "DIRECTO_ECOMMERCE";

  // ✅ reset SOLO de evidencia (archivo + preview)
  const resetEvidence = useCallback(() => {
    setEvidenciaFile(undefined);
    setPreviewOpen(false);
    setPreviewSrc("");
  }, []);

  // ✅ picking unificado (inputs + ImageUploadx)
  const pickImage = useCallback(
    (file?: File | null) => {
      if (!file) {
        resetEvidence();
        return;
      }
      if (!file.type?.startsWith("image/")) return;
      setEvidenciaFile(file);
    },
    [resetEvidence]
  );

  // ✅ si cambia el método, resetea evidencia
  const handleMetodo = useCallback(
    (m: MetodoPagoUI) => {
      if (metodo !== m) {
        resetEvidence(); // 🔥 evita que se “arrastre” la imagen entre métodos
      }
      setMetodo(m);
    },
    [metodo, resetEvidence]
  );

  function reset() {
    setPaso("resultado");
    setResultado(null);
    setMetodo(null);
    setObservacion("");
    setObsRechazo("");
    resetEvidence();

    const d = new Date();
    d.setSeconds(0, 0);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    setFechaEntregaReal(local.toISOString().slice(0, 16));
  }

  function closeAll() {
    onClose();
    reset();
  }

  function handleNextFromResultado() {
    if (resultado === "ENTREGADO") setPaso("pago");
    if (resultado === "RECHAZADO") setPaso("rechazo");
  }

  // ✅ volver “limpio” (sin selección marcada)
  const backToResultadoFromPago = () => {
    setPaso("resultado");
    setResultado(null);     // 🔥 limpia selección
    setMetodo(null);        // 🔥 limpia selección
    resetEvidence();        // por si había algo
  };

  const backToPagoFromEvidencia = () => {
    setPaso("pago");
    setMetodo(null);        // 🔥 limpia selección
    resetEvidence();        // 🔥 elimina evidencia
  };

  const backToResultadoFromRechazo = () => {
    setPaso("resultado");
    setResultado(null);     // 🔥 limpia selección
    setObsRechazo("");      // 🔥 limpia observación
  };

  async function handleConfirm() {
    if (!resultado || !pedido) return;

    const pid = pedido.id;
    try {
      setSubmitting(true);

      if (resultado === "RECHAZADO") {
        const obs = obsRechazo.trim() || undefined;
        await onConfirm?.({
          pedidoId: pid,
          resultado: "RECHAZADO",
          observacion: obs,
        });
        closeAll();
        return;
      }

      if (!metodo) return;
      if (requiresEvidencia(metodo) && !evidenciaFile) return;

      await onConfirm?.({
        pedidoId: pid,
        resultado: "ENTREGADO",
        metodo,
        observacion: undefined,
        evidenciaFile,
        fecha_entrega_real: undefined,
      });
      closeAll();
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen || !pedido || !resumen) return null;

  const telHref =
    resumen.telefono && resumen.telefono !== "—"
      ? `tel:${resumen.telefono}`
      : undefined;
  const waHref =
    resumen.telefono && resumen.telefono !== "—"
      ? `https://wa.me/${resumen.telefono.replace(/\D/g, "")}`
      : undefined;

  const fechaFormateada = resumen.fechaProg
    ? new Date(resumen.fechaProg).toLocaleDateString("es-PE")
    : "—";

  const montoFormateado = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(resumen.monto || 0);

  // modo seguro para no romper TS si tu modal usa otros nombres
  const ImagePreviewModal: any = ImagePreviewModalx;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={closeAll} />

      {/* contenedor principal */}
      <div className="relative z-10 w-full max-w-4xl mx-4 bg-[#F4F5F7] rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-200">
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:shield-check-outline" className="text-2xl" />
              <h2 className="text-xl font-semibold tracking-wide uppercase text-emerald-600 text-center">
                Confirmar entrega
              </h2>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Verifica que el pedido fue entregado correctamente
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 pb-4 pt-4 space-y-6 overflow-y-auto flex-1">
          {/* Resumen + productos */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5">
              <div className="text-xs text-gray-500 text-center">Cliente</div>
              <div className="text-base md:text-lg font-semibold text-gray-900 text-center">
                {resumen.cliente}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 text-sm">
                  <ResumenRow label="Código" value={resumen.codigo} />
                  <ResumenRow label="Distrito" value={resumen.distrito} />
                  <ResumenRow label="Dirección" value={resumen.direccion} />
                  <ResumenRow label="Referencia" value={resumen.referencia} />
                </div>

                <div className="space-y-2 text-sm">
                  <InfoIconRow
                    icon="mdi:phone"
                    color="text-emerald-600"
                    label={resumen.telefono}
                    href={telHref}
                  />
                  <InfoIconRow
                    icon="mdi:store-outline"
                    color="text-indigo-500"
                    label={resumen.ecommerce}
                  />
                  <InfoIconRow
                    icon="mdi:cash"
                    color="text-amber-500"
                    label={montoFormateado}
                  />
                  <InfoIconRow
                    icon="mdi:calendar-blank-outline"
                    color="text-purple-500"
                    label={fechaFormateada}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-5">
                <AccionCircular icon="mdi:phone" label="Llamar" href={telHref} />
                <AccionCircular
                  icon="mdi:whatsapp"
                  label="WhatsApp"
                  href={waHref}
                />
                <AccionCircular
                  icon="mdi:account-voice"
                  label="Otros"
                  onClick={() => {}}
                />
              </div>

              <div className="mt-4 bg-white rounded-md overflow-hidden shadow-default border border-gray30">
                <table className="min-w-full table-fixed text-[13px] bg-white">
                  <thead className="bg-[#E5E7EB]">
                    <tr className="text-gray70 font-roboto font-medium">
                      <th className="px-4 py-2 text-left">Producto</th>
                      <th className="px-4 py-2 text-right w-16">Cant.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray20">
                    {pedido.items?.length ? (
                      pedido.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-gray10 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>{it.nombre}</div>
                            {it.descripcion && (
                              <div className="text-xs text-gray-500">
                                {it.descripcion}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-800 font-medium">
                            {String(it.cantidad).padStart(2, "0")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-center text-xs text-gray-500">
                          No hay productos en este pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Paso: Resultado */}
          {paso === "resultado" && (
            <section className="mt-2">
              <h3 className="text-center text-base md:text-lg font-semibold text-gray-900">
                ¿CUÁL FUE EL RESULTADO FINAL DE LA ENTREGA?
              </h3>
              <p className="text-center text-xs text-gray-500 mt-1">
                Elige una de estas opciones
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <OpcionCard
                  active={resultado === "ENTREGADO"}
                  icon="mdi:check"
                  title="Pedido entregado"
                  onClick={() => setResultado("ENTREGADO")}
                  activeColor="emerald"
                />
                <OpcionCard
                  active={resultado === "RECHAZADO"}
                  icon="mdi:close"
                  title="Pedido no entregado"
                  onClick={() => setResultado("RECHAZADO")}
                  activeColor="red"
                />
              </div>
            </section>
          )}

          {/* Paso: Pago */}
          {paso === "pago" && (
            <section>
              <h3 className="text-sm font-semibold text-[#1D3F8C] uppercase tracking-wide text-center">
                FORMA DE PAGO
              </h3>
              <p className="text-xs text-gray-500 text-center">
                Elige una de estas opciones
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <OpcionCard
                  active={metodo === "EFECTIVO"}
                  icon="mdi:cash"
                  title="Efectivo"
                  onClick={() => handleMetodo("EFECTIVO")}
                  activeColor="emerald"
                />
                <OpcionCard
                  active={metodo === "BILLETERA"}
                  icon="mdi:qrcode-scan"
                  title="Pago por Billetera Digital"
                  onClick={() => handleMetodo("BILLETERA")}
                  activeColor="yellow"
                />
                <OpcionCard
                  active={metodo === "DIRECTO_ECOMMERCE"}
                  icon="mdi:credit-card-outline"
                  title="Pago directo al Ecommerce"
                  onClick={() => handleMetodo("DIRECTO_ECOMMERCE")}
                  activeColor="blue"
                />
              </div>
            </section>
          )}

          {/* Paso: Evidencias */}
          {paso === "evidencia" && (
            <section>
              <h3 className="text-center text-base md:text-lg font-semibold text-[#1D3F8C] uppercase">
                SUBIR EVIDENCIAS
              </h3>
              <p className="text-center text-xs text-gray-500 mt-1">
                Sube una evidencia para verificación del pago
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      pickImage(e.target.files?.[0] ?? null);
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="w-full rounded-2xl bg-white border border-gray-200 px-5 py-3 flex items-center justify-center gap-3 cursor-pointer shadow-[0_6px_18px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_22px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition">
                    <Icon icon="mdi:upload" className="text-2xl text-gray-900" />
                    <span className="text-sm font-medium text-gray-900">
                      Adjuntar imagen
                    </span>
                  </div>
                </label>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      pickImage(e.target.files?.[0] ?? null);
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="w-full rounded-2xl bg-white border border-gray-200 px-5 py-3 flex items-center justify-center gap-3 cursor-pointer shadow-[0_6px_18px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_22px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition">
                    <Icon
                      icon="mdi:camera-outline"
                      className="text-2xl text-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Tomar foto
                    </span>
                  </div>
                </label>
              </div>

              {evidenciaFile && (
                <div className="mt-4">
                  <ImageUploadx
                    value={evidenciaFile}
                    onChange={(file) => pickImage(file)}
                    mode="edit"
                    size="md"
                    confirmOnDelete={false}
                    onView={(url) => {
                      setPreviewSrc(url);
                      setPreviewOpen(true);
                    }}
                  />
                </div>
              )}
            </section>
          )}

          {/* Paso: Rechazo */}
          {paso === "rechazo" && (
            <section>
              <h3 className="text-center text-base md:text-lg font-semibold text-gray-900 uppercase">
                ¿POR QUÉ EL PEDIDO FUE RECHAZADO?
              </h3>
              <p className="text-center text-xs text-gray-500 mt-1">
                Escribe la observación
              </p>

              <InputxTextarea
                label="Observación"
                placeholder="Escribe aquí"
                value={obsRechazo}
                onChange={(e) => setObsRechazo(e.target.value)}
                minRows={3}
                maxRows={5}
              />
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-[#F4F5F7] flex items-center justify-center gap-3">
          {/* RESULTADO */}
          {paso === "resultado" && (
            <>
              <Buttonx
                label="Cancelar"
                variant="outlined"
                onClick={closeAll}
                disabled={submitting}
              />
              <Buttonx
                label="Siguiente"
                variant="quartery"
                icon="mdi:arrow-right"
                iconPosition="right"
                onClick={handleNextFromResultado}
                disabled={!resultado || submitting}
              />
            </>
          )}

          {/* PAGO */}
          {paso === "pago" && (
            <>
              <Buttonx
                label="Volver"
                variant="outlined"
                icon="mdi:arrow-left"
                iconPosition="left"
                onClick={backToResultadoFromPago} // ✅ vuelve y limpia selección
                disabled={submitting}
              />
              <Buttonx
                label="Cancelar"
                variant="outlined"
                onClick={closeAll}
                disabled={submitting}
              />
              <Buttonx
                label={
                  metodo === "EFECTIVO"
                    ? submitting
                      ? "Guardando..."
                      : "Confirmar"
                    : "Siguiente"
                }
                variant="quartery"
                icon={
                  metodo === "EFECTIVO"
                    ? !submitting
                      ? "mdi:check"
                      : undefined
                    : "mdi:arrow-right"
                }
                iconPosition="right"
                onClick={() => {
                  if (!metodo) return;

                  if (metodo === "EFECTIVO") {
                    handleConfirm();
                    return;
                  }

                  if (requiresEvidencia(metodo)) {
                    resetEvidence(); // ✅ siempre entrar “limpio” a evidencia
                    setPaso("evidencia");
                  }
                }}
                disabled={submitting || !metodo}
              />
            </>
          )}

          {/* EVIDENCIA */}
          {paso === "evidencia" && (
            <>
              <Buttonx
                label="Volver"
                variant="outlined"
                icon="mdi:arrow-left"
                iconPosition="left"
                onClick={backToPagoFromEvidencia} // ✅ vuelve y limpia selección + evidencia
                disabled={submitting}
              />
              <Buttonx
                label="Cancelar"
                variant="outlined"
                onClick={closeAll}
                disabled={submitting}
              />
              <Buttonx
                label={submitting ? "Guardando..." : "Confirmar"}
                variant="quartery"
                icon={!submitting ? "mdi:check" : undefined}
                iconPosition="right"
                onClick={handleConfirm}
                disabled={submitting || !evidenciaFile}
              />
            </>
          )}

          {/* RECHAZO */}
          {paso === "rechazo" && (
            <>
              <Buttonx
                label="Volver"
                variant="outlined"
                icon="mdi:arrow-left"
                iconPosition="left"
                onClick={backToResultadoFromRechazo} // ✅ vuelve y limpia selección + obs
                disabled={submitting}
              />
              <Buttonx
                label="Cancelar"
                variant="outlined"
                onClick={closeAll}
                disabled={submitting}
              />
              <Buttonx
                label={submitting ? "Guardando..." : "Confirmar"}
                variant="quartery"
                icon={!submitting ? "mdi:check" : undefined}
                iconPosition="right"
                onClick={handleConfirm}
                disabled={submitting}
              />
            </>
          )}
        </div>
      </div>

      {/* Preview modal */}
      <ImagePreviewModal
        open={previewOpen}
        isOpen={previewOpen}
        src={previewSrc}
        imageUrl={previewSrc}
        title={evidenciaFile?.name || "Evidencia"}
        onClose={() => setPreviewOpen(false)}
        onOpenChange={(v: boolean) => setPreviewOpen(v)}
      />
    </div>
  );
}

/* ------- Subcomponentes ------- */

function ResumenRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-sm leading-snug">
      <span className="text-gray-500">{label}:</span>{" "}
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function InfoIconRow({
  icon,
  label,
  href,
  color,
}: {
  icon: string;
  label: string;
  href?: string;
  color?: string;
}) {
  const content = (
    <div className="flex items-center gap-2">
      <Icon icon={icon} className={`text-lg ${color ?? "text-emerald-600"}`} />
      <span className="text-gray-900 text-sm">{label}</span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        {content}
      </a>
    );
  }

  return content;
}

function AccionCircular({
  icon,
  label,
  href,
  onClick,
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const Circle = (
    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
      <Icon icon={icon} className="text-2xl" />
    </div>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-1"
    >
      {Circle}
      <span className="text-[11px] text-gray-600">{label}</span>
    </a>
  ) : (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      {Circle}
      <span className="text-[11px] text-gray-600">{label}</span>
    </button>
  );
}

function OpcionCard({
  active,
  icon,
  title,
  onClick,
  activeColor = "emerald",
}: {
  active: boolean;
  icon: string;
  title: string;
  onClick: () => void;
  activeColor?: "blue" | "red" | "emerald" | "yellow" | "lime";
}) {
  const palette = {
    emerald: {
      card: "bg-emerald-500 text-white shadow-[0_6px_18px_rgba(16,185,129,0.45)]",
      circle: "border-emerald-500 text-emerald-500",
    },
    red: {
      card: "bg-red-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.45)]",
      circle: "border-red-500 text-red-500",
    },
    yellow: {
      card: "bg-amber-400 text-white shadow-[0_6px_18px_rgba(251,191,36,0.45)]",
      circle: "border-amber-400 text-amber-500",
    },
    lime: {
      card: "bg-lime-500 text-white shadow-[0_6px_18px_rgba(132,204,22,0.45)]",
      circle: "border-lime-500 text-lime-500",
    },
    blue: {
      card: "bg-blue-600 text-white shadow-[0_6px_18px_rgba(37,99,235,0.45)]",
      circle: "border-blue-600 text-blue-600",
    },
  }[activeColor];

  const baseCard =
    "w-full rounded-2xl px-5 py-3 flex items-center justify-center gap-3 transition shadow-sm";
  const inactiveCard =
    "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:shadow-md";

  return (
    <button
      onClick={onClick}
      type="button"
      className={`${baseCard} ${active ? palette.card : inactiveCard}`}
    >
      <div
        className={`w-10 h-10 aspect-square rounded-full shrink-0 flex items-center justify-center bg-white border-2 ${palette.circle}`}
      >
        <Icon icon={icon} className="text-lg" />
      </div>

      <div className="text-sm font-medium leading-snug text-center">{title}</div>
    </button>
  );
}
