import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPedidoDetalle,
  reassignPedido,
} from "@/services/courier/pedidos/pedidos.api";
import type {
  PedidoListItem,
  PedidoDetalle,
} from "@/services/courier/pedidos/pedidos.types";
import Tittlex from "@/shared/common/Tittlex";
import { Selectx } from "@/shared/common/Selectx";
import { InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import { Icon } from "@iconify/react";

type MotorizadoBasic = { id: number; nombre: string };

type Props = {
  open: boolean;
  token: string;
  pedido: PedidoListItem;
  /** Si no lo pasas o viene vacío, el modal los cargará del API */
  motorizados?: MotorizadoBasic[];
  title?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

/* ---- Tipos y constantes para cargar motorizados (como en Asignar) ---- */
type MotorizadoApi = {
  id: number;
  estado_id: number;
  estado?: { nombre?: string; tipo?: string } | null;
  usuario?: { nombres?: string; apellidos?: string } | null;
};

const API_URL = import.meta.env.VITE_API_URL as string;
const ESTADO_ID_DISPONIBLE = 18;

/* ---- utilidades de formato ---- */
const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, "0");

// ✅ formatear fecha SIEMPRE en Perú para evitar “-1 día”
const fmtPE = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function formatFechaPE(fecha: string | null | undefined) {
  if (!fecha) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fmtPE.format(new Date(`${fecha}T00:00:00-05:00`));
  }
  return fmtPE.format(new Date(fecha));
}

