// src/shared/components/courier/producto/ProductoDetalleModal.tsx
import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { Inputx, InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import type { Producto } from "@/services/courier/producto/productoCourier.type";

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

  if (!isOpen || !producto) return null;

  // Derivados (solo lectura)
  const codigo = String(producto.codigo_identificacion ?? "");
  const nombre = String(producto.nombre_producto ?? "");
  const descripcion = String(producto.descripcion ?? "");

  const categoriaLabel =
    producto.categoria?.nombre ??
    producto.categoria?.descripcion ??
    String(producto.categoria_id ?? "");

  const almacenLabel =
    producto.almacenamiento?.nombre_almacen ??
    String(producto.almacenamiento_id ?? "");

  const estadoId =
    normalizarEstado(
      producto.estado?.nombre ??
        (producto as any).estado ??
        producto.estado_id
    ) || "";

  const estadoLabel = estadoId ? ESTADO_LABEL[estadoId as EstadoId] : "-";
  const estadoPill =
    estadoId === "activo"
      ? "bg-gray90 text-white"
      : "bg-gray30 text-gray80";

  const precioNum = !Number.isNaN(Number(producto.precio))
    ? Number(producto.precio)
    : NaN;
  const precioStr = !Number.isNaN(precioNum)
    ? precioNum.toFixed(2)
    : "";

  const stockNum = !Number.isNaN(Number(producto.stock))
    ? Number(producto.stock)
    : NaN;
  const stockStr = !Number.isNaN(stockNum) ? String(stockNum) : "";

  const stockMinNum = !Number.isNaN(Number(producto.stock_minimo))
    ? Number(producto.stock_minimo)
    : NaN;
  const stockMinStr = !Number.isNaN(stockMinNum)
    ? String(stockMinNum)
    : "";

  // Peso: backend lo guarda como Decimal string (ej: "0.45" kg)
  const pesoNum = !Number.isNaN(Number(producto.peso))
    ? Number(producto.peso)
    : NaN;
  const pesoGr =
    !Number.isNaN(pesoNum) && pesoNum !== 0
      ? Math.round(pesoNum * 1000)
      : null;
  const pesoDisplay =
    pesoGr != null ? `${pesoGr} gr.` : pesoNum ? `${pesoNum} kg` : "";

  const handleOverlayClick = () => onClose();
  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) =>
    e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div className="flex-1 bg-black/40" />

      {/* Panel derecho */}
      <div
        className="w-[520px] max-w-[96vw] bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5"
        onClick={handlePanelClick}
      >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Icon icon="vaadin:stock" width={22} height={22} />
              <h2 className="text-primary text-[20px] font-bold uppercase font-roboto">
                DETALLE DEL PRODUCTO
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[12px] whitespace-nowrap">
              <span className="text-gray60 leading-none">Estado :</span>
              <span
                className={[
                  "inline-flex items-center h-7 px-3 rounded-[10px] text-[12px] font-medium leading-none",
                  estadoPill,
                ].join(" ")}
                title={`Estado: ${estadoLabel || "-"}`}
              >
                {estadoLabel || "-"}
              </span>
            </div>
          </div>

          <p className="text-[12px] text-gray60 leading-relaxed">
            Consulta toda la información registrada de este producto, incluyendo sus
            datos básicos, ubicación en almacén, stock y condiciones asociadas.
          </p>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Código + Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          {/* Categoría */}
          <Inputx
            name="categoria"
            label="Categoría"
            value={categoriaLabel}
            readOnly
            disabled
            type="text"
          />

          {/* Almacén / Sede */}
          <Inputx
            name="almacen"
            label="Almacén / Sede"
            value={almacenLabel}
            readOnly
            disabled
            type="text"
          />

          {/* Precio / Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <Inputx
              label="Peso"
              name="peso"
              value={pesoDisplay}
              readOnly
              disabled
              type="text"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-5 justify-start">
          <Buttonx
            variant="outlined"
            onClick={onClose}
            label="Cerrar"
            className="px-4 text-sm border"
            type="button"
          />
        </div>
      </div>
    </div>
  );
}
