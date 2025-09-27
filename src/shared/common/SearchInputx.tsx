import React from "react";
import { Icon } from "@iconify/react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    placeholder: string; // Placeholder dinámico
    value: string; // Valor del input
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Manejador de cambios
}

export function SearchInputx({
    placeholder,
    value,
    onChange,
    className,
    ...props
}: SearchInputProps) {
    const handleClear = () => {
        onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>); // Limpiar el valor
    };

    return (
        <div className="w-full">
            {/* Componente input sin label */}
            <div className="relative">
                {/* Ícono de búsqueda a la izquierda */}
                <Icon
                    icon="akar-icons:search"
                    width="16"
                    height="16"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                {/* Input */}
                <input
                    {...props}
                    value={value}  // El valor del input está controlado
                    onChange={onChange}  // Actualiza el valor cuando cambia
                    placeholder={placeholder} // Placeholder dinámico
                    className={`w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 bg-white text-gray-500 placeholder:text-gray-400 outline-none font-roboto text-sm ${className ?? ""}`}
                />

                {/* Ícono de "X" para borrar el texto, solo aparece si hay valor */}
                {value && (
                    <Icon
                        icon="akar-icons:circle-x"
                        width="20"
                        height="20"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                        onClick={handleClear}
                    />
                )}
            </div>
        </div>
    );
}
