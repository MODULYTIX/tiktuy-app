// src/shared/components/ecommerce/movimientos/CrearMovimientoModal.tsx
import { useEffect, useMemo, useState } from "react";
import { registrarMovimiento, fetchAlmacenesEcommerCourier } from "@/services/ecommerce/almacenamiento/almacenamiento.api";
import { useAuth } from "@/auth/context";
import type { Almacenamiento } from "@/services/ecommerce/almacenamiento/almacenamiento.types";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import { useNotification } from "@/shared/context/notificacionesDeskop/useNotification";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";
import { InputxTextarea } from "@/shared/common/Inputx";

interface Props {
  open: boolean;
  onClose: () => void;
  productos: Producto[]; 
}

export default function CrearMovimientoModal({
  open,
  onClose,
  productos,
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();
  const [almacenes, setAlmacenes] = useState<{
    ecommerce: Almacenamiento[];
    courier: Almacenamiento[];
  }>({
    ecommerce: [],
    courier: [],
  });

  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [almacenOrigen, setAlmacenOrigen] = useState("");
  const [almacenDestino, setAlmacenDestino] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !token) return;

    fetchAlmacenesEcommerCourier(token)
      .then(setAlmacenes)
      .catch(console.error);

    setCantidades({});
    setDescripcion("");
    setAlmacenDestino("");
    setAlmacenOrigen("");
  }, [open, token]);

  
