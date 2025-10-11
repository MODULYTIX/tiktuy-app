import { useEffect, useRef, useState } from 'react';
import { crearPedido, fetchPedidoById } from '@/services/ecommerce/pedidos/pedidos.api';
import { useAuth } from '@/auth/context/AuthContext';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import { fetchCouriersAsociados } from '@/services/ecommerce/ecommerceCourier.api';
import { fetchZonasByCourierPrivado } from '@/services/courier/zonaTarifaria/zonaTarifaria.api';
import { Selectx } from '@/shared/common/Selectx';
import { Inputx, InputxPhone, InputxNumber } from '@/shared/common/Inputx';
import Tittlex from '@/shared/common/Tittlex';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';
import type { Producto } from '@/services/courier/producto/productoCourier.type';

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
        className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto animate-slide-in-right flex flex-col gap-5"
        aria-busy={submitting} // accesibilidad
      >
        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="REGISTRAR NUEVO PEDIDO"
          description="Complete los datos del cliente, el producto y la información de entrega para registrar un nuevo pedido en el sistema."
        />

        <div className="flex flex-col gap-5 h-full">
          <div className='flex flex-row gap-5 w-full'>
            <Selectx
              label="Courier"
              name="courier_id"
              value={form.courier_id}
              onChange={handleChange}
              labelVariant="left"
              placeholder="Seleccionar Courier"
            >
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.nombre_comercial}
                </option>
              ))}
            </Selectx>

            <Inputx
              label="Nombre"
              name="nombre_cliente"
              value={form.nombre_cliente}
              onChange={handleChange}
              placeholder="Ejem. Alvaro"
            />
          </div>

          <div className='flex flex-row gap-5 w-full'>
            <InputxPhone
              label="Teléfono"
              countryCode="+51"
              name="celular_cliente"
              value={form.celular_cliente}
              onChange={handleChange}
              placeholder="987654321"
            />

            <Selectx
              label="Distrito"
              name="distrito"
              value={form.distrito}
              onChange={handleChange}
              labelVariant="left"
              placeholder="Seleccionar Distrito"
            >
              {zonas.map((zona, idx) => (
                <option key={idx} value={zona.distrito}>
                  {zona.distrito}
                </option>
              ))}
            </Selectx>
          </div>

          <Inputx
            label="Dirección"
            name="direccion_envio"
            value={form.direccion_envio}
            onChange={handleChange}
            placeholder="Av. Grau J 499"
          />

          <Inputx
            label="Referencia"
            name="referencia_direccion"
            value={form.referencia_direccion}
            onChange={handleChange}
            placeholder="Al lado del supermercado UNO"
          />

          <div className='flex flex-row gap-5 w-full'>
            <Selectx
              label="Producto"
              name="producto_id"
              value={form.producto_id}
              onChange={handleChange}
              labelVariant="left"
              placeholder="Seleccionar Producto"
            >
              <option value="">Seleccionar producto</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre_producto}
                </option>
              ))}
            </Selectx>

            <InputxNumber
              label="Cantidad"
              name="cantidad"
              value={form.cantidad}
              onChange={handleChange}
              placeholder="50"
            />
          </div>

          <div className='flex flex-row gap-5 w-full'>
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
              value={form.fecha_entrega_programada}
              onChange={handleChange}
              type="date"
            />
          </div>
        </div>

        <div className="flex justify-start gap-5 items-end">
          <button onClick={handleSubmit} className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50" disabled={submitting}>
            Cancelar
          </button>
        </div>
        
      </div>
    </div>
  );
}
