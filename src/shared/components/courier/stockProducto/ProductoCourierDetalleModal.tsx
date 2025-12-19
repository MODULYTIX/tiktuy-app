// src/shared/components/courier/producto/ProductoDetalleModal.tsx
import { useEffect, useState } from "react";
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import type { Producto } from "@/services/courier/producto/productoCourier.type";
import ImageUploadx from "@/shared/common/ImageUploadx";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
};

type EstadoId = "activo" | "inactivo" | "descontinuado";

function normalizarEstado(value: unknown): EstadoId | "" {
  if (!value) return "";
  if (typeof value === "string") {
    const k = value.toLowerCase().trim();
    if (k === "activo" || k === "inactivo" || k === "descontinuado") {
      return k as EstadoId;
    }
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

export default function ProductoDetalleModal({
  isOpen,
  onClose,
  producto,
}: Props) {
  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  if (!isOpen || !producto) return null;

  // Derivados (solo lectura), alineados al modal base
  const codigo = String(producto.codigo_identificacion ?? "");
  const nombre = String(producto.nombre_producto ?? "");
  const descripcion = String(producto.descripcion ?? "");

  const categoriaId = String(producto.categoria_id ?? "");
  const categoriaLabel =
    producto.categoria?.nombre ??
    producto.categoria?.descripcion ??
    categoriaId;

  const almacenId = String(producto.almacenamiento_id ?? "");
  const almacenLabel =
    producto.almacenamiento?.nombre_almacen ?? almacenId;

  const estadoId =
    normalizarEstado(
      producto.estado?.nombre ??
        (producto as any).estado ??
        producto.estado_id
    ) || "";
  const estadoLabel =
    (estadoId ? ESTADO_LABEL[estadoId as EstadoId] : "") ?? "";

  const precioStr =
    producto.precio != null && !Number.isNaN(Number(producto.precio))
      ? Number(producto.precio).toFixed(2)
      : "";

  const stockStr =
    producto.stock != null && !Number.isNaN(Number(producto.stock))
      ? String(Number(producto.stock))
      : "";

  const stockMinStr =
    producto.stock_minimo != null &&
    !Number.isNaN(Number(producto.stock_minimo))
      ? String(Number(producto.stock_minimo))
      : "";

  // Peso: backend lo guarda como decimal string (kg)
  const pesoStr =
    producto.peso != null && !Number.isNaN(Number(producto.peso))
      ? Number(producto.peso).toFixed(3)
      : "";

  const fechaStr = (producto as any).fecha_registro
    ? new Date((producto as any).fecha_registro).toLocaleString("es-PE")
    : "";

  const imagenUrl: string | null = (producto as any).imagen_url ?? null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel derecho (formato base) */}
      <div className="w-[460px] max-w-xl bg-white h-full flex flex-col gap-5 p-5">
        {/* Header: Tittlex variante modal */}
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="DETALLE DEL PRODUCTO"
          description="Consulta toda la información registrada de este producto, incluyendo sus datos básicos, ubicación en almacén, stock y condiciones asociadas."
        />

        {/* Body scrollable */}
        <div className="h-full flex flex-col gap-5 overflow-y-auto">
          {/* Código + Nombre */}
          <div className="flex flex-col md:flex-row gap-5">
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

          {/* Descripción */}
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

          {/* Categoría + Estado */}
          <div className="flex flex-col md:flex-row gap-5">
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

          {/* Imagen (solo lectura, modo view) */}
          <ImageUploadx
            label="Imagen"
            value={imagenUrl}
            mode="view"
            size="md"
            onView={(url) => {
              setPreviewSrc(url);
              setPreviewOpen(true);
            }}
          />

          {/* Precio / Cantidad */}
          <div className="flex flex-col md:flex-row gap-5">
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

          {/* Stock mínimo / Peso */}
          <div className="flex flex-col md:flex-row gap-5">
            <InputxNumber
              label="Stock mínimo"
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

          {/* Sede / Fecha registro (si existe) */}
          <div className="flex flex-col md:flex-row gap-5">
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

        {/* Footer */}
        <div className="flex items-center gap-5 justify-start">
          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cerrar"
          />
        </div>

        {/* Lightbox para imagen */}
        <ImagePreviewModalx
          open={previewOpen}
          src={previewSrc ?? ""}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewSrc(null);
          }}
        />
      </div>
    </div>
  );
}
