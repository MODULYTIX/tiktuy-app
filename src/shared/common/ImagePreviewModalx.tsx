// src/shared/common/ImagePreviewModalx.tsx
import { useRef, useState, useEffect, useCallback } from "react";
import type {
  WheelEvent as ReactWheelEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

type Props = {
  open: boolean;

  src?: string;

  url?: string;

  title?: string;

  alt?: string;
  onClose: () => void;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export default function ImagePreviewModalx({
  open,
  src,
  url,
  title,
  alt = "Vista previa",
  onClose,
}: Props) {
  const finalSrc = String(src ?? url ?? "").trim();

  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [panning, setPanning] = useState(false);
  const panPoint = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  const MIN_SCALE = 1;
  const MAX_SCALE = 8;

  const resetView = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  // Reset al abrir/cambiar imagen
  useEffect(() => {
    if (!open) return;
    resetView();
  }, [open, finalSrc, resetView]);

  // Detectar cambios de fullscreen y resetear al entrar
  useEffect(() => {
    const handler = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;
      const atFs = !!fsEl;
      setIsFullscreen(atFs);
      if (atFs) resetView();
    };

    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler as any);
    document.addEventListener("MSFullscreenChange", handler as any);

    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler as any);
      document.removeEventListener("MSFullscreenChange", handler as any);
    };
  }, [resetView]);

  const enterFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;

    const anyEl = el as unknown as {
      requestFullscreen?: () => Promise<void> | void;
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    const req =
      anyEl.requestFullscreen?.bind(anyEl) ??
      anyEl.webkitRequestFullscreen?.bind(anyEl) ??
      anyEl.msRequestFullscreen?.bind(anyEl);

    try {
      if (req) await Promise.resolve(req());
    } catch {}
  };

  const openInNewTab = () => {
    if (!finalSrc) return;
    window.open(finalSrc, "_blank", "noopener,noreferrer");
  };

  // Wheel zoom (bloqueado en fullscreen)
  const onWheel = useCallback(
    (e: ReactWheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isFullscreen) return;
      if (!finalSrc) return;

      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();

      const zoomIntensity = 0.0015;
      const nextScale = clamp(
        scale * (1 - e.deltaY * zoomIntensity),
        MIN_SCALE,
        MAX_SCALE
      );
      if (nextScale === scale) return;

      const offsetX = e.clientX - rect.left - rect.width / 2;
      const offsetY = e.clientY - rect.top - rect.height / 2;
      const ds = nextScale / scale;

      setTx((prev) => prev - offsetX * (ds - 1));
      setTy((prev) => prev - offsetY * (ds - 1));
      setScale(nextScale);
    },
    [scale, isFullscreen, finalSrc]
  );

  // Doble click: alterna 1× / 2× (bloqueado en fullscreen)
  const onDoubleClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isFullscreen) return;
      if (!finalSrc) return;

      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const targetScale = scale > 1 ? 1 : 2;
      const offsetX = e.clientX - rect.left - rect.width / 2;
      const offsetY = e.clientY - rect.top - rect.height / 2;
      const ds = targetScale / scale;

      setTx((prev) => prev - offsetX * (ds - 1));
      setTy((prev) => prev - offsetY * (ds - 1));
      setScale(targetScale);
    },
    [scale, isFullscreen, finalSrc]
  );

  // Pan con arrastre (bloqueado en fullscreen)
  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFullscreen) return;
    if (!finalSrc) return;
    if (scale === 1) return;
    setPanning(true);
    panPoint.current = { x: e.clientX, y: e.clientY, startX: tx, startY: ty };
  };

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!panning) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - panPoint.current.x;
    const dy = e.clientY - panPoint.current.y;
    setTx(panPoint.current.startX + dx);
    setTy(panPoint.current.startY + dy);
  };

  const endPan = (e?: ReactMouseEvent<HTMLDivElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPanning(false);
  };

  // Controles toolbar
  const zoomIn = () => {
    if (!finalSrc) return;
    if (!isFullscreen) setScale((s) => clamp(s * 1.2, MIN_SCALE, MAX_SCALE));
  };
  const zoomOut = () => {
    if (!finalSrc) return;
    if (isFullscreen) return;
    setScale((s) => {
      const next = clamp(s / 1.2, MIN_SCALE, MAX_SCALE);
      if (next === 1) {
        setTx(0);
        setTy(0);
      }
      return next;
    });
  };
  const resetToolbar = () => resetView();

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onWheel={onWheel}
    >
      {/* ✅ Title opcional */}
      {title ? (
        <div
          className="absolute top-4 left-4 z-20 max-w-[70vw] truncate
                     px-3 py-2 rounded-full bg-gray-900/70 border border-white/20
                     text-white text-[12px] font-semibold"
          onClick={(e) => e.stopPropagation()}
          title={title}
        >
          {title}
        </div>
      ) : null}

      {/* Cerrar */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="group absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10
                   rounded-full bg-gray-900/70 border border-white/25 ring-1 ring-white/20
                   hover:bg-gray-900/80 hover:ring-white/40 transition z-20"
      >
        <Icon icon="lucide:x" className="text-white text-[18px]" />
      </button>

      {/* Toolbar */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20
                   flex items-center gap-1 px-2 py-1 text-white
                   rounded-full bg-gray-900/70 border border-white/15 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={enterFullscreen}
          title="Pantalla completa"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
        >
          <Icon icon="lucide:maximize-2" className="text-[18px]" />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          title="Alejar"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 ${
            isFullscreen || !finalSrc ? "opacity-40 cursor-not-allowed" : ""
          }`}
          disabled={isFullscreen || !finalSrc}
        >
          <Icon icon="lucide:minus" className="text-[18px]" />
        </button>

        <span className="px-2 text-xs tabular-nums select-none">
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={zoomIn}
          title="Acercar"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 ${
            isFullscreen || !finalSrc ? "opacity-40 cursor-not-allowed" : ""
          }`}
          disabled={isFullscreen || !finalSrc}
        >
          <Icon icon="lucide:plus" className="text-[18px]" />
        </button>

        <button
          type="button"
          onClick={resetToolbar}
          title="Restablecer"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 ${
            !finalSrc ? "opacity-40 cursor-not-allowed" : ""
          }`}
          disabled={!finalSrc}
        >
          <Icon icon="lucide:rotate-ccw" className="text-[18px]" />
        </button>

        <button
          type="button"
          onClick={openInNewTab}
          title="Abrir en nueva pestaña"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 ${
            !finalSrc ? "opacity-40 cursor-not-allowed" : ""
          }`}
          disabled={!finalSrc}
        >
          <Icon icon="lucide:external-link" className="text-[18px]" />
        </button>

        <a
          href={finalSrc || undefined}
          download
          title="Descargar"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 ${
            !finalSrc ? "opacity-40 pointer-events-none" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon icon="lucide:download" className="text-[18px]" />
        </a>
      </div>

      {/* Contenedor de imagen */}
      <div
        ref={wrapRef}
        className="relative z-10 max-w-[96vw] max-h-[94vh] flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onDoubleClick={onDoubleClick}
        style={{
          cursor: isFullscreen
            ? "auto"
            : scale > 1
            ? panning
              ? "grabbing"
              : "grab"
            : "auto",
        }}
      >
        {!finalSrc ? (
          <div className="px-4 py-3 rounded-xl bg-gray-900/60 border border-white/20 text-white text-[12px]">
            No hay imagen para mostrar.
          </div>
        ) : (
          <div
            ref={contentRef}
            className="will-change-transform"
            style={{
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={finalSrc}
              alt={alt}
              draggable={false}
              className="block h-[92vh] max-h-[92vh] w-auto max-w-[96vw] object-contain rounded-md
                        border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] select-none"
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
