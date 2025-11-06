// src/shared/components/courier/producto/ProductoDetalleModal.tsx
import { useEffect, useRef } from "react";
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

export default function ProductoDetalleModal({ isOpen, onClose, producto }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen || !producto) return null;

  // Derivados (solo lectura)
  const codigo = String((producto as any).codigo_identificacion ?? "");
  const nombre = String((producto as any).nombre_producto ?? "");
  const descripcion = String((producto as any).descripcion ?? "");

  const categoriaLabel =
    (producto as any).categoria?.nombre ??
    (producto as any).categoria?.descripcion ??
    String((producto as any).categoria_id ?? "");

  const almacenLabel =
    (producto as any).almacenamiento?.nombre_almacen ??
    String((producto as any).almacenamiento_id ?? "");

  const estadoId =
    normalizarEstado(
      (producto as any).estado?.nombre ??
      (producto as any).estado ??
      (producto as any).estado_id
    ) || "";

  const estadoLabel = estadoId ? ESTADO_LABEL[estadoId as EstadoId] : "-";
  const estadoPill =
    estadoId === "activo" ? "bg-gray90 text-white" : "bg-gray30 text-gray80";

  const precioStr =
    (producto as any).precio != null && !Number.isNaN(Number((producto as any).precio))
      ? Number((producto as any).precio).toFixed(2)
      : "";

  const stockStr =
    (producto as any).stock != null && !Number.isNaN(Number((producto as any).stock))
      ? String(Number((producto as any).stock))
      : "";

  const stockMinStr =
    (producto as any).stock_minimo != null && !Number.isNaN(Number((producto as any).stock_minimo))
      ? String(Number((producto as any).stock_minimo))
      : "";

  // Peso para mostrar como en el Figma (“450 gr.”)
  const pesoGr =
    (producto as any).peso_gr != null
      ? Number((producto as any).peso_gr)
      : (producto as any).peso != null
      ? Math.round(Number((producto as any).peso) * 1000)
      : null;
  const pesoDisplay = pesoGr != null && !Number.isNaN(pesoGr) ? `${pesoGr} gr.` : "";

  return (
    <div ref={overlayRef} onClick={handleOverlay} className="fixed inset-0 z-50 flex">
      {/* Overlay clickable */}
      <div className="flex-1 bg-black/40" />
      {/* Panel derecho */}
      <div className="w-[520px] max-w-[96vw] bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5">
        {/* Header dividido: izquierda (icono+titulo), derecha (estado), descripción debajo */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Icon icon="vaadin:stock" width={22} height={22} color="primary"/>
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
            Consulta toda la información registrada de este producto, incluyendo sus datos básicos,
            ubicación en almacén, stock y condiciones asociadas.
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

          {/* Descripción (full) */}
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

          {/* Categoría (full) */}
          <Inputx
            name="categoria"
            label="Categoría"
            value={categoriaLabel}
            readOnly
            disabled
            type="text"
          />

          {/* Almacén (full) */}
          <Inputx
            name="almacen"
            label="Almacén"
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
              label="Define cantidad Stock Mínimo"
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
          />
        </div>
      </div>
    </div>
  );
}
