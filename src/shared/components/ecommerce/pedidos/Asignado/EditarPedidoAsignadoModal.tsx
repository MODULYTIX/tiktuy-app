// src/shared/components/ecommerce/pedidos/Asignado/EditarPedidoAsignadoModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  fetchPedidoById,
  actualizarPedidoAsignado,
} from "@/services/ecommerce/pedidos/pedidos.api";
import type { Pedido } from "@/services/ecommerce/pedidos/pedidos.types";
import { useAuth } from "@/auth/context";

// 🔽 usa tus componentes
import { Inputx, InputxPhone, InputxNumber } from "@/shared/common/Inputx";
import { SelectxDate } from "@/shared/common/Selectx";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onUpdated: () => void;
}

export default function EditarPedidoAsignadoModal({
  isOpen,
  onClose,
  pedidoId,
  onUpdated,
}: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Form (payload) ---
  const [form, setForm] = useState({
    // payload real
    nombre_cliente: "",
    direccion: "",
    referencia: "",
    distrito: "",
    monto_recaudar: "",
    courier_id: "",
    motorizado_id: "",

    // SOLO UI (no se envía)
    celular_cliente: "",
    producto_id: "",
    cantidad: "",
    fecha_entrega_programada: "",
    precio_unitario: "",
  });

  // cerrar por click afuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [isOpen, onClose]);

  // cargar pedido
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);

    fetchPedidoById(pedidoId, token)
      .then((p) => {
        setPedido(p);

        const det = p.detalles?.[0];
        const prodId = det?.producto_id ? String(det.producto_id) : "";
        const prodPrecio = det?.precio_unitario;

        setForm({
          // payload real (se envía)
          nombre_cliente: p.nombre_cliente ?? "",
          direccion: (p as any).direccion ?? p.direccion_envio ?? "",
          referencia: (p as any).referencia ?? p.referencia_direccion ?? "",
          distrito: p.distrito ?? "",
          monto_recaudar: String(p.monto_recaudar ?? ""),
          courier_id: String(((p as any).courier_id ?? p.courier?.id) ?? ""),
          motorizado_id: String((p.motorizado?.id as number | undefined) ?? ""),

          // UI
          celular_cliente: p.celular_cliente ?? "",
          producto_id: prodId,
          cantidad: det?.cantidad != null ? String(det.cantidad) : "",
          fecha_entrega_programada: p.fecha_entrega_programada
            ? new Date(p.fecha_entrega_programada).toISOString().slice(0, 10)
            : "",
          precio_unitario: prodPrecio != null ? String(prodPrecio) : "",
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, token, pedidoId]);

  // ❗ Solo el monto es editable. Todo lo demás queda lectura.
  const onSubmit = async () => {
    if (!token || !pedidoId) return;
    setSaving(true);
    try {
      await actualizarPedidoAsignado(
        pedidoId,
        {
          nombre_cliente: form.nombre_cliente.trim(),
          direccion: form.direccion.trim(),
          referencia: form.referencia.trim(),
          distrito: form.distrito,
          monto_recaudar: Number(form.monto_recaudar) || 0,
          courier_id: form.courier_id ? Number(form.courier_id) : undefined,
          motorizado_id: form.motorizado_id ? Number(form.motorizado_id) : undefined,
        } as any,
        token
      );
      onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const estadoLabel = pedido?.estado_pedido ? String(pedido.estado_pedido) : "";
  const nombreCourier = pedido?.courier?.nombre_comercial ?? "";

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className={[
          "h-full bg-white shadow-xl flex flex-col gap-5 p-5",
          "w-[460px] max-w-[92vw]", // ✅ ancho fijo
          "overflow-y-auto",
          "animate-slide-in-right",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 justify-between items-center">
            <Tittlex
              variant="modal"
              title="EDITAR PEDIDO"
              icon="lsicon:shopping-cart-filled"
            />
            {estadoLabel && (
              <div className="text-sm">
                <span className="text-gray-500">Estado : </span>
                <span className="text-yellow-600 font-medium">{estadoLabel}</span>
              </div>
            )}
          </div>
          <p className="text-base text-gray-600 -mt-0.5">
            Solo puedes editar el monto. El resto está en modo lectura.
          </p>
        </div>

        {loading || !pedido ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex flex-col gap-5">
              <div className="w-full flex gap-5">
                <Inputx
                  label="Courier"
                  value={nombreCourier}
                  readOnly
                  disabled
                  placeholder="Courier"
                />
                <Inputx
                  label="Nombre"
                  name="nombre_cliente"
                  value={form.nombre_cliente}
                  readOnly
                  disabled
                  placeholder="Nombre"
                />
              </div>

              <div className="w-full flex gap-5">
                <InputxPhone
                  label="Teléfono"
                  countryCode="+51"
                  name="celular_cliente"
                  value={form.celular_cliente}
                  readOnly
                  disabled
                  placeholder="987654321"
                />

                <Inputx
                  label="Distrito"
                  name="distrito"
                  value={form.distrito}
                  readOnly
                  disabled
                  placeholder="Distrito"
                />
              </div>

              <Inputx
                label="Dirección"
                name="direccion"
                value={form.direccion}
                readOnly
                disabled
                placeholder="Av. Grau J 499"
              />

              <Inputx
                label="Referencia"
                name="referencia"
                value={form.referencia}
                readOnly
                disabled
                placeholder="Al lado del supermercado UNO"
              />

              <div className="w-full flex gap-5">
                <InputxNumber
                  label="Monto"
                  name="monto_recaudar"
                  value={form.monto_recaudar}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      monto_recaudar: (e.target as HTMLInputElement).value,
                    }))
                  }
                  decimals={2}
                  min={0}
                  placeholder="S/. 0.00"
                />

                <SelectxDate
                  label="Fecha Entrega"
                  value={form.fecha_entrega_programada}
                  onChange={() => {}}
                  disabled
                />
              </div>

              <div className="shadow-default rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray20">
                    <tr>
                      <th className="px-3 w-full py-2 font-normal text-left">
                        Producto
                      </th>
                      <th className="px-3 w-12 py-2 font-normal text-right">
                        Cant.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pedido?.detalles ?? []).map((it, i) => (
                      <tr
                        key={it.producto_id ?? it.producto?.id ?? i}
                        className="border-y border-gray20"
                      >
                        <td className="px-3 py-2 w-full align-top">
                          <div className="font-normal">
                            {it.producto?.nombre_producto ?? it.producto_id}
                          </div>
                          {it.descripcion && (
                            <div className="text-gray-500 text-xs">
                              {it.descripcion}
                            </div>
                          )}
                          {it.marca && (
                            <div className="text-gray-400 text-xs">
                              Marca: {it.marca}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 w-12 text-gray60 text-center">
                          {it.cantidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-start gap-3 mt-2">
              <Buttonx
                variant="tertiary"
                onClick={onSubmit}
                disabled={saving}
                label={saving ? "Guardando..." : "Guardar cambios"}
                icon={saving ? "line-md:loading-twotone-loop" : "mdi:content-save-outline"}
                className={`px-4 text-sm ${saving ? "[&_svg]:animate-spin" : ""}`}
              />
              <Buttonx
                variant="outlinedw"
                onClick={onClose}
                disabled={saving}
                label="Cancelar"
                className="px-4 text-sm border"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
