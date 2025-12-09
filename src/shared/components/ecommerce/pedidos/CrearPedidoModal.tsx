import { useEffect, useState, useMemo } from "react";
import {
  crearPedido,
  fetchPedidoById,
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

type ProductoUI = {
  id: number;
  nombre_producto: string;
  precio: number;
  stock: number;
};

/* ==================== PROPS TIPADAS ==================== */
interface CrearPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPedidoCreado: () => void;
  pedidoId?: number;
  modo?: "crear" | "editar" | "ver";
}

/* ==================== COMPONENTE ==================== */
export default function CrearPedidoModal({
  isOpen,
  onClose,
  onPedidoCreado,
  pedidoId,
  modo = "crear",
}: CrearPedidoModalProps) {
  const { token } = useAuth();

  const [productos, setProductos] = useState<ProductoUI[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);

  const [zonas, setZonas] = useState<ZonaTarifariaSede[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);

  const [distritoSeleccionado, setDistritoSeleccionado] = useState("");
  const [zonaSeleccionada, setZonaSeleccionada] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sede_id: "",
    nombre_cliente: "",
    numero_cliente: "",
    celular_cliente: "",
    direccion_envio: "",
    referencia_direccion: "",
    distrito: "",
    monto_recaudar: "",
    fecha_entrega_programada: "",
    producto_id: "",
    cantidad: "",
    precio_unitario: "",
    stock_max: "",
  });

  /* ==================== CARGAR SEDES ==================== */
  useEffect(() => {
    if (!isOpen || !token) return;

    (async () => {
      const sedesRaw = await fetchSedesEcommerceCourierAsociados(token);
      setSedes(sedesRaw);
    })();
  }, [isOpen, token]);

  /* ==================== CARGAR PRODUCTOS ==================== */
  useEffect(() => {
    if (!form.sede_id || !token) return;

    (async () => {
      const list = await fetchProductosPorSede(Number(form.sede_id), token);
      setProductos(
        list.map((p) => ({
          id: p.id,
          nombre_producto: p.nombre_producto,
          precio: p.precio,
          stock: p.stock,
        }))
      );
    })();
  }, [form.sede_id, token]);

  /* ==================== CARGAR ZONAS Y DISTRITOS ==================== */
  useEffect(() => {
    if (!form.sede_id) {
      setZonas([]);
      setDistritos([]);
      setDistritoSeleccionado("");
      setZonaSeleccionada("");
      return;
    }

    (async () => {
      try {
        const data = await fetchZonasTarifariasPorSede(Number(form.sede_id));

        setZonas(data);

        const unique = Array.from(new Set(data.map((z) => z.distrito)));
        setDistritos(unique);
      } catch (e) {
        console.error("❌ Error cargando zonas:", e);
        setZonas([]);
        setDistritos([]);
      }

      setDistritoSeleccionado("");
      setZonaSeleccionada("");
    })();
  }, [form.sede_id]);

  /* ==================== ZONAS FILTRADAS ==================== */
  const zonasFiltradas = useMemo(() => {
    if (!distritoSeleccionado) return [];
    return zonas.filter((z) => z.distrito === distritoSeleccionado);
  }, [distritoSeleccionado, zonas]);

  /* ==================== EDITAR PEDIDO ==================== */
  useEffect(() => {
    if (modo === "crear" || !pedidoId || !token) return;

    (async () => {
      const data = await fetchPedidoById(pedidoId, token);
      const detalle = data.detalles?.[0] || {};

      setForm({
        sede_id: String(data.sede_id),
        nombre_cliente: data.nombre_cliente,
        numero_cliente: data.numero_cliente ?? "",
        celular_cliente: data.celular_cliente,
        direccion_envio: data.direccion_envio,
        referencia_direccion: data.referencia_direccion ?? "",
        distrito: data.distrito,
        monto_recaudar: String(data.monto_recaudar),
        fecha_entrega_programada: data.fecha_entrega_programada
          ? data.fecha_entrega_programada.slice(0, 10)
          : "",
        producto_id: String(detalle.producto_id ?? ""),
        cantidad: String(detalle.cantidad ?? ""),
        precio_unitario: String(detalle.precio_unitario ?? ""),
        stock_max: "",
      });

      setDistritoSeleccionado(data.distrito);

      if (data.zona_tarifaria_id) {
        setZonaSeleccionada(String(data.zona_tarifaria_id));
      }
    })();
  }, [modo, pedidoId, token]);

  /* ==================== STOCK + MONTO ==================== */
  useEffect(() => {
    const prod = productos.find((p) => p.id === Number(form.producto_id));
    if (prod) {
      setForm((prev) => ({
        ...prev,
        precio_unitario: String(prod.precio),
        stock_max: String(prod.stock),
      }));
    }
  }, [form.producto_id, productos]);

  useEffect(() => {
    const total = Number(form.cantidad) * Number(form.precio_unitario);
    if (!isNaN(total)) {
      setForm((prev) => ({ ...prev, monto_recaudar: String(total) }));
    }
  }, [form.cantidad, form.precio_unitario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ==================== SUBMIT ==================== */
  const handleSubmit = async () => {
    if (submitting) return;

    if (!distritoSeleccionado) return alert("Debe seleccionar un distrito.");
    if (!zonaSeleccionada) return alert("Debe seleccionar una zona tarifaria.");

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
      monto_recaudar: Number(form.monto_recaudar),
      fecha_entrega_programada: form.fecha_entrega_programada
        ? `${form.fecha_entrega_programada}T12:00:00.000Z`
        : null,
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
      await crearPedido(payload, token!);
      onPedidoCreado();
      onClose();
    } catch (e) {
      console.error("❌ Error creando pedido:", e);
    } finally {
      setSubmitting(false);
    }
  };

  /* ==================== UI ==================== */
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex justify-end">
      <div className="w-full max-w-md h-full bg-white p-6 shadow-xl overflow-y-auto flex flex-col gap-5">

        <Tittlex
          variant="modal"
          icon="lsicon:shopping-cart-filled"
          title="REGISTRAR NUEVO PEDIDO"
          description="Complete los datos del cliente y el producto."
        />

        <div className="flex flex-col gap-5">

          {/* SEDE */}
          <Selectx
            label="Sede"
            name="sede_id"
            value={form.sede_id}
            onChange={(e) => {
              handleChange(e);
              setDistritoSeleccionado("");
              setZonaSeleccionada("");
            }}
          >
            <option value="">Seleccione una sede</option>
            {sedes.map((s) => (
              <option key={s.sede_id} value={s.sede_id}>
                {s.nombre}
              </option>
            ))}
          </Selectx>

          {/* DISTRITO */}
          <Selectx
            label="Distrito"
            value={distritoSeleccionado}
            onChange={(e) => {
              setDistritoSeleccionado(e.target.value);
              setZonaSeleccionada("");
            }}
            disabled={distritos.length === 0}
          >
            <option value="">Seleccione distrito</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Selectx>

          {/* ZONA TARIFARIA */}
          {distritoSeleccionado && (
            <Selectx
              label="Zona Tarifaria"
              value={zonaSeleccionada}
              onChange={(e) => setZonaSeleccionada(e.target.value)}
              disabled={zonasFiltradas.length === 0}
            >
              <option value="">Seleccione zona</option>
              {zonasFiltradas.map((z) => (
                <option key={z.id} value={String(z.id)}>
                  {`${z.zona_tarifario} (S/ ${z.tarifa_cliente})`}
                </option>
              ))}
            </Selectx>
          )}

          {/* CLIENTE */}
          <Inputx
            label="Nombre"
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

          {/* PRODUCTO */}
          <div className="flex gap-5">
            <Selectx
              label="Producto"
              name="producto_id"
              value={form.producto_id}
              onChange={handleChange}
            >
              <option value="">Seleccione</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_producto}
                </option>
              ))}
            </Selectx>

            <InputxNumber
              label={`Cantidad (Stock: ${form.stock_max || 0})`}
              name="cantidad"
              value={form.cantidad}
              onChange={handleChange}
            />
          </div>

          {/* MONTO + FECHA */}
          <div className="flex gap-5">
            <InputxNumber
              label="Monto"
              name="monto_recaudar"
              value={form.monto_recaudar}
              onChange={handleChange}
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

        {/* BOTONES */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gray-900 text-white px-4 py-2 rounded"
          >
            {submitting ? "Guardando..." : "Guardar pedido"}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
