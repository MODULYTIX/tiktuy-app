import React, { useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

type LabelVariant = "center" | "left";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  placeholder?: string;
  labelVariant?: LabelVariant;
}

export function Selectx({
  label,
  placeholder = "Seleccionar opción",
  className,
  labelVariant = "center",
  ...props
}: SelectProps) {
  const labelClasses: Record<LabelVariant, string> = {
    center: "block text-base font-normal text-black text-center",
    left: "block text-base font-normal text-gray90 text-left",
  };

  // Si value está vacío ("" | null | undefined) => mostramos color de placeholder
  // Para selects controlados funciona perfecto (value={...}).
  const isPlaceholder =
    props.value == null ||
    (typeof props.value === "string" && props.value === "") ||
    (Array.isArray(props.value) && props.value.length === 0 && !props.multiple);

  const textColorClass = isPlaceholder ? "text-gray-500" : "text-gray90";

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label className={labelClasses[labelVariant]}>{label}</label>

      <div className="relative">
        <select
          {...props}
          className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white
          ${textColorClass} placeholder:text-gray-300 font-roboto text-sm appearance-none pr-9
          focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-gray-300
          ${className ?? ""}`}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {props.children}
        </select>

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
  label: string;
  placeholder?: string;
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

    if (typeof (el as any).showPicker === "function") {
      (el as any).showPicker();
      return;
    }

    el.focus();
    try { el.click(); } catch {}
  }, []);

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label className="block text-base font-normal text-black text-center">
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          placeholder={placeholder}
          className={`w-full h-10 px-4 pr-9 rounded-md border border-gray-300 bg-white text-gray-500 placeholder:text-gray-300 font-roboto text-sm appearance-none
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-gray-300
          ${className ?? ""}`}
          {...props}
        />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openPicker}
          aria-label="Abrir calendario"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 outline-none focus:outline-none focus:ring-0"
        >
          <Icon icon="mdi:calendar-outline" width="18" height="18" className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}
