import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPedidoDetalle, reassignPedido } from "@/services/courier/pedidos/pedidos.api";
import type { PedidoListItem, PedidoDetalle } from "@/services/courier/pedidos/pedidos.types";
import Tittlex from "@/shared/common/Tittlex";
import { Selectx } from "@/shared/common/Selectx";
import { InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";

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
  const [motorizadosLocal, setMotorizadosLocal] = useState<MotorizadoBasic[]>([]);

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
            (m.estado?.nombre && m.estado.nombre.toLowerCase() === "disponible")
        );

        const mapped: MotorizadoBasic[] = soloDisponibles.map((m) => ({
          id: m.id,
          nombre:
            `${m.usuario?.nombres ?? ""} ${m.usuario?.apellidos ?? ""}`.trim() ||
            `Motorizado ${m.id}`,
        }));

        setMotorizadosLocal(mapped);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "No se pudo cargar repartidores");
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
        const d = await fetchPedidoDetalle(token, pedido.id, { signal: ac.signal });
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

  // ✅ IMPORTANTE: este return va DESPUÉS de todos los hooks
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40" />

      <div
        ref={panelRef}
        className="w-[520px] h-full max-w-[92vw] flex flex-col gap-5 bg-white rounded-xl shadow-default animate-slide-in-right p-5"
      >
        {/* Header */}
        <div className="flex gap-1 justify-between items-center">
          <Tittlex variant="modal" title="REASIGNAR PEDIDO" icon="mdi:package-variant-closed" />
          <div className="flex gap-1">
            <label className="block text-xs font-semibold text-gray-600">Cód. Pedido:</label>
            <div className="text-xs text-gray-600">{pedido.codigo_pedido}</div>
          </div>
        </div>

        {/* Body */}
        <div className="h-full flex flex-col gap-5">
          <div className="flex flex-col gap-5 border border-gray-200 rounded-md p-3">
            <div className="flex flex-col gap-2">
              <div className="w-full items-center flex flex-col">
                <label className="block text-xs font-light text-gray-400">Cliente</label>
                <div className="text-gray-800 font-semibold text-base">{pedido.cliente.nombre}</div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-400">Dirección:</label>
                <div className="text-gray-800 text-sm">
                  {pedido.cliente?.direccion ?? (pedido as any).direccion_envio ?? "-"}
                </div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-400">F. Entrega:</label>
                <div className="text-gray-800 text-sm">{formatFechaPE(pedido.fecha_entrega_programada)}</div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-400">Cant. de Productos:</label>
                <div className="text-gray-800 text-sm">{two(cantidad || 0)}</div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-400">Monto:</label>
                <div className="text-gray-800 text-sm">{PEN.format(Number(pedido.monto_recaudar || 0))}</div>
              </div>

              <div className="flex gap-1">
                <label className="block text-sm font-light text-gray-400">Actual repartador:</label>
                <div className="text-gray-800 text-sm">{pedido.motorizado?.nombres}</div>
              </div>
            </div>

            <div className="shadow-default rounded h-[200px]">
              <table className="w-full text-sm">
                <thead className="bg-gray20">
                  <tr>
                    <th className="px-3 w-full py-2 font-normal text-left">Producto</th>
                    <th className="px-3 w-12 py-2 font-normal text-right">Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-xs text-gray-500">
                        Cargando productos…
                      </td>
                    </tr>
                  )}

                  {!loading && (detalle?.items?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-xs text-gray-400">
                        Sin productos
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    (detalle?.items ?? []).map((it, idx) => (
                      <tr key={idx} className="border-y border-gray20">
                        <td className="px-3 py-2 w-full align-top">
                          <div className="font-normal truncate">{it.nombre}</div>
                        </td>
                        <td className="px-3 py-2 w-12 text-gray60 text-center">
                          {two(it.cantidad)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <Selectx
              label="Repartidor"
              placeholder="Seleccione repartidor"
              value={motorizadoId}
              onChange={(e) => setMotorizadoId(e.target.value ? Number(e.target.value) : "")}
              disabled={motosLoading || submitting}
              labelVariant="left"
            >
              {motorizadosFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </Selectx>

            {!motosLoading && motorizadosFiltrados.length === 0 && (
              <div className="text-xs text-gray-500 mt-1">No hay repartidores disponibles.</div>
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

          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>

        <div className="md:col-span-2 flex justify-start gap-3">
          <Buttonx
            variant="secondary"
            label={submitting ? "Procesando…" : "Reasignar"}
            onClick={handleSubmit}
            disabled={!motorizadoId || !observacion.trim() || submitting}
          />
          <Buttonx variant="outlined" label="Cancelar" onClick={onClose} disabled={submitting} />
        </div>
      </div>
    </div>
  );
}
