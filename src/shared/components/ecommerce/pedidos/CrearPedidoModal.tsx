import { useEffect, useRef, useState } from 'react';
import {
  crearPedido,
  fetchPedidoById,
} from '@/services/ecommerce/pedidos/pedidos.api';
import { useAuth } from '@/auth/context/AuthContext';

import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import { fetchSedesEcommerceCourierAsociados } from '@/services/ecommerce/ecommerceCourier.api';

import { Selectx } from '@/shared/common/Selectx';
import { Inputx, InputxPhone, InputxNumber } from '@/shared/common/Inputx';
import Tittlex from '@/shared/common/Tittlex';

/* ============================================================
 * Tipos
 * ============================================================ */
type ProductoUI = {
  id: number;
  nombre_producto: string;
  precio: number;
};

type CreatePedidoDto = {
  codigo_pedido?: string;
  sede_id?: number;
  nombre_cliente: string;
  numero_cliente?: string;
  celular_cliente: string;
  direccion_envio: string;
  referencia_direccion?: string;
  distrito: string; // ← se completa automáticamente
  monto_recaudar: number;
  fecha_entrega_programada: string;
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

/* ============================================================
 * COMPONENTE
 * ============================================================ */

export default function CrearPedidoModal({
  isOpen,
  onClose,
  onPedidoCreado,
  pedidoId,
  modo = 'crear',
}: CrearPedidoModalProps) {
  const { token, user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [productos, setProductos] = useState<ProductoUI[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sede_id: '',
    nombre_cliente: '',
    numero_cliente: '',
    celular_cliente: '',
    direccion_envio: '',
    referencia_direccion: '',
    distrito: '', // ← ahora se llena solo con ciudad
    monto_recaudar: '',
    fecha_entrega_programada: '',
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
  });

  /* ================= CLICK FUERA ================= */
  const handleClickOutside = (e: MouseEvent) => {
    if (!submitting && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !submitting) onClose();
  };

  /* ==================== CARGAR PRODUCTOS Y SEDES ==================== */
  useEffect(() => {
    if (!isOpen || !token) return;

    (async () => {
      try {
        const [prodsRaw, sedesRaw] = await Promise.all([
          fetchProductos(token),
          fetchSedesEcommerceCourierAsociados(token),
        ]);

        const listRaw = Array.isArray(prodsRaw)
          ? prodsRaw
          : Array.isArray((prodsRaw as any)?.data)
          ? (prodsRaw as any).data
          : [];

        const prodsUI: ProductoUI[] = listRaw.map((p: any) => ({
          id: Number(p.id),
          nombre_producto: p.nombre_producto || '',
          precio: Number(p.precio || 0),
        }));

        setProductos(prodsUI);
        setSedes(sedesRaw);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [isOpen, token]);

  /* ==================== LISTENERS ==================== */
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

  /* ============================================================
   * SETEAR DISTRITO AUTOMÁTICO SEGÚN LA SEDE
   * ============================================================ */
  useEffect(() => {
    if (!form.sede_id) return;

    const sede = sedes.find((s) => s.sede_id === Number(form.sede_id));
    if (sede) {
      setForm((prev) => ({
        ...prev,
        distrito: sede.ciudad ?? '',
      }));
    }
  }, [form.sede_id, sedes]);

  /* ==================== EDITAR PEDIDO ==================== */
  useEffect(() => {
    if (modo === 'crear' || !pedidoId || !token) return;

    (async () => {
      try {
        const data: any = await fetchPedidoById(pedidoId, token);
        const detalle = data.detalles?.[0] || {};

        setForm({
          sede_id: String(data.sede_id ?? ''),
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
      } catch (e) {
        console.error('Error cargando pedido:', e);
      }
    })();
  }, [modo, pedidoId, token]);

  /* ==================== AUTO PRECIO ==================== */
  useEffect(() => {
    const prod = productos.find((p) => p.id === Number(form.producto_id));
    if (prod) {
      setForm((prev) => ({ ...prev, precio_unitario: String(prod.precio) }));
    }
  }, [form.producto_id, productos]);

  /* ==================== AUTO MONTO ==================== */
  useEffect(() => {
    const c = Number(form.cantidad);
    const p = Number(form.precio_unitario);

    if (!isNaN(c) && !isNaN(p)) {
      setForm((prev) => ({ ...prev, monto_recaudar: String(c * p) }));
    }
  }, [form.cantidad, form.precio_unitario]);

  const handleChange = (e: any) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ==================== SUBMIT ==================== */
  const handleSubmit = async () => {
    if (submitting || !token || !user) return;

    const sedeId = Number(form.sede_id);

    if (!sedeId) return console.error('Debe seleccionar sede');

    const payload: CreatePedidoDto = {
      codigo_pedido: `PED-${Date.now()}`,
      sede_id: sedeId,
      nombre_cliente: form.nombre_cliente,
      numero_cliente: form.numero_cliente,
      celular_cliente: form.celular_cliente,
      direccion_envio: form.direccion_envio,
      referencia_direccion: form.referencia_direccion,
      distrito: form.distrito, // ← viene automático
      monto_recaudar: Number(form.monto_recaudar),
      fecha_entrega_programada: `${form.fecha_entrega_programada}T12:00:00.000Z`,

    
      detalles: [
        {
          producto_id: Number(form.producto_id),
          cantidad: Number(form.cantidad),
          precio_unitario: Number(form.precio_unitario),
        },
      ],
    };

    setSubmitting(true);

    try {
      await crearPedido(payload as any, token);
      onPedidoCreado();
      onClose();
    } catch (e) {
      console.error('Error creando pedido', e);
    } finally {
      setSubmitting(false);
    }
  };

  /* ==================== RENDER ==================== */
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md h-full bg-white p-6 shadow-xl overflow-y-auto animate-slide-in-right flex flex-col gap-5"
      >
        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="REGISTRAR NUEVO PEDIDO"
          description="Complete los datos del cliente y el producto."
        />

        <div className="flex flex-col gap-5">
          {/* ====================== SEDE ====================== */}
          <Selectx
            label="Sede"
            name="sede_id"
            value={form.sede_id}
            onChange={handleChange}
            labelVariant="left"
            placeholder="Seleccionar Sede"
          >
            {sedes.map((s) => (
              <option key={s.sede_id} value={s.sede_id}>
                {s.nombre}
              </option>
            ))}
          </Selectx>

          {/* ====================== NOMBRE ====================== */}
          <Inputx
            label="Nombre"
            name="nombre_cliente"
            value={form.nombre_cliente}
            onChange={handleChange}
            placeholder="Ejem. Alvaro"
          />

          {/* ====================== TELÉFONO ====================== */}
          <InputxPhone
            label="Teléfono"
            name="celular_cliente"
            countryCode="+51"
            value={form.celular_cliente}
            onChange={handleChange}
            placeholder="987654321"
          />

          {/* ====================== DIRECCIÓN ====================== */}
          <Inputx
            label="Dirección"
            name="direccion_envio"
            value={form.direccion_envio}
            onChange={handleChange}
            placeholder="Av. Grau J 499"
          />

          {/* ====================== REFERENCIA ====================== */}
          <Inputx
            label="Referencia"
            name="referencia_direccion"
            value={form.referencia_direccion}
            onChange={handleChange}
            placeholder="Al lado del supermercado UNO"
          />

          {/* ====================== PRODUCTO + CANTIDAD ====================== */}
          <div className="flex gap-5">
            <Selectx
              label="Producto"
              name="producto_id"
              value={form.producto_id}
              onChange={handleChange}
              labelVariant="left"
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
              placeholder="50"
            />
          </div>

          {/* ====================== MONTO + FECHA ====================== */}
          <div className="flex gap-5">
            <InputxNumber
              label="Monto"
              name="monto_recaudar"
              value={form.monto_recaudar}
              onChange={handleChange}
              placeholder="0"
            />

            <Inputx
              type="date"
              label="Fecha Entrega"
              name="fecha_entrega_programada"
              value={form.fecha_entrega_programada}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ====================== ACCIONES ====================== */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gray-900 text-white px-4 py-2 rounded"
          >
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
