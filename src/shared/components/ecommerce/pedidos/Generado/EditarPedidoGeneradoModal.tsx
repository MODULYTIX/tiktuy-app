import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/auth/context';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import { actualizarPedidoGenerado, type UpdatePedidoGeneradoPayload } from '@/services/ecommerce/pedidos/pedidos.api';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import Tittlex from '@/shared/common/Tittlex';
import { Inputx, InputxPhone, InputxNumber } from '@/shared/common/Inputx';
import { Selectx } from '@/shared/common/Selectx';

type Props = {
  open: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onUpdated?: () => void;
};

export default function EditarPedidoGeneradoModal({
  open,
  onClose,
  pedidoId,
  onUpdated,
}: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [courierOptions, setCourierOptions] = useState<{ id: string; nombre: string }[]>([]);
  const [, setDistritoOptions] = useState<string[]>([]);

  const [form, setForm] = useState({
    nombre_cliente: '',
    numero_cliente: '',
    celular_cliente: '',
    direccion_envio: '',
    referencia_direccion: '',
    distrito: '',
    fecha_entrega_programada: '',
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
    monto_recaudar: '',
    courier_id: '',
  });

  // Cargar recursos
  useEffect(() => {
    if (!open || !token) return;

    fetchProductos(token).then(setProductos).catch(() => setProductos([]));

    if (pedidoId) {
      setLoading(true);
      fetchPedidoById(pedidoId, token)
        .then((p) => {
          setPedido(p);
          const det = p.detalles?.[0];

          const cId = ((p as any).courier_id ?? p.courier?.id) ?? '';
          const cName = p.courier?.nombre_comercial ?? '';
          const couriers = cId && cName ? [{ id: String(cId), nombre: cName }] : [];
          setCourierOptions(couriers);

          const distritos = p.distrito ? [p.distrito] : [];
          setDistritoOptions(distritos);

          setForm({
            nombre_cliente: p.nombre_cliente ?? '',
            numero_cliente: p.numero_cliente ?? '',
            celular_cliente: p.celular_cliente ?? '',
            direccion_envio: p.direccion_envio ?? '',
            referencia_direccion: p.referencia_direccion ?? '',
            distrito: p.distrito ?? '',
            fecha_entrega_programada: p.fecha_entrega_programada
              ? new Date(p.fecha_entrega_programada).toISOString().slice(0, 10)
              : '',
            producto_id: String(det?.producto_id ?? ''),
            cantidad: String(det?.cantidad ?? ''),
            precio_unitario: String(det?.precio_unitario ?? ''),
            monto_recaudar: String(p.monto_recaudar ?? ''),
            courier_id: cId ? String(cId) : '',
          });
        })
        .catch(() => setPedido(null))
        .finally(() => setLoading(false));
    }
  }, [open, pedidoId, token]);

  useEffect(() => {
    const sel = productos.find((p) => p.id === Number(form.producto_id));
    if (sel) {
      setForm((prev) => ({ ...prev, precio_unitario: String(sel.precio ?? '') }));
    }
  }, [form.producto_id, productos]);

  useEffect(() => {
    const cantidad = Number(form.cantidad);
    const precio = Number(form.precio_unitario);
    if (!isNaN(cantidad) && !isNaN(precio)) {
      setForm((prev) => ({ ...prev, monto_recaudar: String(cantidad * precio) }));
    }
  }, [form.cantidad, form.precio_unitario]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!token || !pedidoId) return;

    const payload: UpdatePedidoGeneradoPayload = {
      nombre_cliente: form.nombre_cliente.trim() || undefined,
      numero_cliente: (form.numero_cliente ?? '').trim(),
      celular_cliente: form.celular_cliente.trim() || undefined,
      direccion_envio: form.direccion_envio.trim() || undefined,
      referencia_direccion: (form.referencia_direccion ?? '').trim(),
      distrito: form.distrito,
      fecha_entrega_programada: form.fecha_entrega_programada
        ? new Date(form.fecha_entrega_programada + 'T00:00:00').toISOString()
        : null,
      monto_recaudar: Number(form.monto_recaudar) || undefined,
      detalle: {
        producto_id: Number(form.producto_id) || undefined,
        cantidad: Number(form.cantidad) || undefined,
        precio_unitario: Number(form.precio_unitario) || undefined,
      },
    };

    if (payload.detalle && Object.values(payload.detalle).every((v) => v === undefined)) {
      delete (payload as any).detalle;
    }

    setSaving(true);
    try {
      await actualizarPedidoGenerado(pedidoId, payload, token);
      onUpdated?.();
      onClose();
    } catch (e) {
      console.error('Error actualizando pedido (generado):', e);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right flex flex-col gap-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="EDITAR PEDIDO"
          description="Modifique los datos del cliente, el producto o la información de entrega y guarde los cambios en el pedido."
        />

        {/* Loading / Empty */}
        {!pedidoId || !token ? (
          <p className="text-sm text-gray-600">Seleccione un pedido.</p>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : !pedido ? (
          <p className="text-sm text-gray-600">No se encontró el pedido.</p>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Selectx
                label="Courier"
                name="courier_id"
                labelVariant="left"
                value={form.courier_id}
                onChange={handleChange}
                placeholder="Seleccionar Courier"
              >
                {courierOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Selectx>

              <Inputx
                label="Nombre"
                name="nombre_cliente"
                value={form.nombre_cliente}
                onChange={handleChange}
                placeholder="Alvaro"
              />

              <InputxPhone
                label="Teléfono"
                name="celular_cliente"
                countryCode="+51"
                value={form.celular_cliente}
                onChange={handleChange}
                placeholder="987654321"
              />

              <Inputx
                label="Distrito"
                name="distrito"
                value={form.distrito}
                onChange={handleChange}
                placeholder="Distrito"
              />

              <div className="col-span-2">
                <Inputx
                  label="Dirección"
                  name="direccion_envio"
                  value={form.direccion_envio}
                  onChange={handleChange}
                  placeholder="Av. Grau J 499"
                />
              </div>

              <div className="col-span-2">
                <Inputx
                  label="Referencia"
                  name="referencia_direccion"
                  value={form.referencia_direccion}
                  onChange={handleChange}
                  placeholder="(opcional)"
                />
              </div>

              <Selectx
              labelVariant="left"
                label="Producto"
                name="producto_id"
                value={form.producto_id}
                onChange={handleChange}
                placeholder="Seleccionar Producto"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_producto}
                  </option>
                ))}
              </Selectx>

              <InputxNumber
                label="Cantidad"
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                placeholder="0"
              />

              <InputxNumber
                label="Monto"
                name="monto_recaudar"
                value={form.monto_recaudar}
                onChange={handleChange}
                placeholder="S/. 0.00"
              />

              <Inputx
                label="Fecha Entrega"
                name="fecha_entrega_programada"
                type="date"
                value={form.fecha_entrega_programada}
                onChange={handleChange}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-start gap-3 mt-6 items-end">
              <button
                onClick={handleSubmit}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-60"
                disabled={saving}
              >
                Actualizar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
                disabled={saving}
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
