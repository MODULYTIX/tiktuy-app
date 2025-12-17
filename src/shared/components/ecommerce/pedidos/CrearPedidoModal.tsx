import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

import {
  crearPedido,
  fetchProductosPorSede,
  fetchZonasTarifariasPorSede,
} from "@/services/ecommerce/pedidos/pedidos.api";

import { useAuth } from "@/auth/context/AuthContext";
import { fetchSedesEcommerceCourierAsociados } from "@/services/ecommerce/ecommerceCourier.api";

import { Selectx } from "@/shared/common/Selectx";
import { Inputx, InputxPhone, InputxNumber } from "@/shared/common/Inputx";
import Tittlex from "@/shared/common/Tittlex";

import type {
  ZonaTarifariaSede,
  CrearPedidoDTO,
} from "@/services/ecommerce/pedidos/pedidos.types";

/* ===================== TIPOS ===================== */
type ProductoUI = {
  id: number;
  nombre_producto: string;
  precio: number;
  stock: number;
};

type DetalleUI = {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
};

/* ===================== COMPONENTE ===================== */
export default function CrearPedidoModal({
  isOpen,
  onClose,
  onPedidoCreado,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPedidoCreado: () => void;
}) {
  const { token } = useAuth();

  const [sedes, setSedes] = useState<any[]>([]);
  const [productos, setProductos] = useState<ProductoUI[]>([]);
  const [zonas, setZonas] = useState<ZonaTarifariaSede[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);

  const [distritoSeleccionado, setDistritoSeleccionado] = useState("");
  const [zonaSeleccionada, setZonaSeleccionada] = useState("");

  const [detalles, setDetalles] = useState<DetalleUI[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sede_id: "",
    nombre_cliente: "",
    numero_cliente: "",
    celular_cliente: "",
    direccion_envio: "",
    referencia_direccion: "",
    producto_id: "",
    cantidad: "",
    precio_unitario: "",
    stock_max: "",
    fecha_entrega_programada: "", // 👈 FECHA ÚNICA DEL PEDIDO
  });

  /* ===================== CARGAS ===================== */
  useEffect(() => {
    if (!isOpen || !token) return;
    fetchSedesEcommerceCourierAsociados(token).then(setSedes);
  }, [isOpen, token]);

  useEffect(() => {
    if (!form.sede_id || !token) return;

    fetchProductosPorSede(Number(form.sede_id), token).then(setProductos);

    fetchZonasTarifariasPorSede(Number(form.sede_id)).then((data) => {
      setZonas(data);
      setDistritos([...new Set(data.map((z) => z.distrito))]);
      setDistritoSeleccionado("");
      setZonaSeleccionada("");
    });
  }, [form.sede_id, token]);

  useEffect(() => {
    const prod = productos.find((p) => p.id === Number(form.producto_id));
    if (!prod) return;

    setForm((p) => ({
      ...p,
      precio_unitario: String(prod.precio),
      stock_max: String(prod.stock),
    }));
  }, [form.producto_id, productos]);

  const handleChange = (e: any) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* ===================== AGREGAR PRODUCTO ===================== */
  const handleAgregarProducto = () => {
    if (!form.producto_id || !form.cantidad) {
      alert("Seleccione producto y cantidad");
      return;
    }

    const prod = productos.find(
      (p) => p.id === Number(form.producto_id)
    );
    if (!prod) return;

    const cantidad = Number(form.cantidad);
    if (cantidad > prod.stock) {
      alert(`Stock insuficiente. Disponible: ${prod.stock}`);
      return;
    }

    setDetalles((prev) => [
      ...prev,
      {
        producto_id: prod.id,
        nombre: prod.nombre_producto,
        cantidad,
        precio_unitario: prod.precio,
      },
    ]);

    setForm((p) => ({
      ...p,
      producto_id: "",
      cantidad: "",
      precio_unitario: "",
      stock_max: "",
    }));
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const montoTotal = detalles.reduce(
    (s, d) => s + d.cantidad * d.precio_unitario,
    0
  );

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async () => {
    if (!detalles.length) {
      alert("Debe agregar al menos un producto");
      return;
    }

    if (!form.fecha_entrega_programada) {
      alert("Debe seleccionar la fecha de entrega");
      return;
    }

    const payload: CrearPedidoDTO = {
      codigo_pedido: `PED-${Date.now()}`,
      sede_id: Number(form.sede_id),
      zona_tarifaria_id: Number(zonaSeleccionada),
      nombre_cliente: form.nombre_cliente,
      numero_cliente: form.numero_cliente,
      celular_cliente: form.celular_cliente,
      direccion_envio: form.direccion_envio,
      referencia_direccion: form.referencia_direccion,
      distrito: distritoSeleccionado,
      monto_recaudar: montoTotal,
      fecha_entrega_programada: `${form.fecha_entrega_programada}T12:00:00.000Z`,
      detalles: detalles.map((d) => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
      })),
    };

    setSubmitting(true);
    try {
      await crearPedido(payload, token!);
      onPedidoCreado();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* ===================== UI ===================== */
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
      <div className="w-full max-w-xl h-full bg-white p-6 shadow-2xl overflow-y-auto flex flex-col gap-6">

        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="Registrar pedido"
          description="Un pedido puede tener varios productos y una sola fecha de entrega."
        />

        {/* SEDE */}
        <Selectx label="Sede" name="sede_id" value={form.sede_id} onChange={handleChange}>
          <option value="">Seleccionar opción</option>
          {sedes.map((s) => (
            <option key={s.sede_id} value={s.sede_id}>{s.nombre}</option>
          ))}
        </Selectx>

        {/* DISTRITO */}
        <Selectx
          label="Distrito"
          value={distritoSeleccionado}
          onChange={(e) => {
            const d = e.target.value;
            setDistritoSeleccionado(d);
            const zona = zonas.find((z) => z.distrito === d);
            setZonaSeleccionada(zona ? String(zona.id) : "");
          }}
        >
          <option value="">Seleccionar opción</option>
          {distritos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Selectx>

        {/* CLIENTE */}
        <Inputx label="Nombre cliente" name="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} />
        <InputxPhone label="Teléfono" name="celular_cliente" countryCode="+51" value={form.celular_cliente} onChange={handleChange} />
        <Inputx label="Dirección" name="direccion_envio" value={form.direccion_envio} onChange={handleChange} />
        <Inputx label="Referencia" name="referencia_direccion" value={form.referencia_direccion} onChange={handleChange} />

        {/* FECHA ENTREGA (ÚNICA) */}
        <Inputx
          type="date"
          label="Fecha de entrega"
          name="fecha_entrega_programada"
          value={form.fecha_entrega_programada}
          onChange={handleChange}
        />

        {/* PRODUCTO */}
        <div className="grid grid-cols-2 gap-4">
          <Selectx label="Producto" name="producto_id" value={form.producto_id} onChange={handleChange}>
            <option value="">Seleccionar</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre_producto}</option>
            ))}
          </Selectx>

          <InputxNumber
            label={`Cantidad (Stock ${form.stock_max || 0})`}
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
          />
        </div>

        <button
          onClick={handleAgregarProducto}
          className="border border-dashed rounded-lg py-2 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50"
        >
          <Icon icon="mdi:plus-circle-outline" />
          Agregar producto
        </button>

        {/* LISTA PRODUCTOS */}
        {detalles.length > 0 && (
          <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <Icon icon="mdi:cart-outline" />
              Productos agregados
            </div>

            {detalles.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{d.nombre} x {d.cantidad}</span>
                <button onClick={() => handleRemoveDetalle(i)}>
                  <Icon icon="mdi:delete-outline" className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:content-save-outline" />
            Guardar pedido (S/ {montoTotal.toFixed(2)})
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-gray-700 flex items-center gap-2"
          >
            <Icon icon="mdi:close" />
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
