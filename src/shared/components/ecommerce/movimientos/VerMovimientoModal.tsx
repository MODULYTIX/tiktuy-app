// src/shared/components/ecommerce/movimientos/VerMovimientoModal.tsx
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import type { Producto } from "@/services/ecommerce/producto/producto.types";
import ImageUploadx from "@/shared/common/ImageUploadx";
import { useState } from "react";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

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

export default function VerMovimientoModal({ open, onClose, data }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  if (!open || !data) return null;

  // Derivados (solo lectura)
  const codigo = String((data as any).codigo_identificacion ?? "");
  const nombre = String((data as any).nombre_producto ?? "");
  const descripcion = String((data as any).descripcion ?? "");

  const categoriaId = String((data as any).categoria_id ?? "");
  const categoriaLabel = (data as any).categoria?.descripcion ?? categoriaId;

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

  const imagenUrl: string | null = (data as any).imagen_url ?? null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5">
        <Tittlex
          variant="modal"
          icon="mdi:eye-outline"
          title="DETALLE PARA MOVIMIENTO"
          description="Consulta los datos del producto antes de registrar el movimiento."
        />

        {/* Cuerpo (misma estructura que 'ver producto', solo lectura) */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
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

          <Inputx
            name="categoria"
            label="Categoría"
            value={categoriaLabel}
            readOnly
            disabled
            type="text"
          />

          <Inputx
            name="almacen"
            label="Almacén"
            value={almacenLabel}
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

          <div className="grid grid-cols-2 gap-5">
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

          <div className="grid grid-cols-2 gap-5">
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
          {/* Imagen (solo-lectura, usa el nuevo modo) */}
          <ImageUploadx
            label="Imagen"
            value={imagenUrl ?? null}
            mode="view"
            size="md"
            onView={(url) => {
              setPreviewSrc(url);
              setPreviewOpen(true);
            }}
          />

        </div>

        {/* Footer */}
        <div className="flex items-center gap-5">
          <Buttonx
            variant="outlined"
            onClick={onClose}
            label="Cerrar"
            className="px-4 text-sm border"
          />
        </div>
        {/* Lightbox */}
        <ImagePreviewModalx
          open={previewOpen}
          src={previewSrc ?? ""}
          onClose={() => { setPreviewOpen(false); setPreviewSrc(null); }}
        />
      </div>
    </div>
  );
}
