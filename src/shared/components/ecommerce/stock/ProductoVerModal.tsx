// src/shared/components/ecommerce/stock/ProductoVerModal.tsx
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import { Icon } from "@iconify/react";

type Props = {
  open: boolean;
  onClose: () => void;
  data: Producto | null;
};

type EstadoId = "activo" | "inactivo" | "descontinuado";

function normalizarEstado(value: unknown): EstadoId | "" {
  if (!value) return "";
  if (typeof value === "string") {
    const k = value.toLowerCase().trim();
    if (k === "activo" || k === "inactivo" || k === "descontinuado") return k as EstadoId;
  }
  if (typeof value === "object" && value) {
    const v = value as any;
    if (typeof v.id === "string") return normalizarEstado(v.id);
    if (typeof v.nombre === "string") return normalizarEstado(v.nombre);
    if (typeof v.estado === "string") return normalizarEstado(v.estado);
  }
  return "";
}

const ESTADO_LABEL: Record<EstadoId, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  descontinuado: "Descontinuado",
};

export default function ProductoVerModal({ open, onClose, data }: Props) {
  if (!open || !data) return null;

  // Derivados para mostrar (solo lectura)
  const codigo = String((data as any).codigo_identificacion ?? "");
  const nombre = String((data as any).nombre_producto ?? "");
  const descripcion = String((data as any).descripcion ?? "");

  const categoriaId = String((data as any).categoria_id ?? "");
  // En crear/editar el label de categoría usa el nombre (no la descripción)
  const categoriaLabel = (data as any).categoria?.nombre ?? categoriaId;

  const almacenId = String((data as any).almacenamiento_id ?? "");
  const almacenLabel = (data as any).almacenamiento?.nombre_almacen ?? almacenId;

  const estadoId =
    normalizarEstado((data as any).estado?.nombre ?? (data as any).estado) || "";
  const estadoLabel = (estadoId ? ESTADO_LABEL[estadoId as EstadoId] : "") ?? "";

  const precioStr =
    (data as any).precio != null && !Number.isNaN(Number((data as any).precio))
      ? Number((data as any).precio).toFixed(2)
      : "";

  const stockStr =
    (data as any).stock != null && !Number.isNaN(Number((data as any).stock))
      ? String(Number((data as any).stock))
      : "";

  const stockMinStr =
    (data as any).stock_minimo != null && !Number.isNaN(Number((data as any).stock_minimo))
      ? String(Number((data as any).stock_minimo))
      : "";

  const pesoStr =
    (data as any).peso != null && !Number.isNaN(Number((data as any).peso))
      ? Number((data as any).peso).toFixed(3)
      : "";

  const fechaStr = (data as any).fecha_registro
    ? new Date((data as any).fecha_registro).toLocaleString("es-PE")
    : "";

  const imagenUrl: string | null = (data as any).imagen_url ?? null;

  const onVerImagen = () => {
    if (!imagenUrl) return;
    window.open(imagenUrl, "_blank", "noopener,noreferrer");
  };

  const onDescargarImagen = async () => {
    if (!imagenUrl) return;
    const a = document.createElement("a");
    a.href = imagenUrl;
    a.download = "imagen";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel (misma estética que crear/editar) */}
      <div className="w-full max-w-xl bg-white h-full flex flex-col gap-5 p-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="DETALLE DEL PRODUCTO"
          description="Consulta toda la información registrada de este producto, incluyendo sus datos básicos, ubicación en almacén, stock y condiciones asociadas."
        />

        {/* Body scrollable */}
        <div className="h-full flex flex-col gap-5">
          <div className="flex gap-5">
            <Inputx
              name="codigo_identificacion"
              label="Código"
              value={codigo}
              readOnly
              disabled
              type="text"
            />
            <Inputx
              name="nombre_producto"
              label="Nombre del Producto"
              value={nombre}
              readOnly
              disabled
              type="text"
            />
          </div>

          <InputxTextarea
            name="descripcion"
            label="Descripción"
            value={descripcion}
            readOnly
            disabled
            autoResize
            minRows={3}
            maxRows={8}
          />

          <div className="flex gap-5">
            <Inputx
              name="categoria"
              label="Categoría"
              value={categoriaLabel}
              readOnly
              disabled
              type="text"
            />
            <Inputx
              name="estado"
              label="Estado"
              value={estadoLabel}
              readOnly
              disabled
              type="text"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-base font-normal text-gray90 text-left">
              Imagen
            </label>

            <div className="flex items-center gap-3 flex-wrap">
              {imagenUrl ? (
                <>
                  <div className="w-12 h-12 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    <img
                      src={imagenUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-md bg-gray-900 text-white inline-flex items-center justify-center"
                    title="Descargar"
                    onClick={onDescargarImagen}
                  >
                    <Icon icon="tabler:download" className="text-lg" />
                  </button>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-md bg-gray-900 text-white inline-flex items-center justify-center"
                    title="Ver"
                    onClick={onVerImagen}
                  >
                    <Icon icon="tabler:eye" className="text-lg" />
                  </button>
                </>
              ) : (
                <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-[14px]">
                  <span className="opacity-60">📦</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-5">
            <InputxNumber
              label="Precio"
              name="precio"
              value={precioStr}
              readOnly
              disabled
              decimals={2}
              step={0.01}
              placeholder="0.00"
            />
            <InputxNumber
              label="Cantidad"
              name="stock"
              value={stockStr}
              readOnly
              disabled
              decimals={0}
              step={1}
              placeholder="0"
              inputMode="numeric"
            />
          </div>

          <div className="flex gap-5">
            <InputxNumber
              label="Stock Mínimo"
              name="stock_minimo"
              value={stockMinStr}
              readOnly
              disabled
              decimals={0}
              step={1}
              placeholder="0"
              inputMode="numeric"
            />
            <InputxNumber
              label="Peso (kg)"
              name="peso"
              value={pesoStr}
              readOnly
              disabled
              decimals={3}
              step={0.001}
              placeholder="0.000"
            />
          </div>

          <div className="flex gap-5">
            <Inputx
              name="almacen"
              label="Sede"
              value={almacenLabel}
              readOnly
              disabled
              type="text"
            />
            <Inputx
              name="fecha_registro"
              label="Fecha Registro"
              value={fechaStr}
              readOnly
              disabled
              type="text"
            />
          </div>
        </div>

        {/* Footer sticky (igual que crear/editar) */}
        <div className="flex items-center gap-5 justify-start">
          <Buttonx
            variant="tertiary"
            onClick={onClose}
            label="Cerrar"
            className="px-4 text-sm text-gray-600 bg-gray-200"
            type="button"
          />
        </div>
      </div>
    </div>
  );
}
