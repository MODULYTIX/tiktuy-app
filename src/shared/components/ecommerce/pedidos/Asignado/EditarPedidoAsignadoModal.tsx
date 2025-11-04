import { useEffect, useRef, useState } from 'react';
import { fetchPedidoById, actualizarPedidoAsignado } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { useAuth } from '@/auth/context';

// 🔽 usa tus componentes
import { Inputx, InputxPhone, InputxNumber } from '@/shared/common/Inputx';
import { SelectxDate } from '@/shared/common/Selectx';
import Tittlex from '@/shared/common/Tittlex';

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
    nombre_cliente: '',
    direccion: '',
    referencia: '',
    distrito: '',
    monto_recaudar: '',
    courier_id: '',      // no editable (solo lectura visual)
    motorizado_id: '',   // no editable

    // SOLO UI (no se envía)
    celular_cliente: '',
    producto_id: '',
    cantidad: '',
    fecha_entrega_programada: '',
    precio_unitario: '',
  });

  // cerrar por click afuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen, onClose]);

  // cargar pedido
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => {
        setPedido(p);

        const det = p.detalles?.[0];
        const prodId = det?.producto_id ? String(det.producto_id) : '';
        const prodPrecio = det?.precio_unitario;

        setForm({
          // payload real (se envía)
          nombre_cliente: p.nombre_cliente ?? '',
          direccion: (p as any).direccion ?? p.direccion_envio ?? '',
          referencia: (p as any).referencia ?? p.referencia_direccion ?? '',
          distrito: p.distrito ?? '',
          monto_recaudar: String(p.monto_recaudar ?? ''),
          courier_id: String(((p as any).courier_id ?? p.courier?.id) ?? ''),
          motorizado_id: String((p.motorizado?.id as number | undefined) ?? ''),

          // UI
          celular_cliente: p.celular_cliente ?? '',
          producto_id: prodId,
          cantidad: det?.cantidad != null ? String(det.cantidad) : '',
          fecha_entrega_programada: p.fecha_entrega_programada
            ? new Date(p.fecha_entrega_programada).toISOString().slice(0, 10)
            : '',
          precio_unitario: prodPrecio != null ? String(prodPrecio) : '',
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
          // mantenemos tu payload (los campos no editables viajan tal cual estaban)
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

  const estadoLabel = pedido?.estado_pedido ? String(pedido.estado_pedido) : '';
  const nombreCourier = pedido?.courier?.nombre_comercial ?? '';

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl flex flex-col gap-5 p-5 animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className='flex gap-1 justify-between items-center'>
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
            {/* Grid (2 columnas) */}
            <div className="h-full flex flex-col gap-5">
              <div className='w-full flex gap-5'>
                {/* Courier (solo lectura) */}
                <Inputx
                  label="Courier"
                  value={nombreCourier}
                  readOnly
                  disabled
                  placeholder="Courier"
                />

                {/* Nombre (solo lectura) */}
                <Inputx
                  label="Nombre"
                  name="nombre_cliente"
                  value={form.nombre_cliente}
                  readOnly
                  disabled
                  placeholder="Nombre"
                />
              </div>

              <div className='w-full flex gap-5'>
                {/* Teléfono (solo lectura) */}
              <InputxPhone
                label="Teléfono"
                countryCode="+51"
                name="celular_cliente"
                value={form.celular_cliente}
                readOnly
                disabled
                placeholder="987654321"
              />

              {/* Distrito (era select → ahora Inputx solo lectura) */}
              <Inputx
                label="Distrito"
                name="distrito"
                value={form.distrito}
                readOnly
                disabled
                placeholder="Distrito"
              />
              </div>
              
              {/* Dirección (solo lectura - full) */}
              <div className="col-span-2">
                <Inputx
                  label="Dirección"
                  name="direccion"
                  value={form.direccion}
                  readOnly
                  disabled
                  placeholder="Av. Grau J 499"
                />
              </div>

              {/* Referencia (solo lectura - full) */}
              <div className="col-span-2">
                <Inputx
                  label="Referencia"
                  name="referencia"
                  value={form.referencia}
                  readOnly
                  disabled
                  placeholder="Al lado del supermercado UNO"
                />
              </div>

              <div className='w-full flex gap-5'>
                {/* Monto (ÚNICO editable) */}
              <InputxNumber
                label="Monto"
                name="monto_recaudar"
                value={form.monto_recaudar}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, monto_recaudar: (e.target as HTMLInputElement).value }))
                }
                decimals={2}
                min={0}
                placeholder="S/. 0.00"
                className='border-3'
              />

              {/* Fecha Entrega (solo lectura) */}
              <SelectxDate
                label="Fecha Entrega"
                value={form.fecha_entrega_programada}
                onChange={() => { }}
                disabled
              />
              </div>

              <div className="shadow-default rounded h-full">
                <table className="w-full text-sm">
                  <thead className="bg-gray20">
                    <tr>
                      <th className="px-3 w-full py-2 font-normal text-left">Producto</th>
                      <th className="px-3 w-12 py-2 font-normal text-right">Cant.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pedido?.detalles ?? []).map((it, i) => (
                      <tr key={it.producto_id ?? it.producto?.id ?? i} className="border-y border-gray20">
                        <td className="px-3 py-2 w-full align-top">
                          <div className="font-normal">{it.producto_id ?? it.producto?.nombre_producto}</div>
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
                        <td className="px-3 py-2 w-12 text-gray60 text-center">{it.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-start gap-3 mt-6">
              <button
                onClick={onSubmit}
                disabled={saving}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Actualizar'}
              </button>
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
