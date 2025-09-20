import { useEffect, useRef, useState } from 'react';
import { crearPedido, fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import { useAuth } from '@/auth/context/AuthContext';
import { FiX } from 'react-icons/fi';
import { BsBoxSeam } from 'react-icons/bs';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import { fetchCouriersAsociados } from '@/services/ecommerce/ecommerceCourier.api';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import { fetchZonasByCourierPrivado } from '@/services/courier/zonaTarifaria/zonaTarifaria.api';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';

// DTO local para creación/edición (lo que realmente envía el frontend al backend)
type CreatePedidoDto = {
  codigo_pedido?: string;
  ecommerce_id?: number;           // backend lo resuelve por token
  courier_id?: number;             // opcional: si viene -> estado "Asignado"
  nombre_cliente: string;
  numero_cliente?: string;
  celular_cliente: string;
  direccion_envio: string;
  referencia_direccion?: string;
  distrito: string;
  monto_recaudar: number;
  fecha_entrega_programada: string; // ISO
  detalles: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
  }>;
};

interface CrearPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPedidoCreado: () => void;
  pedidoId?: number;
  modo?: 'crear' | 'editar' | 'ver';
}

export default function CrearPedidoModal({
  isOpen,
  onClose,
  onPedidoCreado,
  pedidoId,
  modo = 'crear',
}: CrearPedidoModalProps) {
  const { token, user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [couriers, setCouriers] = useState<CourierAsociado[]>([]);
  const [zonas, setZonas] = useState<{ distrito: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    courier_id: '',
    nombre_cliente: '',
    numero_cliente: '',
    celular_cliente: '',
    direccion_envio: '',
    referencia_direccion: '',
    distrito: '',
    monto_recaudar: '',
    fecha_entrega_programada: '',
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
  });

  const isReadOnly = modo === 'ver';

  const handleClickOutside = (e: MouseEvent) => {
    if (submitting) return; // 🚫 no cerrar mientras se envía
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !submitting) onClose(); // 🚫 no cerrar mientras se envía
  };

  // Fetch productos y couriers al abrir modal
  useEffect(() => {
    if (!isOpen || !token) return;
    fetchProductos(token).then(setProductos).catch(console.error);
    fetchCouriersAsociados(token).then(setCouriers).catch(console.error);
  }, [isOpen, token]);

  // Click fuera + escape
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, submitting]);

  // Zonas tarifarias por courier seleccionado (privadas)
  useEffect(() => {
    if (form.courier_id && token) {
      fetchZonasByCourierPrivado(Number(form.courier_id), token)
        .then((response) => {
          if ('data' in response) {
            setZonas(response.data.map((zona) => ({ distrito: zona.distrito })));
          } else {
            setZonas([]);
          }
        })
        .catch((err) => {
          console.error('Error al obtener zonas tarifarias privadas:', err);
          setZonas([]);
        });
    } else {
      setZonas([]);
    }
  }, [form.courier_id, token]);

  // Cargar datos del pedido si se edita o visualiza
  useEffect(() => {
    const loadPedido = async () => {
      if (pedidoId && token) {
        try {
          const data: any = await fetchPedidoById(pedidoId, token);
          const detalle = data.detalles?.[0] || {};
          setForm({
            courier_id: String(data.courier?.id ?? ''),
            nombre_cliente: data.nombre_cliente ?? '',
            numero_cliente: data.numero_cliente ?? '',
            celular_cliente: data.celular_cliente ?? '',
            direccion_envio: data.direccion_envio ?? '',
            referencia_direccion: data.referencia_direccion ?? '',
            distrito: data.distrito ?? '',
            monto_recaudar: String(data.monto_recaudar ?? ''),
            fecha_entrega_programada: data.fecha_entrega_programada
              ? new Date(data.fecha_entrega_programada).toISOString().slice(0, 10)
              : '',
            producto_id: String(detalle.producto_id ?? ''),
            cantidad: String(detalle.cantidad ?? ''),
            precio_unitario: String(detalle.precio_unitario ?? ''),
          });
        } catch (err) {
          console.error('Error cargando pedido:', err);
        }
      }
    };
    if (modo !== 'crear') loadPedido();
  }, [pedidoId, token, modo]);

  // Actualizar precio unitario al seleccionar producto
  useEffect(() => {
    const selected = productos.find((p) => p.id === Number(form.producto_id));
    if (selected) {
      setForm((prev) => ({
        ...prev,
        precio_unitario: String(selected.precio ?? ''),
      }));
    }
  }, [form.producto_id, productos]);

  // Calcular monto automáticamente
  useEffect(() => {
    const cantidad = Number(form.cantidad);
    const precio = Number(form.precio_unitario);
    if (!isNaN(cantidad) && !isNaN(precio)) {
      const total = cantidad * precio;
      setForm((prev) => ({ ...prev, monto_recaudar: String(total) }));
    }
  }, [form.cantidad, form.precio_unitario]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!token || !user) return;
    if (submitting) return; // ⛔️ evita clics repetidos

    // Validaciones mínimas
    const courierId = Number(form.courier_id); // opcional
    const productoId = Number(form.producto_id);
    const cantidad = Number(form.cantidad);
    const precioUnitario = Number(form.precio_unitario);
    const montoRecaudar = Number(form.monto_recaudar);

    if (!productoId || !cantidad || !precioUnitario) {
      console.error('Faltan datos obligatorios del pedido (producto/cantidad/precio)');
      return;
    }

    // Normalizar fecha a ISO (solo fecha sin hora -> 00:00 local)
    const fechaISO = form.fecha_entrega_programada
      ? new Date(form.fecha_entrega_programada + 'T00:00:00').toISOString()
      : new Date().toISOString();

    const payload: CreatePedidoDto = {
      codigo_pedido: `PED-${Date.now()}`,
      courier_id: Number.isNaN(courierId) ? undefined : courierId,
      nombre_cliente: form.nombre_cliente.trim(),
      numero_cliente: (form.numero_cliente ?? '').trim(),
      celular_cliente: form.celular_cliente.trim(),
      direccion_envio: form.direccion_envio.trim(),
      referencia_direccion: (form.referencia_direccion ?? '').trim(),
      distrito: form.distrito,
      monto_recaudar: isNaN(montoRecaudar) ? cantidad * precioUnitario : montoRecaudar,
      fecha_entrega_programada: fechaISO,
      detalles: [
        {
          producto_id: productoId,
          cantidad,
          precio_unitario: precioUnitario,
        },
      ],
    };

    setSubmitting(true);
    try {
      await crearPedido(payload as unknown as Partial<any>, token);
      onPedidoCreado();
      onClose();
    } catch (err) {
      console.error('Error creando/actualizando pedido:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 bg-opacity-40 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right"
        aria-busy={submitting} // accesibilidad
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700">
            <BsBoxSeam className="text-primary text-2xl" />
            {modo === 'ver'
              ? 'DETALLES DEL PEDIDO'
              : modo === 'editar'
              ? 'EDITAR PEDIDO'
              : 'REGISTRAR NUEVO PEDIDO'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={submitting} // no cerrar mientras se envía
            aria-disabled={submitting}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Complete los datos del cliente, el producto y la información de entrega para{' '}
          {modo === 'crear'
            ? 'registrar un nuevo pedido'
            : modo === 'editar'
            ? 'editar el pedido'
            : 'visualizar el pedido'}
          .
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Courier</label>
            <select
              name="courier_id"
              disabled={isReadOnly || submitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
              value={form.courier_id}
            >
              <option value="">Seleccionar courier</option>
              {couriers.length === 0 && (
                <option disabled value="">
                  No hay couriers asociados
                </option>
              )}
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.nombre_comercial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              name="nombre_cliente"
              value={form.nombre_cliente}
              disabled={isReadOnly || submitting}
              placeholder="Ejem. Alvaro"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <span className="px-3 py-2 text-sm bg-gray-100 text-gray-700">+51</span>
              <input
                type="text"
                name="celular_cliente"
                value={form.celular_cliente}
                disabled={isReadOnly || submitting}
                placeholder="987654321"
                className="flex-1 px-3 py-2 text-sm outline-none"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
            <select
              name="distrito"
              disabled={isReadOnly || submitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
              value={form.distrito}
            >
              <option value="">Seleccionar Distrito</option>
              {zonas.map((zona, idx) => (
                <option key={idx} value={zona.distrito}>
                  {zona.distrito}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              name="direccion_envio"
              value={form.direccion_envio}
              disabled={isReadOnly || submitting}
              placeholder="Av. Grau J 499"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
            <input
              name="referencia_direccion"
              value={form.referencia_direccion}
              disabled={isReadOnly || submitting}
              placeholder="Al lado del supermercado UNO"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select
              name="producto_id"
              disabled={isReadOnly || submitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={(e) => {
                handleChange(e);
                const selected = productos.find((p) => p.id === Number(e.target.value));
                if (selected) {
                  setForm((prev) => ({
                    ...prev,
                    precio_unitario: String(selected.precio ?? ''),
                    cantidad: '',
                    monto_recaudar: '',
                  }));
                }
              }}
              value={form.producto_id}
            >
              <option value="">Seleccionar producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_producto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad{' '}
              {form.producto_id && (
                <span className="text-xs text-gray-500">
                  /{productos.find((p) => p.id === Number(form.producto_id))?.stock ?? 0} disponibles
                </span>
              )}
            </label>
            <input
              name="cantidad"
              value={form.cantidad}
              disabled={isReadOnly || submitting}
              placeholder="50"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={(e) => {
                handleChange(e);
                const cantidad = Number(e.target.value);
                const precio = Number(form.precio_unitario);
                if (!isNaN(cantidad) && !isNaN(precio)) {
                  setForm((prev) => ({
                    ...prev,
                    monto_recaudar: String(cantidad * precio),
                  }));
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <input
              name="monto_recaudar"
              value={form.monto_recaudar}
              disabled={isReadOnly || submitting}
              placeholder="S/. 00.00"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
            />
            {form.precio_unitario && (
              <p className="text-xs text-gray-500 mt-1">Precio unitario: S/. {form.precio_unitario}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
            <input
              type="date"
              name="fecha_entrega_programada"
              value={form.fecha_entrega_programada}
              disabled={isReadOnly || submitting}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              onChange={handleChange}
            />
          </div>
        </div>

        {modo !== 'ver' && (
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-60 inline-flex items-center gap-2"
              disabled={submitting}
            >
              {submitting && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              )}
              {modo === 'editar' ? (submitting ? 'Guardando…' : 'Guardar cambios') : (submitting ? 'Creando…' : 'Crear nuevo')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
