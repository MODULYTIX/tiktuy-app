import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { assignPedidos } from "@/services/courier/pedidos/pedidos.api";
import type { PedidoListItem } from "@/services/courier/pedidos/pedidos.types";

import Tittlex from "@/shared/common/Tittlex";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  selectedIds: number[];
  selectedPedido?: PedidoListItem | null;
  onAssigned?: () => void;
};

type MotorizadoOption = {
  id: number;
  nombres: string;
  apellidos: string;
};

type MotorizadoApi = {
  id: number;
  estado_id: number;
  estado?: { nombre?: string; tipo?: string } | null;
  usuario?: { nombres?: string; apellidos?: string } | null;
};

type PedidoDetalleMin = {
  id: number;
  codigo_pedido: string;
  cliente: { nombre: string };
  direccion_envio: string | null;
  fecha_entrega_programada: string | null;
  monto_recaudar: string;
  items?: { nombre: string; cantidad: number; marca?: string }[];
  items_total_cantidad?: number;
};

const API_URL = import.meta.env.VITE_API_URL as string;
const ESTADO_ID_DISPONIBLE = 18;

export default function AsignarRepartidor({
  open,
  onClose,
  token,
  selectedIds,
  onAssigned,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [motosLoading, setMotosLoading] = useState(false);
  const [error, setError] = useState("");
  const [motorizados, setMotorizados] = useState<MotorizadoOption[]>([]);
  const [motorizadoId, setMotorizadoId] = useState<number | "">("");
  const [detalles, setDetalles] = useState<PedidoDetalleMin[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isMulti = selectedIds.length > 1;

  // Cargar motorizados disponibles
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();

    async function loadMotos() {
      setMotosLoading(true);
      setError("");
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

        setMotorizados(
          soloDisponibles.map((m) => ({
            id: m.id,
            nombres: m.usuario?.nombres ?? "",
            apellidos: m.usuario?.apellidos ?? "",
          }))
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      } finally {
        setMotosLoading(false);
      }
    }

    loadMotos();
    return () => ac.abort();
  }, [open, token]);

  // Cargar detalles pedidos seleccionados
  useEffect(() => {
    if (!open) return;

    async function loadDetalles() {
      setError("");
      try {
        const results: PedidoDetalleMin[] = [];
        for (const id of selectedIds) {
          const res = await fetch(`${API_URL}/pedido/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) continue;
          const p = await res.json();
          const items =
            p.detalles?.map((d: any) => ({
              nombre: d.producto?.nombre_producto ?? "Producto",
              cantidad: d.cantidad ?? 0,
              marca: d.producto?.marca ?? "",
            })) ?? [];

          const cantCalc =
            p.items_total_cantidad ??
            items.reduce(
              (s: number, it: { cantidad: number }) => s + (it.cantidad || 0),
              0
            );

          results.push({
            id: p.id,
            codigo_pedido: p.codigo_pedido,
            cliente: { nombre: p.nombre_cliente },
            direccion_envio: p.direccion_envio ?? null,
            fecha_entrega_programada: p.fecha_entrega_programada ?? null,
            monto_recaudar: String(p.monto_recaudar ?? "0"),
            items,
            items_total_cantidad: cantCalc,
          });
        }
        setDetalles(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar detalles");
      }
    }

    loadDetalles();
  }, [open, selectedIds, token]);

  async function handleAsignar() {
    if (!motorizadoId) return;
    setLoading(true);
    setError("");
    try {
      await assignPedidos(token, {
        motorizado_id: Number(motorizadoId),
        pedidos: selectedIds,
      });
      onAssigned?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al asignar");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const primerPedido = detalles[0];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <div className="flex h-full w-[480px] max-w-[90vw] flex-col rounded-l-2xl bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <Tittlex
            title="Asignar repartidor"
            description={
              isMulti
                ? `${selectedIds.length} pedidos seleccionados`
                : primerPedido?.codigo_pedido
                ? `Cód. Pedido: ${primerPedido.codigo_pedido}`
                : "Selecciona un repartidor disponible para el pedido"
            }
            variant="modal"
            icon="mdi:cart"
            className="flex-1"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <Icon icon="mdi:close" width={18} height={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {error}
              </div>
            )}

            {/* Resumen pedido(s) */}
            {!isMulti ? (
              primerPedido && <PedidoCard pedido={primerPedido} />
            ) : (
              <div className="space-y-2">
                {detalles.map((p) => (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-md border border-gray30 bg-white"
                  >
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === p.id ? null : p.id)
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-medium text-gray80 hover:bg-gray10"
                    >
                      <span>{p.codigo_pedido}</span>
                      <Icon
                        icon={
                          expandedId === p.id
                            ? "mdi:chevron-up"
                            : "mdi:chevron-down"
                        }
                        className="text-gray-500"
                      />
                    </button>
                    {expandedId === p.id && (
                      <div className="border-t border-gray20 bg-gray05 px-3 pb-3 pt-2">
                        <PedidoCard pedido={p} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Select repartidor */}
            <div>
              <Selectx
                id="asg-repartidor"
                label="Repartidor"
                className="w-full"
                value={motorizadoId === "" ? "" : String(motorizadoId)}
                onChange={(e) =>
                  setMotorizadoId(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder={
                  motosLoading
                    ? "Cargando repartidores..."
                    : "Seleccionar repartidor"
                }
                disabled={motosLoading}
              >
                <option value="">
                  {motosLoading
                    ? "Cargando repartidores..."
                    : "Seleccione repartidor"}
                </option>
                {motorizados.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombres} {m.apellidos}
                  </option>
                ))}
              </Selectx>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between gap-5">
            <div className="flex gap-5">
              <Buttonx
                label={loading ? "Asignando..." : "Asignar"}
                variant="secondary"
                icon="mdi:content-save-check-outline"
                onClick={handleAsignar}
                disabled={!motorizadoId || loading}
              />
              <Buttonx
                label="Cancelar"
                variant="outlined"
                onClick={onClose}
                disabled={loading}
              />
            </div>
            <div className="text-[11px] text-gray-500 items-end text-end">
              {isMulti
                ? `${selectedIds.length} pedidos serán asignados al repartidor seleccionado.`
                : "El pedido será asignado al repartidor seleccionado."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Componente auxiliar para mostrar pedido con tabla estilizada */
function PedidoCard({ pedido }: { pedido: PedidoDetalleMin }) {
  const monto = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(pedido.monto_recaudar || 0));

  const items = pedido.items ?? [];

  return (
    <div className="space-y-3 rounded-md border border-gray30 bg-white p-4 text-[12px] shadow-sm">
      {/* Encabezado */}
      <div className="mb-1 grid grid-cols-2 gap-4">
        <div className="text-gray80">
          <span className="text-gray60">Cliente: </span>
          <span className="font-medium">{pedido.cliente.nombre}</span>
        </div>
        <div className="text-right text-gray80">
          <span className="text-gray60">Monto: </span>
          <span className="font-semibold">{monto}</span>
        </div>
      </div>

      <div className="text-gray80">
        <span className="text-gray60">Dirección de entrega: </span>
        {pedido.direccion_envio ?? "—"}
      </div>

      <div className="grid grid-cols-2 gap-4 text-gray80">
        <div>
          <span className="text-gray60">F. Entrega: </span>
          {pedido.fecha_entrega_programada
            ? new Date(pedido.fecha_entrega_programada).toLocaleDateString(
                "es-PE"
              )
            : "—"}
        </div>
        <div className="text-right">
          <span className="text-gray60">Cant. de productos: </span>
          {String(pedido.items_total_cantidad ?? 0).padStart(2, "0")}
        </div>
      </div>

      {/* Tabla de productos con formato estándar */}
      <div className="mt-1 overflow-hidden rounded-md border border-gray30 bg-white">
        <table className="min-w-full table-fixed bg-white text-[12px]">
          <colgroup>
            <col className="w-[80%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-[#E5E7EB]">
            <tr className="font-roboto font-medium text-gray70">
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-right">Cant.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray20">
            {items.length === 0 ? (
              <tr className="hover:bg-transparent">
                <td
                  colSpan={2}
                  className="px-3 py-4 text-center italic text-gray70"
                >
                  Sin productos
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className="transition-colors hover:bg-gray10">
                  <td className="px-3 py-2 align-top text-gray80">
                    <div className="flex flex-col">
                      <span className="font-medium">{it.nombre}</span>
                      {it.marca && (
                        <span className="text-[11px] text-gray60">
                          Marca: {it.marca}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-gray80">
                    {String(it.cantidad).padStart(2, "0")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
