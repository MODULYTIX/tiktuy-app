// src/shared/common/Badgex.tsx
import type { PropsWithChildren } from "react";

type BadgexProps = PropsWithChildren<{
  className?: string;
  title?: string;
  /** "soft" (default) = rounded-[6px], "pill" = rounded-full */
  shape?: "soft" | "pill";
  /** Tamaño visual: "xs" => py-[7px] + text-[10px]; "sm" (default) => py-[10px] + text-xs */
  size?: "xs" | "sm";
}>;

export default function Badgex({
  className = "",
  title,
  shape = "soft",
  size = "sm",
  children,
}: BadgexProps) {
  // Detectores para no pisar overrides del padre
  const hasBg      = /\b!?bg-/.test(className);
  const hasTextCol = /\b!?text-(?:white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/.test(className);
  const hasRounded = /\brounded/.test(className);

  // Map de tamaños
  const sizeCls =
    size === "xs"
      ? ["px-2 py-[2px]", "text-[10px]"]     // variante pequeña (lo que pediste)
      : ["px-3 py-[6px]", "text-xs"];       // default ≈ 12px

  return (
    <span
      title={title}
      className={[
        // base
        "inline-flex items-center justify-center",
        " whitespace-nowrap select-none font-medium",
        ...sizeCls,
        // radios por variante (solo si el padre no manda su propio rounded-)
        !hasRounded && (shape === "pill" ? "rounded-full" : "rounded-[6px]"),
        // colores por defecto (si el padre no los pasa)
        !hasBg && "bg-gray90",
        !hasTextCol && "text-white",
        // overrides del padre (tienen prioridad)
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
