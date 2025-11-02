import React from "react";
import { Icon } from "@iconify/react";

type TittlexVariant = "default" | "modal" | "section";

interface TittlexProps {
  title: string;
  /** Descripción opcional: si no se envía, no se renderiza ni deja espacio */
  description?: string;
  /** Variante del componente: "default", "modal" (con ícono a la izquierda) o "section" (más compacto) */
  variant?: TittlexVariant;
  /** Nombre del ícono de Iconify (solo se usa en variant="modal") */
  icon?: string;
  /** Para sobreescribir estilos desde fuera */
  className?: string;
}

const Tittlex: React.FC<TittlexProps> = ({
  title,
  description,
  variant = "default",
  icon,
  className = "",
}) => {
  // === Variante modal (con ícono a la izquierda)
  if (variant === "modal") {
    return (
      <div className={`flex flex-col gap-4 items-start ${className}`}>
        <div className="w-full h-[32px] flex items-center gap-2.5">
          {icon && <Icon icon={icon} width={28} height={28} color="#1E3A8A" />}
          <h2 className="font-roboto font-semibold text-xl text-primary">
            {title}
          </h2>
        </div>
        {/* Mostrar descripción solo si existe */}
        {description && (
          <p className="font-roboto text-sm text-gray60">{description}</p>
        )}
      </div>
    );
  }

  // === Variante "section" (más compacta, sin barra)
  if (variant === "section") {
    return (
      <div className={`flex flex-col gap-2 items-start ${className}`}>
        <h1 className="text-xl font-bold text-black font-roboto">{title}</h1>
        {description && (
          <p className="text-sm text-gray60 font-roboto">{description}</p>
        )}
      </div>
    );
  }

  // === Variante por defecto
  return (
    <div className={`flex flex-col gap-2 items-start ${className}`}>
      <h1 className="text-3xl font-bold text-primary font-roboto">{title}</h1>
      {description && (
        <p className="text-base text-gray60 font-roboto">{description}</p>
      )}
    </div>
  );
};

export default Tittlex;
