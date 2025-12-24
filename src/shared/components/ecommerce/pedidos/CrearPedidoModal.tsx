// src/shared/components/ecommerce/pedidos/CrearPedidoModal.tsx
import { useEffect, useMemo, useState } from "react";
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
import Buttonx from "@/shared/common/Buttonx";

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
    fecha_entrega_programada: "",
  });

  const montoTotal = useMemo(
    () => detalles.reduce((s, d) => s + d.cantidad * d.precio_unitario, 0),
    [detalles]
  );

  const canSubmit = useMemo(() => {
    if (!form.sede_id) return false;
    if (!distritoSeleccionado || !zonaSeleccionada) return false;
    if (!form.nombre_cliente.trim()) return false;
    if (!form.celular_cliente.trim()) return false;
    if (!form.direccion_envio.trim()) return false;
    if (!form.fecha_entrega_programada) return false;
    if (!detalles.length) return false;
    return true;
  }, [
    form.sede_id,
    form.nombre_cliente,
    form.celular_cliente,
    form.direccion_envio,
    form.fecha_entrega_programada,
    distritoSeleccionado,
    zonaSeleccionada,
    detalles.length,
  ]);

  const resetAll = () => {
    setForm({
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
      fecha_entrega_programada: "",
    });
    setProductos([]);
    setZonas([]);
    setDistritos([]);
    setDistritoSeleccionado("");
    setZonaSeleccionada("");
    setDetalles([]);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  /* ===================== CARGAS ===================== */
  useEffect(() => {
    if (!isOpen || !token) return;
    fetchSedesEcommerceCourierAsociados(token).then(setSedes).catch(console.error);
  }, [isOpen, token]);

  useEffect(() => {
    if (!form.sede_id || !token) return;

    fetchProductosPorSede(Number(form.sede_id), token)
      .then(setProductos)
      .catch(console.error);

    fetchZonasTarifariasPorSede(Number(form.sede_id))
      .then((data) => {
        setZonas(data);
        setDistritos([...new Set(data.map((z) => z.distrito))]);
        setDistritoSeleccionado("");
        setZonaSeleccionada("");
      })
      .catch(console.error);
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

  // Reset cuando se abre
  useEffect(() => {
    if (!isOpen) return;
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (e: any) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* ===================== AGREGAR PRODUCTO ===================== */
  const handleAgregarProducto = () => {
    if (!form.producto_id || !form.cantidad) return;

    const prod = productos.find((p) => p.id === Number(form.producto_id));
    if (!prod) return;

    const cantidad = Math.trunc(Number(form.cantidad));
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;

    const yaAgregado =
      detalles.find((d) => d.producto_id === prod.id)?.cantidad ?? 0;

    const stockDisponible = prod.stock - yaAgregado;
    if (cantidad > stockDisponible) return;

    setDetalles((prev) => {
      const idx = prev.findIndex((d) => d.producto_id === prod.id);

      if (idx === -1) {
        return [
          ...prev,
          {
            producto_id: prod.id,
            nombre: prod.nombre_producto,
            cantidad,
            precio_unitario: Number(form.precio_unitario) || prod.precio,
          },
        ];
      }

      const next = [...prev];
      next[idx] = {
        ...next[idx],
        cantidad: next[idx].cantidad + cantidad,
      };

      return next;
    });

    setForm((p) => ({
      ...p,
      producto_id: "",
      cantidad: "",
      precio_unitario: "",
      stock_max: "",
    }));
  };

  const handleRemoveDetalle = (productoId: number) => {
    setDetalles((prev) => prev.filter((d) => d.producto_id !== productoId));
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async () => {
    if (!token || submitting) return;
    if (!canSubmit) return;

    const payload: CrearPedidoDTO = {
      codigo_pedido: `PED-${Date.now()}`,
      sede_id: Number(form.sede_id),
      zona_tarifaria_id: Number(zonaSeleccionada),
      nombre_cliente: form.nombre_cliente.trim(),
      numero_cliente: form.numero_cliente?.trim() || "",
      celular_cliente: form.celular_cliente.trim(),
      direccion_envio: form.direccion_envio.trim(),
      referencia_direccion: form.referencia_direccion?.trim() || "",
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
      await crearPedido(payload, token);
      onPedidoCreado();
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* ===================== UI ===================== */
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex justify-end"
      onClick={handleClose}
    >
      <div
        className="h-full bg-white shadow-2xl flex flex-col w-[520px] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5">
          <Tittlex
            variant="modal"
            icon="lsicon:shopping-cart-filled"
            title="Registrar pedido"
            description="Un pedido puede tener varios productos y una sola fecha de entrega."
          />
        </div>

        {/* Body scroll */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-5">
          {/* SEDE */}
          <Selectx
            label="Sede"
            name="sede_id"
            labelVariant="left"
            value={form.sede_id}
            onChange={handleChange}
          >
            <option value="">Seleccionar opción</option>
            {sedes.map((s) => (
              <option key={s.sede_id} value={s.sede_id}>
                {s.nombre}
              </option>
            ))}
          </Selectx>

          {/* DISTRITO */}
          <Selectx
            label="Distrito"
            labelVariant="left"
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
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Selectx>

          {/* CLIENTE */}
          <Inputx
            label="Nombre cliente"
            name="nombre_cliente"
            value={form.nombre_cliente}
            onChange={handleChange}
          />
          <InputxPhone
            label="Teléfono"
            name="celular_cliente"
            countryCode="+51"
            value={form.celular_cliente}
            onChange={handleChange}
          />
          <Inputx
            label="Dirección"
            name="direccion_envio"
            value={form.direccion_envio}
            onChange={handleChange}
          />
          <Inputx
            label="Referencia"
            name="referencia_direccion"
            value={form.referencia_direccion}
            onChange={handleChange}
          />

          {/* FECHA ENTREGA */}
          <Inputx
            type="date"
            label="Fecha de entrega"
            name="fecha_entrega_programada"
            value={form.fecha_entrega_programada}
            onChange={handleChange}
          />

          {/* PRODUCTO */}
          <div className="flex gap-5">
            <Selectx
              label="Producto"
              name="producto_id"
              labelVariant="left"
              value={form.producto_id}
              onChange={handleChange}
            >
              <option value="">Seleccionar</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_producto}
                </option>
              ))}
            </Selectx>

            <div className="w-54">
              <InputxNumber
                label={`Cant. (Stock ${form.stock_max || 0})`}
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                min={1}
                step={1}
              />
            </div>

            <div className="w-38">
              <InputxNumber
                label="Precio"
                name="precio_unitario"
                value={form.precio_unitario}
                onChange={handleChange}
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAgregarProducto}
            disabled={!form.producto_id || !form.cantidad}
            className="border border-dashed rounded-lg py-2 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

              {detalles.map((d) => (
                <div
                  key={d.producto_id}
                  className="flex items-center justify-between text-sm gap-3"
                >
                  <span className="min-w-0 truncate">
                    {d.nombre} x {d.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDetalle(d.producto_id)}
                    title="Quitar"
                  >
                    <Icon icon="mdi:delete-outline" className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white p-5">
          <div className="flex gap-3">
            <Buttonx
              variant="tertiary"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              label={
                submitting
                  ? "Guardando…"
                  : `Guardar (S/ ${montoTotal.toFixed(2)})`
              }
              icon={
                submitting
                  ? "line-md:loading-twotone-loop"
                  : "mdi:content-save-outline"
              }
              className={`flex-1 ${submitting ? "[&_svg]:animate-spin" : ""}`}
            />
            <Buttonx
              variant="outlinedw"
              onClick={handleClose}
              disabled={submitting}
              label="Cancelar"
              icon="mdi:close"
              className="px-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
