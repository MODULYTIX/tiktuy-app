import React from "react";
import { Icon } from "@iconify/react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "outlined";

interface ButtonProps {
    label: string;
    icon?: string;
    variant: ButtonVariant;
    onClick: () => void;
    disabled?: boolean;
}

const Buttonx: React.FC<ButtonProps> = ({
    label,
    icon,
    variant,
    onClick,
    disabled = false,
}) => {
    const baseStyle = "flex items-center justify-center font-semibold rounded-md";

    // Variantes de color y estilo
    const variantStyles: Record<ButtonVariant, string> = {
        primary: "bg-blue-500 text-white hover:bg-blue-700",
        secondary: "bg-black text-white hover:bg-gray-800",
        tertiary: "bg-gray-100 text-black hover:bg-gray-200",
        outlined: "border-2 border-gray-500 text-gray-500 hover:bg-gray-100",
    };

    return (
        <button
            className={`${baseStyle} ${variantStyles[variant]} w-auto h-10 text-base px-4 py-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <Icon icon={icon} width={16} height={16} className="mr-2" />}
            {label}
        </button>
    );
};

export default Buttonx;
