import { useState, useRef, useEffect } from "react";
import Buttonx from "@/shared/common/Buttonx";

interface Props {
  onTemplateClick: () => void;
  onImportClick: () => void;
}

export default function AnimatedExcelMenu({
  onTemplateClick,
  onImportClick,
}: Props) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const menuId = "excel-actions-popover";

  return (
    <div className="relative isolate flex items-end" ref={ref}>
      {/* ✅ Menú (sale desde detrás del botón Excel) */}
      <div
        id={menuId}
        role="menu"
        aria-hidden={!show}
        className={[
          // posición: pegado a la izquierda del botón Excel
          "absolute right-full bottom-0 mr-2",
          "flex items-center gap-2",
          // z-index menor => queda detrás del Excel al cruzarse
          "z-0",
          "transition-all duration-300",
          show
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-8 pointer-events-none",
        ].join(" ")}
      >
        <Buttonx
          type="button"
          onClick={onTemplateClick}
          role="menuitem"
          label="Descargar plantilla"
          icon="material-symbols:upload-rounded"
          variant="tertiary"
        />

        <Buttonx
          type="button"
          onClick={onImportClick}
          role="menuitem"
          label="Importar archivo"
          icon="material-symbols:download-rounded"
          variant="secondary"
        />

        {/* Separador pegado al Excel */}
        <div
          className={[
            "h-10 w-px bg-gray-300 ml-2 transition-opacity duration-300",
            show ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      </div>

      {/* ✅ Botón Excel encima (tapa el menú al animar) */}
      <div className="relative z-10">
        <Buttonx
          type="button"
          variant="outlined"
          icon="mdi:microsoft-excel"
          label="" // si no quieres texto
          aria-label="Acciones de Excel"
          aria-haspopup="menu"
          aria-expanded={show}
          aria-controls={menuId}
          onClick={() => setShow((prev) => !prev)}
        />
      </div>
    </div>
  );
}
