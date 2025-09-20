import React from "react";
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
          font-roboto text-sm ${className ?? ""}`}
        >
          <option value="" disabled selected hidden>{placeholder}</option>
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
