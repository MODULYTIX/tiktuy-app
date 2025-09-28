import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { useAuth } from '@/auth/context';
import { fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import { actualizarPedidoGenerado, type UpdatePedidoGeneradoPayload } from '@/services/ecommerce/pedidos/pedidos.api';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import type { Producto } from '@/services/ecommerce/producto/producto.types';

type Props = {
  open: boolean;
  onClose: () => void;
  pedidoId: number | null;
  onUpdated?: () => void;
};

export default function EditarPedidoGeneradoModal({ open, onClose, pedidoId, onUpdated }: Props) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Catálogos visuales (si no tienes endpoints, mostramos valores actuales)
  const [courierOptions, setCourierOptions] = useState<{ id: string; nombre: string }[]>([]);
  const [distritoOptions, setDistritoOptions] = useState<string[]>([]);

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
    // NOTA: no se envía en payload para no cambiar tu lógica
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

          // Opciones visuales (si no hay más, solo actual)
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

  // Autorecalcular precio unitario desde producto elegido
  useEffect(() => {
    const sel = productos.find((p) => p.id === Number(form.producto_id));
    if (sel) {
      setForm((prev) => ({ ...prev, precio_unitario: String(sel.precio ?? '') }));
    }
  }, [form.producto_id, productos]);

  // Autorecalcular monto
  useEffect(() => {
    const cantidad = Number(form.cantidad);
    const precio = Number(form.precio_unitario);
    if (!isNaN(cantidad) && !isNaN(precio)) {
      setForm((prev) => ({ ...prev, monto_recaudar: String(cantidad * precio) }));
    }
  }, [form.cantidad, form.precio_unitario]);

  // Cerrar al click fuera
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
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right"
      >
        {/* Header como la imagen */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-start gap-2">
            <BsBoxSeam className="text-primary text-2xl mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-[#0B3C6F]">EDITAR PEDIDO</h2>
              <p className="text-sm text-gray-600 -mt-0.5">
                Modifique los datos del cliente, el producto o la información de entrega y guarde los cambios en el pedido.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {(!pedidoId || !token) ? (
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
            {/* Grid como la imagen */}
            <div className="grid grid-cols-2 gap-4">
              {/* Courier (visual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier</label>
                <select
                  name="courier_id"
                  value={form.courier_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">{pedido.courier?.nombre_comercial ?? 'Seleccionar'}</option>
                  {courierOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  name="nombre_cliente"
                  value={form.nombre_cliente}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={handleChange}
                  placeholder="Alvaro"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <span className="px-3 py-2 text-sm bg-gray-100 text-gray-700">+ 51</span>
                  <input
                    name="numero_cliente"
                    value={form.numero_cliente}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    onChange={handleChange}
                    placeholder="(opcional)"
                  />
                </div>
              </div>

              {/* Distrito (visual select, mantiene tu lógica usando form.distrito) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                <select
                  name="distrito"
                  value={form.distrito}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {form.distrito ? <option value={form.distrito}>{form.distrito}</option> : <option value="">Seleccionar</option>}
                  {distritoOptions
                    .filter((d) => d && d !== form.distrito)
                    .map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                </select>
              </div>

              {/* Dirección (full) */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  name="direccion_envio"
                  value={form.direccion_envio}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={handleChange}
                  placeholder="Av. Grau J 499"
                />
              </div>

              {/* Referencia (full) */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input
                  name="referencia_direccion"
                  value={form.referencia_direccion}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={handleChange}
                  placeholder="Al lado del supermercado UNO"
                />
              </div>

              {/* Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select
                  name="producto_id"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={(e) => {
                    handleChange(e);
                    const sel = productos.find((p) => p.id === Number(e.target.value));
                    if (sel) {
                      setForm((prev) => ({
                        ...prev,
                        precio_unitario: String(sel.precio ?? ''),
                        cantidad: '',
                        monto_recaudar: '',
                      }));
                    }
                  }}
                  value={form.producto_id}
                >
                  <option value="">{pedido.detalles?.[0]?.producto?.nombre_producto ?? 'Seleccionar producto'}</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre_producto}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  name="cantidad"
                  value={form.cantidad}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={(e) => {
                    handleChange(e);
                    const cantidad = Number(e.target.value);
                    const precio = Number(form.precio_unitario);
                    if (!isNaN(cantidad) && !isNaN(precio)) {
                      setForm((prev) => ({ ...prev, monto_recaudar: String(cantidad * precio) }));
                    }
                  }}
                  placeholder="0"
                />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  name="monto_recaudar"
                  value={form.monto_recaudar}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={handleChange}
                  placeholder="S/. 0.00"
                />
                {form.precio_unitario && (
                  <p className="text-xs text-gray-500 mt-1">
                    Precio unitario: S/. {form.precio_unitario}
                  </p>
                )}
              </div>

              {/* Fecha Entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
                <input
                  type="date"
                  name="fecha_entrega_programada"
                  value={form.fecha_entrega_programada}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Footer: acciones abajo a la izquierda (justify-start) */}
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
