import { Icon } from "@iconify/react";

type Variant = "view" | "edit" | "custom" | "export";

type Props = {
  /** view | edit | custom */
  variant: Variant;

  /** onClick del action */
  onClick?: () => void;

  /** Deshabilitar action */
  disabled?: boolean;

  /** Tooltip + aria-label */
  title?: string;

  /**
   * Solo para variant="custom"
   * Iconify name: "mdi:trash", "lucide:copy", etc.
   */
  icon?: string;

  /**
   * Solo para variant="custom"
   * Clases tailwind para colores (bg/text/hover/ring) sin depender de strings dinámicos.
   * Ej: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 hover:ring-rose-300 focus-visible:ring-rose-400"
   */
  colorClassName?: string;

  /**
   * Para tocar todo el estilo desde fuera (si quieres).
   * Esto SIEMPRE se concatena.
   */
  className?: string;

  /**
   * Tamaño del botón (por defecto ideal para tablas)
   */
  size?: "sm" | "md";
};

const baseBtn =
  "inline-flex items-center justify-center rounded-md transition-all select-none " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const sizeCls: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-8 h-8", // perfecto para tablas compactas
  md: "w-9 h-9",
};

const iconCls: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-[16px]",
  md: "text-[18px]",
};

const variantStyle: Record<
  Exclude<Variant, "custom">,
  { cls: string; icon: string; fallbackTitle: string }
> = {
  view: {
    icon: "solar:eye-bold", // icono bonito (Iconify)
    fallbackTitle: "Ver",
    cls:
      "bg-blue-100 text-blue-600 ring-1 ring-blue-300 " +
      "hover:bg-blue-200 hover:ring-blue-400 " +
      "focus-visible:ring-blue-500",
  },
  edit: {
    icon: "solar:pen-2-bold",
    fallbackTitle: "Editar",
    cls:
      "bg-orange-200/70 text-orange-800 ring-1 ring-orange-300 " +
      "hover:bg-orange-200 hover:ring-orange-400 " +
      "focus-visible:ring-orange-500",
  },
  export: {
    icon: "carbon:generate-pdf",
    fallbackTitle: "Exportar",
    cls:
      "bg-primaryDark text-white ring-1 ring-primaryDark hover:bg-primaryDark/80 hover:ring-primaryDark focus-visible:ring-primaryDark",
  },
};

export default function TableActionx({
  variant,
  onClick,
  disabled = false,
  title,
  icon,
  colorClassName,
  className = "",
  size = "sm",
}: Props) {
  const isCustom = variant === "custom";

  const resolvedIcon = isCustom ? icon : variantStyle[variant].icon;
  const resolvedTitle =
    title ?? (isCustom ? "Acción" : variantStyle[variant].fallbackTitle);

  const resolvedColors = isCustom
    ? colorClassName ??
    "bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 hover:ring-violet-300 focus-visible:ring-violet-400"
    : variantStyle[variant].cls;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={resolvedTitle}
      aria-label={resolvedTitle}
      className={[
        baseBtn,
        sizeCls[size],
        resolvedColors,
        "active:scale-[0.98]",
        className,
      ].join(" ")}
    >
      {resolvedIcon ? (
        <Icon icon={resolvedIcon} className={iconCls[size]} />
      ) : (
        <span className="text-[10px] font-medium">—</span>
      )}
    </button>
  );
}
