import React from "react";
import { Icon } from "@iconify/react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "outlined";

interface ButtonProps {
    label: string;
    icon?: string;
    variant: ButtonVariant;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

const Buttonx: React.FC<ButtonProps> = ({
    label,
    icon,
    variant,
    onClick,
    disabled = false,
    className = "", 
}) => {
    const baseStyle = "flex items-center gap-2 font-roboto text-sm justify-center rounded-md";

    // Variantes de color y estilo
    const variantStyles: Record<ButtonVariant, string> = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-black text-white font-normal hover:bg-gray-800",
        tertiary: "bg-gray-200 text-black hover:bg-gray-300",
        outlined: "border-2 bg-gray-50 font-medium border-gray-400 text-gray-500 hover:bg-gray-100", 
    };

    return (
        <button
            className={`${baseStyle} ${variantStyles[variant]} h-10 w-auto px-3 py-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className} whitespace-nowrap`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <Icon icon={icon} width={22} height={22} />}
            {label}
        </button>
    );
};

export default Buttonx;
