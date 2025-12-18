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
    <div className="relative flex items-end " ref={ref}>
      {/* Botones deslizantes */}
      <div
        id={menuId}
        role="menu"
        aria-hidden={!show}
        className={`flex items-center gap-2 transition-all duration-300 ${
          show
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10 pointer-events-none"
        }`}
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
      </div>

      {/* Separador */}
      <div
        className={`h-10 w-px bg-gray-300 mx-2 transition-all duration-300 ${
          show ? "opacity-100" : "opacity-0 w-0 mx-0"
        }`}
      />

      {/* Botón Excel */}
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
  );
}
