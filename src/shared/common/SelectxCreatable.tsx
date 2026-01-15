import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

type LabelVariant = "center" | "left";

export type CreatableOption = {
  id: string | number;
  label: string;
  // puedes incluir más campos si los necesitas
};

interface SelectxCreatableProps {
  label: string;
  placeholder?: string;
  labelVariant?: LabelVariant;

  /** Valor que se escribe en el input */
  inputValue: string;

  /** ID seleccionado cuando eligen una opción existente */
  selectedId?: string | number;

  /** Lista de opciones para sugerir */
  options: CreatableOption[];

  /** Deshabilitar */
  disabled?: boolean;

  /** Requerido (solo decorativo como en tu Selectx) */
  required?: boolean;

  /** Cambios en el texto del input */
  onInputChange: (v: string) => void;

  /** Cuando seleccionan una opción existente */
  onSelectOption: (opt: CreatableOption) => void;

  /** Cuando el usuario decide crear con el texto actual */
  onCreateFromInput: (value: string) => void;

  /** Clases extra */
  className?: string;

  /** Estilo inline opcional */
  style?: React.CSSProperties;
}

function canonical(s: string) {
  return s.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

export function SelectxCreatable({
  label,
  placeholder = "Seleccionar opción",
  labelVariant = "center",
  inputValue,
  selectedId,
  options,
  disabled,
  required,
  onInputChange,
  onSelectOption,
  onCreateFromInput,
  className,
  style,
}: SelectxCreatableProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const labelClasses: Record<LabelVariant, string> = {
    center: "block text-base font-normal text-black text-center",
    left: "block text-base font-normal text-gray90 text-left",
  };

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Sugerencias filtradas
  const query = canonical(inputValue);
  const suggestions = useMemo(() => {
    if (!query) return options;
    return options.filter((o) => canonical(o.label).includes(query));
  }, [options, query]);

  const exactMatch = useMemo(() => {
    if (!query) return undefined;
    return options.find((o) => canonical(o.label) === query);
  }, [options, query]);

  const textColorClass =
    !inputValue || inputValue.trim() === "" ? "text-gray-500" : "text-gray90";

  const popCls =
    "absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-white shadow-lg";

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (exactMatch) {
        onSelectOption(exactMatch);
        setOpen(false);
      } else if (inputValue.trim()) {
        onCreateFromInput(inputValue.trim());
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      setOpen(true);
    }
  }

  return (
    <div className="w-full flex flex-col gap-1.5" ref={wrapRef} style={style}>
      <label className={labelClasses[labelVariant]}>
        {label} {required ? <span className="text-red-500"></span> : null}
      </label>

      <div className="relative">
        {/* Input con apariencia de select */}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white
            ${textColorClass} placeholder:text-gray-300 font-roboto text-sm pr-9
            focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-gray-300
            ${className ?? ""}`}
        />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (disabled) return;
            inputRef.current?.focus();
            setOpen((o) => !o);
          }}
          aria-label="Abrir opciones"
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-2 rounded-md hover:bg-gray-100"
        >
          <Icon
            icon="ep:arrow-down"
            width="16"
            height="22"
            color="gray"
            className="pointer-events-none"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className={popCls}>
            <ul className="">
              {suggestions.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">Sin coincidencias…</li>
              )}
              {suggestions.map((opt) => (
                <li
                  key={opt.id}
                  className={`px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${String(opt.id) === String(selectedId) ? "bg-gray-50" : ""
                    }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // evita blur antes del click
                    onSelectOption(opt);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </li>
              ))}
            </ul>

            {/* Acción crear si no hay coincidencia exacta */}
            {!exactMatch && inputValue.trim() && (
              <div className="border-t">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onCreateFromInput(inputValue.trim());
                    setOpen(false);
                  }}
                >
                  Crear “{inputValue.trim()}”
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
