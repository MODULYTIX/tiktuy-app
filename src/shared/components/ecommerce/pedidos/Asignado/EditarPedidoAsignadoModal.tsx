import { useEffect, useRef, useState } from 'react';
import { fetchPedidoById, actualizarPedidoAsignado } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { useAuth } from '@/auth/context';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';

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

  // --- Form (mantiene tu lógica de payload) ---
  const [form, setForm] = useState({
    // payload real (se envía tal cual)
    nombre_cliente: '',
    direccion: '',
    referencia: '',
    distrito: '',
    monto_recaudar: '',
    courier_id: '',      // solo id (visual)
    motorizado_id: '',   // opcional

    // SOLO UI (no se envía / no altera tu API)
    celular_cliente: '',
    producto_id: '',
    cantidad: '',
    fecha_entrega_programada: '',
    // precio_unitario solo para cálculo visual opcional
    precio_unitario: '',
  });

  // opciones visuales (si no tienes catálogos, usamos los existentes)
  const [courierOptions, setCourierOptions] = useState<{ id: string; nombre: string }[]>([]);
  const [distritoOptions, setDistritoOptions] = useState<string[]>([]);
  const [productoOptions, setProductoOptions] = useState<{ id: string; nombre: string; precio?: number }[]>([]);

  // cerrar por click afuera
  useEffect(() => {
    if (!isOpen) return;
    const clickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isOpen, onClose]);

  // cargar pedido y setear valores/ops visuales
  useEffect(() => {
    if (!isOpen || !token || !pedidoId) return;
    setLoading(true);
    fetchPedidoById(pedidoId, token)
      .then((p) => {
        setPedido(p);

        // courier visual
        const cId = ((p as any).courier_id ?? p.courier?.id) ?? '';
        const cName = p.courier?.nombre_comercial ?? '';
        const couriers = cId && cName ? [{ id: String(cId), nombre: cName }] : [];
        setCourierOptions(couriers);

        // distrito visual
        setDistritoOptions(p.distrito ? [p.distrito] : []);

        // producto visual (usamos el primero del detalle si existe)
        const det = p.detalles?.[0];
        const prodId = det?.producto_id ? String(det.producto_id) : '';
        const prodName = det?.producto?.nombre_producto ?? (prodId ? `Producto ${prodId}` : '');
        const prodPrecio = det?.precio_unitario;
        setProductoOptions(
          prodId ? [{ id: prodId, nombre: prodName, precio: prodPrecio }] : []
        );

        setForm({
          // payload real
          nombre_cliente: p.nombre_cliente ?? '',
          direccion: (p as any).direccion ?? p.direccion_envio ?? '',
          referencia: (p as any).referencia ?? p.referencia_direccion ?? '',
          distrito: p.distrito ?? '',
          monto_recaudar: String(p.monto_recaudar ?? ''),
          courier_id: cId ? String(cId) : '',
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

  // cálculo visual de monto si hay cantidad * precio
  useEffect(() => {
    const qty = Number(form.cantidad);
    const pu = Number(form.precio_unitario);
    if (!isNaN(qty) && !isNaN(pu) && qty >= 0 && pu >= 0) {
      setForm((prev) => ({ ...prev, monto_recaudar: String(qty * pu) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cantidad, form.precio_unitario]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async () => {
    if (!token || !pedidoId) return;
    setSaving(true);
    try {
      await actualizarPedidoAsignado(
        pedidoId,
        {
          // solo se envía lo que tu API ya espera (no rompemos lógica)
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

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right"
      >
        {/* Header con subtítulo + Estado (derecha) */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-2">
            <BsBoxSeam className="text-primary text-2xl mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-[#0B3C6F]">EDITAR PEDIDO</h2>
              <p className="text-sm text-gray-600 -mt-0.5">
                Modifique los datos del cliente, el producto o la información de entrega y guarde los cambios en el pedido.
              </p>
            </div>
          </div>
          {estadoLabel && (
            <div className="text-sm">
              <span className="text-gray-500">Estado : </span>
              <span className="text-yellow-600 font-medium">{estadoLabel}</span>
            </div>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-3">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {loading || !pedido ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            {/* Grid como tu diseño (2 columnas) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Courier (select visual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier</label>
                <select
                  name="courier_id"
                  value={form.courier_id}
                  onChange={onChange}
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
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Alvaro"
                />
              </div>

              {/* Teléfono con prefijo +51 (solo UI) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <span className="px-3 py-2 text-sm bg-gray-100 text-gray-700">+ 51</span>
                  <input
                    name="celular_cliente"
                    value={form.celular_cliente}
                    onChange={onChange}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    placeholder="987654321"
                  />
                </div>
              </div>

              {/* Distrito (select visual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                <select
                  name="distrito"
                  value={form.distrito}
                  onChange={onChange}
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
                  name="direccion"
                  value={form.direccion}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Av. Grau J 499"
                />
              </div>

              {/* Referencia (full) */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input
                  name="referencia"
                  value={form.referencia}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Al lado del supermercado UNO"
                />
              </div>

              {/* Producto (select visual con opción actual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select
                  name="producto_id"
                  value={form.producto_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, producto_id: val }));
                    // Si tuvieras catálogos, aquí setearías precio_unitario; como es visual, mantenemos
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">
                    {pedido.detalles?.[0]?.producto?.nombre_producto ?? 'Seleccionar'}
                  </option>
                  {productoOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad (solo UI) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  name="cantidad"
                  value={form.cantidad}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((prev) => ({ ...prev, cantidad: v }));
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Monto (real, se envía) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  name="monto_recaudar"
                  value={form.monto_recaudar}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="S/. 0.00"
                />
              </div>

              {/* Fecha Entrega (solo UI) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
                <input
                  type="date"
                  name="fecha_entrega_programada"
                  value={form.fecha_entrega_programada}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Footer: acciones abajo a la IZQUIERDA (como tu diseño) */}
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
