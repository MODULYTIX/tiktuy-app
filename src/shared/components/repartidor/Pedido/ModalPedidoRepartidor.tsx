import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { PedidoListItem } from "@/services/repartidor/pedidos/pedidos.types";
import Buttonx from "@/shared/common/Buttonx";
import { Inputx, InputxTextarea } from "@/shared/common/Inputx";

// ✅ tu api del nuevo endpoint
import { fetchWhatsappGrupoLink } from "@/services/repartidor/pedidos/pedidos.api";

type ResultadoContacto =
  | "RECEPCION_HOY"
  | "NO_RESPONDE"
  | "REPROGRAMADO"
  | "ANULO";

type ConfirmPayload = {
  pedidoId: number;
  resultado: ResultadoContacto;
  /** Solo cuando resultado = REPROGRAMADO */
  fecha_nueva?: string;
  observacion?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pedido: PedidoListItem | null;
  onConfirm?: (data: ConfirmPayload) => Promise<void> | void;
};

type Paso = "seleccion" | "reprogramar";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function normalizeWhatsappGroupLink(raw: string): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;

  try {
    const u = new URL(t);
    const hostOk =
      u.hostname === "chat.whatsapp.com" || u.hostname.endsWith(".whatsapp.com");
    if (!hostOk) return null;
    if (!u.pathname || u.pathname === "/") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** ✅ SOLO PARA REPROGRAMADO:
 * Garantiza que siempre mandas "YYYY-MM-DD" (sin hora / sin TZ)
 */
function normalizeDateOnly(fecha: string): string {
  const s = String(fecha || "").trim();
  if (!s) return "";
  // input type="date" normalmente ya viene "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // por si llega ISO con hora, cortamos
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return s;
}

export default function ModalRepartidorMotorizado({
  isOpen,
  onClose,
  pedido,
  onConfirm,
}: Props) {
  const [seleccion, setSeleccion] = useState<ResultadoContacto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paso, setPaso] = useState<Paso>("seleccion");

  const [fechaNueva, setFechaNueva] = useState<string>("");
  const [observacion, setObservacion] = useState<string>("");

  const resumen = useMemo(() => {
    if (!pedido) return null;

    const fechaProg =
      pedido.fecha_entrega_programada || pedido.fecha_entrega_real;
    const monto = Number(pedido.monto_recaudar || 0);
    const distrito = pedido.cliente?.distrito || "—";
    const telefono = pedido.cliente?.celular || "—";
    const codigo =
      pedido.codigo_pedido || `C${String(pedido.id).padStart(2, "0")}`;
    const direccion = pedido.direccion_envio || "—";
    const cliente = pedido.cliente?.nombre || "—";
    const ecommerce = pedido.ecommerce?.nombre_comercial || "—";
    const referencia = pedido.cliente?.referencia || "—";

    return {
      fechaProg,
      monto,
      distrito,
      telefono,
      codigo,
      direccion,
      cliente,
      ecommerce,
      referencia,
    };
  }, [pedido]);

  if (!isOpen || !pedido || !resumen) return null;

  function resetEstadoInterno() {
    setSeleccion(null);
    setPaso("seleccion");
    setFechaNueva("");
    setObservacion("");
  }

  const handleClose = () => {
    onClose();
    resetEstadoInterno();
  };

  async function handleConfirm() {
    if (!seleccion || !pedido) return;

    if (seleccion === "REPROGRAMADO" && paso === "reprogramar") {
      const fecha = normalizeDateOnly(fechaNueva); // ✅ SOLO AQUÍ
      if (!fecha) return;

      try {
        setSubmitting(true);
        await onConfirm?.({
          pedidoId: pedido.id,
          resultado: "REPROGRAMADO",
          fecha_nueva: fecha, // ✅ "YYYY-MM-DD"
          observacion: observacion?.trim() || undefined,
        });
        onClose();
      } finally {
        setSubmitting(false);
        resetEstadoInterno();
      }
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm?.({
        pedidoId: pedido.id,
        resultado: seleccion,
      });
      onClose();
    } finally {
      setSubmitting(false);
      resetEstadoInterno();
    }
  }

  function handleContinuar() {
    if (seleccion === "REPROGRAMADO") {
      setPaso("reprogramar");
    }
  }

  const telHref =
    resumen.telefono && resumen.telefono !== "—"
      ? `tel:${resumen.telefono}`
      : undefined;

  const waHref =
    resumen.telefono && resumen.telefono !== "—"
      ? `https://wa.me/${resumen.telefono.replace(/\D/g, "")}`
      : undefined;

  const referenciaHref =
    resumen.referencia && resumen.referencia !== "—"
      ? resumen.referencia.startsWith("http")
        ? resumen.referencia
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          resumen.referencia
        )}`
      : undefined;

  const fechaFormateada = resumen.fechaProg
    ? new Date(resumen.fechaProg).toLocaleDateString("es-PE")
    : "—";


  const montoFormateado = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(resumen.monto || 0);

  async function handleOpenGrupo() {
    if (!pedido?.id) return;

    const token = getToken();
    if (!token) {
      alert("No hay token. Revisa tu auth context.");
      return;
    }

    try {
      const out = await fetchWhatsappGrupoLink(token, pedido.id);
      const raw =
        (out as any)?.link_whatsapp ??
        (out as any)?.link ??
        (out as any)?.url ??
        "";

      const link = normalizeWhatsappGroupLink(String(raw || ""));
      if (!link) {
        alert("No hay link de grupo registrado para este pedido.");
        return;
      }

      window.open(link, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(e?.message || "No se pudo abrir el grupo de WhatsApp.");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* contenedor principal */}
      <div className="relative z-10 w-full max-w-4xl mx-4 bg-[#F4F5F7] rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]">
        {/* header */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-200">
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:shield-check-outline" className="text-2xl" />
              <h2 className="text-xl font-semibold tracking-wide uppercase text-emerald-600 text-center">
                Validar contacto con el cliente
              </h2>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Validación de información para la entrega
            </p>
          </div>
        </div>

        {/* contenido scrollable */}
        <div className="px-6 pb-4 pt-4 space-y-6 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
                  <ResumenRow label="Dirección" value={resumen.direccion} />
                  <a
                    className={`block ${!referenciaHref ? "pointer-events-none" : ""}`}
                    target="_blank"
                    href={referenciaHref}
                    rel="noreferrer"
                  >
                    <ResumenRow label="Referencia" value={resumen.referencia} />
                  </a>
                </div>

                <div className="space-y-1 text-sm">
                  <InfoIconRow
                    icon="mdi:phone"
                    color="text-emerald-600"
                    label={resumen.telefono}
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

              {/* Acciones rápidas */}
              <div className="mt-4 flex items-center justify-center gap-5">
                <AccionCircular icon="mdi:phone" label="Llamar" href={telHref} />
                <AccionCircular
                  icon="mdi:whatsapp"
                  label="WhatsApp"
                  href={waHref}
                />
                <AccionCircular
                  icon="mdi:account-group"
                  label="Grupo"
                  onClick={handleOpenGrupo}
                />
              </div>

              {/* TABLA DE PRODUCTOS */}
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
                        <tr
                          key={idx}
                          className="hover:bg-gray10 transition-colors"
                        >
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
                        <td
                          colSpan={2}
                          className="px-4 py-4 text-center text-xs text-gray-500"
                        >
                          No hay productos en este pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* pasos */}
          {paso === "seleccion" ? (
            <div className="mt-2">
              <h3 className="text-center text-base md:text-lg font-semibold text-gray-900">
                ¿CUÁL FUE EL RESULTADO DEL CONTACTO?
              </h3>
              <p className="text-center text-xs text-gray-500 mt-1">
                Elige una de estas opciones
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <OpcionCard
                  tipo="RECEPCION_HOY"
                  active={seleccion === "RECEPCION_HOY"}
                  icon="mdi:check"
                  title="Recepcionará entrega hoy"
                  onClick={() => setSeleccion("RECEPCION_HOY")}
                />
                <OpcionCard
                  tipo="NO_RESPONDE"
                  active={seleccion === "NO_RESPONDE"}
                  icon="mdi:alert-octagon-outline"
                  title="No responde ó número equivocado"
                  onClick={() => setSeleccion("NO_RESPONDE")}
                />
                <OpcionCard
                  tipo="REPROGRAMADO"
                  active={seleccion === "REPROGRAMADO"}
                  icon="mdi:clock-outline"
                  title="Reprogramado"
                  onClick={() => setSeleccion("REPROGRAMADO")}
                />
                <OpcionCard
                  tipo="ANULO"
                  active={seleccion === "ANULO"}
                  icon="mdi:close"
                  title="No hizo el pedido o anuló"
                  onClick={() => setSeleccion("ANULO")}
                />
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <h3 className="text-center text-base md:text-lg font-semibold text-[#1D3F8C] uppercase">
                Reprogramar fecha de entrega
              </h3>
              <p className="text-center text-xs text-gray-500 mt-1">
                Validación de información para la entrega
              </p>

              <div className="mt-5 flex flex-col md:flex-row gap-5">
                <div className="w-60">
                  <Inputx
                    label="Fecha Entrega"
                    type="date"
                    placeholder="00/00/0000"
                    value={fechaNueva}
                    onChange={(e) => {
                      // ✅ SOLO ESTE CAMBIO: mantener date-only
                      setFechaNueva(normalizeDateOnly(e.target.value));
                    }}
                  />
                </div>

                <div className="w-full">
                  <InputxTextarea
                    label="Observación"
                    placeholder="Ejem. Salió de emergencia, mañana recepcionarán."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    minRows={3}
                    maxRows={5}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        {paso === "seleccion" ? (
          <div className="px-6 py-3 border-t border-gray-200 bg-[#F4F5F7] flex items-center justify-center gap-4">
            <Buttonx
              label="Cancelar"
              variant="outlined"
              onClick={handleClose}
              disabled={submitting}
            />

            <Buttonx
              label={submitting ? "Guardando..." : "Confirmar"}
              variant="quartery"
              icon={!submitting ? "mdi:arrow-right" : undefined}
              iconPosition="right"
              onClick={
                seleccion === "REPROGRAMADO" ? handleContinuar : handleConfirm
              }
              disabled={!seleccion || submitting}
            />
          </div>
        ) : (
          <div className="px-6 py-3 border-t border-gray-200 bg-[#F4F5F7] flex items-center justify-center gap-3">
            <Buttonx
              label="Volver"
              variant="outlined"
              icon="mdi:arrow-left"
              iconPosition="left"
              onClick={() => setPaso("seleccion")}
              disabled={submitting}
            />

            <Buttonx
              label="Cancelar"
              variant="outlined"
              onClick={handleClose}
              disabled={submitting}
            />

            <Buttonx
              label={submitting ? "Guardando..." : "Confirmar"}
              variant="quartery"
              icon={!submitting ? "mdi:check" : undefined}
              iconPosition="left"
              onClick={handleConfirm}
              disabled={submitting || !fechaNueva}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ==== subcomponentes ==== */

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
    <div className="flex items-center gap-2 text-sm leading-snug">
      <Icon
        icon={icon}
        className={`text-[18px] ${color ?? "text-emerald-600"}`}
      />
      <span className="text-gray-900">{label}</span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="hover:underline cursor-pointer"
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
    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:opacity-90 transition">
      <Icon icon={icon} className="text-2xl" />
    </div>
  );

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-1 cursor-pointer"
    >
      {Circle}
      <span className="text-[11px] text-gray-600">{label}</span>
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer"
    >
      {Circle}
      <span className="text-[11px] text-gray-600">{label}</span>
    </button>
  );
}

function OpcionCard({
  tipo,
  active,
  icon,
  title,
  onClick,
}: {
  tipo: ResultadoContacto;
  active: boolean;
  icon: string;
  title: string;
  onClick: () => void;
}) {
  let activeCard = "";
  let borderColor = "";

  switch (tipo) {
    case "RECEPCION_HOY":
      activeCard =
        "bg-emerald-500 text-white shadow-[0_6px_18px_rgba(16,185,129,0.45)]";
      borderColor = "border-emerald-500 text-emerald-500";
      break;
    case "NO_RESPONDE":
      activeCard =
        "bg-red-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.45)]";
      borderColor = "border-red-500 text-red-500";
      break;
    case "REPROGRAMADO":
      activeCard =
        "bg-amber-400 text-white shadow-[0_6px_18px_rgba(251,191,36,0.45)]";
      borderColor = "border-amber-400 text-amber-500";
      break;
    case "ANULO":
      activeCard =
        "bg-red-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.45)]";
      borderColor = "border-red-500 text-red-500";
      break;
  }

  const baseCard =
    "w-full rounded-2xl px-5 py-3 flex items-center justify-center gap-3 transition shadow-sm cursor-pointer";
  const inactiveCard =
    "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:shadow-md";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseCard} ${active ? activeCard : inactiveCard}`}
    >
      <div
        className={`w-10 h-10 aspect-square rounded-full shrink-0 flex items-center justify-center bg-white border-2 ${borderColor} cursor-pointer`}
      >
        <Icon icon={icon} className="text-lg" />
      </div>

      <div className="text-sm font-medium leading-snug text-center">{title}</div>

      {active && <Icon icon="mdi:check" className="ml-2 text-xl text-white" />}
    </button>
  );
}
