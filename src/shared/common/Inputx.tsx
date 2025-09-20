import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;  // Prop para el título (label)
    placeholder?: string;
}

export function Inputx({
    label,
    placeholder = "Escribe aquí",
    className,
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {/* Título o label dinámico */}
            <label className="block text-base font-medium text-black mb-[0.625rem] text-left">
                {label} {/* El título ahora es dinámico */}
            </label>

            {/* Componente input */}
            <div className="relative">
                <input
                    {...props}
                    placeholder={placeholder}
                    className={`w-full h-12 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 outline-none focus:border-gray-80 focus:ring-2 font-roboto text-sm ${className ?? ""}`}
                />
            </div>
        </div>
    );
}
