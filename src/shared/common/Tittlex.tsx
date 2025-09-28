import React from "react";
import { Icon } from "@iconify/react";

type TittlexVariant = "default" | "modal";

interface TittlexProps {
    title: string;
    description: string;
    /** Variante del componente: "default" (mi diseño actual) o "modal" (con ícono a la izquierda) */
    variant?: TittlexVariant;
    /** Nombre del ícono de Iconify (solo se usa en variant="modal") */
    icon?: string;
    /** Por si quieres sobreescribir estilos desde fuera */
    className?: string;
}

const Tittlex: React.FC<TittlexProps> = ({
    title,
    description,
    variant = "default",
    icon,
    className = "",
}) => {
    // Variante para títulos de modal (con ícono)
    if (variant === "modal") {
        return (
            <div className={`flex flex-col gap-4 items-start ${className}`}>
                <div className="w-full h-[32px] flex items-center gap-2.5 ">
                    {icon && <Icon icon={icon} width={28} height={28} color="#1E3A8A"/>}
                    {/* Título: Roboto, bold, 20px, color primary */}
                    <h2 className="font-roboto font-semibold text-2xl text-primary">
                        {title}
                    </h2>
                </div>

                {/* Descripción: Roboto, regular, 12px, color gray-60 */}
                <p className="font-roboto text-gray60 text-gray60">{description}</p>
            </div>
        );
    }

    // Variante por defecto (tu diseño original con la barra vertical)
    return (
        <div className={`flex flex-col gap-2 items-start ${className}`}>
            <div className="flex items-center gap-2">
                <div className="w-[5px] h-[26px] bg-primary rounded-md"></div>
                <h1 className="text-3xl font-bold text-primary font-roboto">
                    {title}
                </h1>
            </div>
            <p className="text-base text-gray60 font-roboto">{description}</p>
        </div>
    );
};

export default Tittlex;