export default function ReasignarRepartidorModal({
  open,
  token,
  pedido,
  motorizados: motorizadosProp,
  title,
  onClose,
  onSuccess,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [motosLoading, setMotosLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [motorizadoId, setMotorizadoId] = useState<number | "">("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  // lista local (se usa si no llega por props)
  const [motorizadosLocal, setMotorizadosLocal] = useState<MotorizadoBasic[]>(
    []
  );

  // 🔎 Excluir al repartidor actual del select
  const motorizadoActualId = pedido.motorizado?.id ?? null;
  const motorizadosFiltrados = useMemo(
    () => motorizadosLocal.filter((m) => m.id !== motorizadoActualId),
    [motorizadosLocal, motorizadoActualId]
  );

  const cantidad = useMemo(
    () =>
      detalle?.cantidad_productos ??
      pedido.items_total_cantidad ??
      (pedido.items ?? []).reduce((a, it) => a + it.cantidad, 0),
    [detalle, pedido]
  );

  // ✅ Click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  // si vienen por props, úsalo
  useEffect(() => {
    if (Array.isArray(motorizadosProp) && motorizadosProp.length) {
      setMotorizadosLocal(motorizadosProp);
    }
  }, [motorizadosProp]);

  // cargar motorizados del API si no llegaron por props
  useEffect(() => {
    if (!open) return;
    if (Array.isArray(motorizadosProp) && motorizadosProp.length) return;

    const ac = new AbortController();
    (async () => {
      setMotosLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/motorizado`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Error al cargar repartidores");

        const data: MotorizadoApi[] = await res.json();

        const soloDisponibles = data.filter(
          (m) =>
            m.estado_id === ESTADO_ID_DISPONIBLE ||
            (m.estado?.nombre &&
              m.estado.nombre.toLowerCase() === "disponible")
        );

        const mapped: MotorizadoBasic[] = soloDisponibles.map((m) => ({
          id: m.id,
          nombre:
            `${m.usuario?.nombres ?? ""} ${m.usuario?.apellidos ?? ""}`.trim() ||
            `Motorizado ${m.id}`,
        }));

        setMotorizadosLocal(mapped);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setError(e?.message ?? "No se pudo cargar repartidores");
      } finally {
        setMotosLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, token, motorizadosProp]);

  // reset UI cuando se abre/cierra
  useEffect(() => {
    if (open) {
      setMotorizadoId("");
      setObservacion("");
      setError(null);
      setDetalle(null);
    }
  }, [open]);

  // cargar detalle al abrir
  useEffect(() => {
    if (!open) return;

    const ac = new AbortController();
    (async () => {
      setError(null);
      setDetalle(null);
      setLoading(true);
      try {
        const d = await fetchPedidoDetalle(token, pedido.id, {
          signal: ac.signal,
        });
        setDetalle(d);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "No se pudo cargar el detalle");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, token, pedido.id]);

  async function handleSubmit() {
    if (!motorizadoId || submitting) return;

    if (pedido.motorizado?.id && pedido.motorizado.id === motorizadoId) {
      setError("El pedido ya está asignado a ese repartidor.");
      return;
    }

    if (!observacion.trim()) {
      setError("La observación es obligatoria.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await reassignPedido(token, {
        pedido_id: pedido.id,
        motorizado_id: Number(motorizadoId),
        observacion: observacion.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Error al reasignar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      {/* PANEL */}
      <aside
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-[520px] max-w-[92vw] h-full bg-white shadow-2xl border-l border-gray30 flex flex-col"
      >
        {/* HEADER (sticky) */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray20 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <Tittlex
              variant="modal"
              title={(title ?? "REASIGNAR PEDIDO").toUpperCase()}
              icon="mdi:package-variant-closed"
              description="Cambia el repartidor asignado. La observación es obligatoria."
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-gray60 font-medium">Cód. Pedido:</span>
              <span className="px-2 py-1 rounded-md bg-gray10 text-gray80 border border-gray20">
                {pedido.codigo_pedido}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-gray60 font-medium">Actual:</span>
              <span className="px-2 py-1 rounded-md bg-gray10 text-gray80 border border-gray20 truncate max-w-[220px]">
                {pedido.motorizado?.nombres ?? "-"}
              </span>
            </div>
          </div>
        </div>

        {/* BODY (scroll) */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* RESUMEN */}
          <div className="bg-white rounded-md shadow-default border border-gray30 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray20 bg-gray10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] text-gray60">Cliente</div>
                  <div className="text-[14px] font-semibold text-gray90 truncate">
                    {pedido.cliente.nombre}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[12px] text-gray60">Monto</div>
                  <div className="text-[14px] font-semibold text-gray90">
                    {PEN.format(Number(pedido.monto_recaudar || 0))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
              <div className="flex items-start gap-2">
                <Icon
                  icon="mdi:map-marker-outline"
                  width={18}
                  height={18}
                  className="text-gray60 mt-0.5"
                />
                <div className="min-w-0">
                  <div className="text-gray60">Dirección</div>
                  <div className="text-gray80 break-words">
                    {pedido.cliente?.direccion ??
                      (pedido as any).direccion_envio ??
                      "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  icon="mdi:calendar-month-outline"
                  width={18}
                  height={18}
                  className="text-gray60 mt-0.5"
                />
                <div>
                  <div className="text-gray60">F. Entrega</div>
                  <div className="text-gray80">
                    {formatFechaPE(pedido.fecha_entrega_programada)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  icon="mdi:package-variant-closed"
                  width={18}
                  height={18}
                  className="text-gray60 mt-0.5"
                />
                <div>
                  <div className="text-gray60">Cant. Productos</div>
                  <div className="text-gray80">{two(cantidad || 0)}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Icon
                  icon="mdi:account-outline"
                  width={18}
                  height={18}
                  className="text-gray60 mt-0.5"
                />
                <div className="min-w-0">
                  <div className="text-gray60">Repartidor actual</div>
                  <div className="text-gray80 truncate">
                    {pedido.motorizado?.nombres ?? "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA (scroll interno) */}
            <div className="border-t border-gray20">
              <div className="px-4 py-3 flex items-center justify-between bg-white">
                <div className="font-medium text-gray80 text-[12px] flex items-center gap-2">
                  <Icon icon="mdi:cart-outline" width={16} height={16} />
                  Productos
                </div>
                {loading ? (
                  <span className="text-[12px] text-gray60">
                    Cargando…
                  </span>
                ) : (
                  <span className="text-[12px] text-gray60">
                    {(detalle?.items?.length ?? 0) || 0} ítems
                  </span>
                )}
              </div>

              <div className="max-h-[220px] overflow-auto bg-white">
                <table className="min-w-full table-fixed text-[12px] bg-white">
                  <colgroup>
                    <col className="w-[80%]" />
                    <col className="w-[20%]" />
                  </colgroup>

                  <thead className="bg-[#E5E7EB] sticky top-0 z-[1]">
                    <tr className="text-gray70 font-roboto font-medium">
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray20">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr
                          key={`sk-${idx}`}
                          className="[&>td]:px-4 [&>td]:py-3 animate-pulse"
                        >
                          <td>
                            <div className="h-4 bg-gray20 rounded w-3/4" />
                          </td>
                          <td>
                            <div className="h-4 bg-gray20 rounded w-10 ml-auto mr-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (detalle?.items?.length ?? 0) === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-4 text-center text-gray70 italic"
                        >
                          Sin productos
                        </td>
                      </tr>
                    ) : (
                      (detalle?.items ?? []).map((it, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray10 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray70">
                            <div className="truncate">{it.nombre}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray70">
                            {two(it.cantidad)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <Selectx
                label="Repartidor"
                placeholder="Seleccione repartidor"
                value={motorizadoId}
                onChange={(e) =>
                  setMotorizadoId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={motosLoading || submitting}
                labelVariant="left"
              >
                <option value="">Seleccionar opción</option>
                {motorizadosFiltrados.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Selectx>

              {!motosLoading && motorizadosFiltrados.length === 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  No hay repartidores disponibles.
                </div>
              )}
            </div>

            <InputxTextarea
              label="Observación"
              placeholder="Motivo de la reasignación (p. ej., cambio de zona, capacidad, etc.)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={250}
              disabled={submitting}
              minRows={3}
              maxRows={6}
            />

            {error && (
              <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER (sticky) */}
        <div className="sticky bottom-0 bg-white border-t border-gray20 px-5 py-4">
          <div className="flex justify-start gap-3">
            <Buttonx
              variant="secondary"
              label={submitting ? "Procesando…" : "Reasignar"}
              icon={submitting ? "line-md:loading-twotone-loop" : "mdi:swap-horizontal"}
              onClick={handleSubmit}
              disabled={!motorizadoId || !observacion.trim() || submitting}
              className={submitting ? "[&_svg]:animate-spin" : ""}
            />
            <Buttonx
              variant="outlined"
              label="Cancelar"
              icon="mdi:close"
              onClick={onClose}
              disabled={submitting}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