const productosSeleccionados = productos;


  const origenInferido = useMemo(() => {
    const ids = productosSeleccionados
      .map((p) => (p.almacenamiento_id != null ? String(p.almacenamiento_id) : ""))
      .filter(Boolean);

    if (!ids.length) return "";
    const first = ids[0];
    return ids.every((id) => id === first) ? first : "";
  }, [productosSeleccionados]);

  useEffect(() => {
    if (origenInferido) {
      setAlmacenOrigen(origenInferido);
      setAlmacenDestino((d) => (d === origenInferido ? "" : d));
    }
  }, [origenInferido]);

  const sedesOrigen = useMemo(() => {
    return [...almacenes.ecommerce, ...almacenes.courier];
  }, [almacenes]);

  const sedeOrigenObj = useMemo(() => {
    return sedesOrigen.find(
      (s) => String(s.id) === String(almacenOrigen)
    );
  }, [sedesOrigen, almacenOrigen]);

  const sedesDestino = useMemo(() => {
    if (!sedeOrigenObj) return [];

    // Origen courier → destino ecommerce
    if (sedeOrigenObj.courier_id) {
      return almacenes.ecommerce;
    }

    // Origen ecommerce → destino courier
    if (sedeOrigenObj.ecommerce_id) {
      return almacenes.courier;
    }

    return [];
  }, [sedeOrigenObj, almacenes]);

  useEffect(() => {
    setAlmacenDestino("");
  }, [almacenOrigen]);

  const handleCantidadChange = (uuid: string, value: number, stock: number) => {
    const safe = Math.min(Math.max(0, Math.trunc(value || 0)), stock);
    setCantidades((prev) => ({ ...prev, [uuid]: safe }));
  };

  const validarAntesDeEnviar = () => {
    if (!origenInferido) {
      notify("Todos los productos deben pertenecer a la misma sede de origen.", "error");
      return false;
    }
    if (!almacenOrigen || !almacenDestino || almacenOrigen === almacenDestino) {
      notify("Selecciona sedes válidas (origen y destino distintos).", "error");
      return false;
    }

    const prods = productosSeleccionados.filter((p) => (cantidades[p.uuid] ?? 0) > 0);
    if (!prods.length) {
      notify("Debes ingresar al menos una cantidad válida.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validarAntesDeEnviar()) return;

    const productosMov = productosSeleccionados
      .filter((p) => (cantidades[p.uuid] ?? 0) > 0)
      .map((p) => ({
        producto_id: p.id,
        cantidad: cantidades[p.uuid],
      }));

    setLoading(true);
    try {
      await registrarMovimiento(
        {
          almacen_origen_id: Number(almacenOrigen),
          almacen_destino_id: Number(almacenDestino),
          descripcion,
          productos: productosMov,
        },
        token!
      );

      notify("Movimiento registrado correctamente.", "success");
      onClose();
    } catch (e) {
      console.error(e);
      notify("Error al registrar el movimiento.", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderSedeLabel = (s: Almacenamiento) => {
    const rep = s.representante
      ? ` — ${s.representante.nombres} ${s.representante.apellidos}`
      : "";
    const tag =
      s.entidad?.tipo === "ecommerce"
        ? " [ECOM]"
        : s.entidad?.tipo === "courier"
          ? " [COURIER]"
          : "";
    return `${s.nombre_almacen}${rep}${tag}`;
  };

  if (!open) return null;

  return (
    <div
      // ✅ clave: altura fija + NO scroll en el modal
      className="h-[92vh] max-h-[92vh] w-[700px] bg-white shadow-xl flex flex-col px-5 py-5 overflow-hidden min-h-0 gap-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="shrink-0">
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="REGISTRAR NUEVO MOVIMIENTO"
          description="Selecciona productos y completa los datos para registrar un movimiento."
        />
      </div>

      {/* ✅ TABLA: ocupa TODO lo posible (flex-1) */}
      <div className="flex-1 min-h-0 rounded-md border border-gray-200 bg-white flex flex-col overflow-hidden">
        {/* header fijo */}
        <table className="min-w-full table-fixed text-[12px]">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[28%]" />
            <col className="w-[34%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-[#E5E7EB]">
            <tr className="text-gray-700 font-roboto font-medium">
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-center">Cantidad</th>
            </tr>
          </thead>
        </table>

        {/* ✅ SOLO aquí hay scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="min-w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[28%]" />
              <col className="w-[34%]" />
              <col className="w-[20%]" />
            </colgroup>
            <tbody className="divide-y divide-gray-100">
              {productosSeleccionados.map((p) => (
                <tr key={p.uuid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-gray-900 whitespace-nowrap">
                    {p.codigo_identificacion}
                  </td>

                  <td className="px-4 py-4 text-gray-900">
                    <span className="line-clamp-1">{p.nombre_producto ?? "—"}</span>
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    <span className="line-clamp-1">{p.descripcion ?? "—"}</span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={p.stock}
                        value={Number.isFinite(cantidades[p.uuid]) ? cantidades[p.uuid] : ""}
                        onChange={(e) =>
                          handleCantidadChange(p.uuid, Number(e.target.value), p.stock)
                        }
                        className="w-[64px] h-9 rounded-lg border border-gray-300 px-2 text-center text-sm"
                      />
                      <span className="text-sm text-gray-600">/ {p.stock}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {productosSeleccionados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                    No hay productos seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ SIEMPRE visibles: SIN scroll */}
      <div className="shrink-0 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-5">
          <Selectx
            label="Sede Origen"
            name="almacen_origen"
            labelVariant="left"
            value={almacenOrigen ?? ""}
            onChange={(e) => setAlmacenOrigen(e.target.value)}
            placeholder="Seleccionar sede"
          >
            <option value="">Seleccionar sede</option>
            {sedesOrigen.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {renderSedeLabel(s)}
              </option>
            ))}
          </Selectx>

          <Selectx
            label="Sede Destino"
            name="almacen_destino"
            labelVariant="left"
            value={almacenDestino ?? ""}
            onChange={(e) => setAlmacenDestino(e.target.value)}
            placeholder="Seleccionar sede"
          >
            <option value="">Seleccionar sede</option>
            {sedesDestino.length === 0 ? (
              <option value="" disabled>
                {almacenOrigen
                  ? "No hay sedes asociadas del courier distintas del origen."
                  : "No hay sedes asociadas disponibles."}
              </option>
            ) : (
              sedesDestino.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {renderSedeLabel(s)}
                </option>
              ))
            )}
          </Selectx>
        </div>

        <InputxTextarea
          name="descripcion"
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Motivo del movimiento..."
          autoResize
          minRows={2}   // ✅ más compacto para pantallas bajas
          maxRows={6}
        />
      </div>

      {/* Footer: SIEMPRE visible */}
      <div className="shrink-0 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-5">
          <Buttonx
            variant="quartery"
            disabled={
              loading ||
              !origenInferido ||
              !almacenOrigen ||
              !almacenDestino ||
              almacenOrigen === almacenDestino
            }
            onClick={handleSubmit}
            label={loading ? "Registrando..." : "Crear nuevo"}
            icon={loading ? "line-md:loading-twotone-loop" : undefined}
            className={`px-4 text-sm ${loading ? "[&_svg]:animate-spin" : ""}`}
          />
          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm border"
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
