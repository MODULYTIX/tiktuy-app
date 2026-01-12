// src/shared/common/ModalSlideRight.tsx
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;

  /** opcional: z-index */
  zIndexClass?: string; // default: "z-[100]"
  /** opcional: si quieres bloquear scroll del body al abrir */
  lockBodyScroll?: boolean; // default: true
  /** opcional: clases extra para el panel (NO define tamaño por defecto) */
  panelClassName?: string;
};

export default function ModalSlideRight({
  open,
  onClose,
  children,
  zIndexClass = "z-[100]",
  lockBodyScroll = true,
  panelClassName = "",
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(false);

  // mount + animación
  useEffect(() => {
    let r1 = 0,
      r2 = 0;
    let t: ReturnType<typeof setTimeout> | undefined;

    if (open) {
      setMounted(true);
      r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      t = setTimeout(() => setMounted(false), 320);
    }

    return () => {
      if (r1) cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
      if (t) clearTimeout(t);
    };
  }, [open]);

  // ESC para cerrar
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (!lockBodyScroll) return;
    if (!mounted) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, lockBodyScroll]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass}`}>
      {/* overlay */}
      <div
        className={[
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          show ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* panel (NO impone width/overflow; lo define el hijo) */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          "absolute right-0 top-0 h-full",
          "bg-white shadow-lg border-l border-gray-200",
          "transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          show ? "translate-x-0" : "translate-x-full",
          "flex flex-col",
          panelClassName,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
