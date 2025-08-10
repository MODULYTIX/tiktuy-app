import { Icon } from "@iconify/react";
import React from "react";

type Option = { value: string | number; label: string };

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[]; // lista de opciones
  placeholder?: string;
}

export function Select({
  options,
  placeholder = "Seleccionar",
  className,
  ...props
}: SelectProps) {
  return (
    <div className="relative w-full border-gray30">
      <select {...props} className={`pr-10 ${className ?? ""}`}>
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Icon
        icon="ep:arrow-down"
        width="16"
        height="22"
        color="gray"
        className="absolute border-gray60 right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}
