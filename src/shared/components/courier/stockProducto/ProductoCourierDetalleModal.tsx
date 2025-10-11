import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import type { Producto } from "@/services/courier/producto/productoCourier.type";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
};

function Field({
  label,
  value,
  placeholder = "",
}: {
  label: string;
  value?: string | number | null;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] text-gray70 font-medium">{label}</label>
      <input
        className="h-10 rounded-md border border-gray30 bg-gray-50 px-3 text-[13px] text-gray-800"
        value={value ?? ""}
        readOnly
        placeholder={placeholder}
      />
    </div>
  );
}

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

  if (!isOpen) return null;

  const estado = producto?.estado?.nombre || "-";
  const activo = estado === "Activo";

  // Valores seguros
  const nombre = producto?.nombre_producto ?? "";
  const codigo = producto?.codigo_identificacion ?? "";
  const descripcion = producto?.descripcion ?? "";
  const categoria = producto?.categoria?.nombre ?? "";
  const almacen = producto?.almacenamiento?.nombre_almacen ?? "";
  const precio = producto?.precio != null ? String(producto.precio) : "";
  const cantidad = producto?.stock != null ? String(producto.stock) : "";
  const stockMin = producto?.stock_minimo != null ? String(producto.stock_minimo) : "";
  const peso = (producto as any)?.peso ?? (producto as any)?.peso_gr ?? "";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
    >
      {/* Drawer derecho */}
      <div className="w-[560px] max-w-[95vw] h-full bg-white rounded-l-md shadow-lg border-l border-gray30 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:package-variant-closed" width={22} className="text-primaryDark" />
              <h2 className="text-xl font-bold uppercase tracking-wide text-[#1F3B82]">
                Detalle del Producto
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-600">Estado :</span>
              <span
                className={`inline-flex items-center rounded-sm px-3 py-[6px] text-[12px] font-medium shadow-sm ${
                  activo ? "bg-black text-white" : "bg-gray30 text-gray80"
                }`}
                title={`Estado: ${estado}`}
              >
                {estado}
              </span>
              <button
                onClick={onClose}
                className="ml-2 rounded-md p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <Icon icon="mdi:close" width={18} />
              </button>
            </div>
          </div>

          {/* Subtítulo */}
          <p className="mt-3 text-[13px] text-gray-600">
            Consulta toda la información registrada de este producto, incluyendo sus datos básicos,
            ubicación en almacén, stock y condiciones asociadas.
          </p>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Código" value={codigo} placeholder="-" />
            <Field label="Nombre del Producto" value={nombre} placeholder="-" />

            {/* Descripción full width */}
            <div className="md:col-span-2">
              <label className="text-[12px] text-gray70 font-medium">Descripción</label>
              <input
                className="mt-1 h-10 w-full rounded-md border border-gray30 bg-gray-50 px-3 text-[13px] text-gray-800"
                value={descripcion}
                readOnly
                placeholder="-"
              />
            </div>

            {/* Campos como inputs read-only (sin Selectx) */}
            <Field label="Categoría" value={categoria} placeholder="-" />
            <Field label="Sede" value={almacen} placeholder="-" />

            <Field label="Precio" value={precio} placeholder="0.00" />
            <Field label="Cantidad" value={cantidad} placeholder="0" />
            <Field label="Define cantidad Stock Mínimo" value={stockMin} placeholder="0" />
            <Field label="Peso" value={peso} placeholder="—" />
          </div>
        </div>

        {/* Footer limpio */}
        <div className="h-4" />
      </div>
    </div>
  );
}
