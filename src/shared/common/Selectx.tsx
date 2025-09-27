import React, { useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;  // Prop para el título (label)
  placeholder?: string;
}

export function Selectx({
  label,
  placeholder = "Seleccionar opción",
  className,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {/* Título o label dinámico */}
      <label className="block text-base font-medium text-black mb-[6px] text-center">
        {label}
      </label>

      {/* Componente select */}
      <div className="relative">
        <select
          {...props}
          className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white text-gray-500 placeholder:text-gray-300 
          font-roboto text-sm appearance-none pr-9 ${className ?? ""}`}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {/* Las opciones se insertan aquí */}
          {props.children}
        </select>

        {/* Icono de flecha hacia abajo */}
        <Icon
          icon="ep:arrow-down"
          width="16"
          height="22"
          color="gray"
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
    </div>
  );
}

/* ============================
   Variante de FECHA (SelectxDate)
   ============================ */

interface SelectDateProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;       // Título encima (mismo comportamiento que Selectx)
  placeholder?: string; // Ej: "dd/mm/aaaa" (puede no mostrarse según navegador)
}

export function SelectxDate({
  label,
  placeholder = "dd/mm/aaaa",
  className,
  ...props
}: SelectDateProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = inputRef.current;
    if (!el) return;

    // API moderna
    if (typeof el.showPicker === "function") {
      // @ts-ignore
      el.showPicker();
      return;
    }

    // Fallback para navegadores que no exponen showPicker
    el.focus();
    try { el.click(); } catch {}
  }, []);

  return (
    <div className="w-full">
      {/* Título o label dinámico */}
      <label className="block text-base font-medium text-black mb-[6px] text-center">
        {label}
      </label>

      {/* Input de fecha con icono que abre el calendario */}
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          placeholder={placeholder}
          className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white text-gray-500 placeholder:text-gray-300 font-roboto text-sm pr-9 appearance-none
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          ${className ?? ""}`}
          {...props}
        />

        {/* Botón-ícono que abre el calendario nativo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // evita perder foco
          onClick={openPicker}
          aria-label="Abrir calendario"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
        >
          <Icon
            icon="mdi:calendar-outline"   // alternativa: "lucide:calendar"
            width="18"
            height="18"
            className="text-gray-500"
          />
        </button>
      </div>
    </div>
  );
}
