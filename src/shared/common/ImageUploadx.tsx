// src/shared/common/ImageUploadx.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

type Size = "sm" | "md";
type Mode = "create" | "edit" | "view";

export interface ImageUploadxProps {
  label?: string;
  value?: File | string | null;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
  helperText?: string;
  size?: Size;
  className?: string;

  /** Modo: create | edit | view (default: create) */
  mode?: Mode;

  /** Compat anterior: si true, equivale a mode="view" */
  readOnly?: boolean;

  /** Carga controlada por el padre */
  uploading?: boolean;
  /** Progreso 0–100 (alias: uploadProgress) */
  progress?: number;
  uploadProgress?: number;
  /** Texto y tiempo mínimo visible del overlay */
  uploadText?: string;
  minUploadMs?: number; // default 2000

  /** Confirmación al eliminar */
  confirmOnDelete?: boolean; // default true
  confirmMessage?: string;   // default "¿Seguro que quieres eliminar esta imagen?"
  confirmYesLabel?: string;  // default "Sí"
  confirmNoLabel?: string;   // default "Cancelar"

  onChange?: (file: File | null) => void;
  onView?: (url: string) => void;
  onDownload?: (url: string) => void;
  onDelete?: () => void;
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const forceDownload = (href: string, filename: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename || "imagen";
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const inferNameFromUrl = (u: string, fallback = "imagen") => {
  try {
    const url = new URL(u);
    const last = url.pathname.split("/").pop() || "";
    const clean = last.split("?")[0] || "";
    return clean || fallback;
  } catch {
    const parts = u.split("/").pop() || "";
    return parts.split("?")[0] || fallback;
  }
};

const cloudinaryAttachmentUrl = (u: string, filename?: string) => {
  try {
    const url = new URL(u);
    if (!url.hostname.includes("res.cloudinary.com")) return null;
    const path = url.pathname;
    const marker = "/upload/";
    const i = path.indexOf(marker);
    if (i === -1) return null;
    const before = path.slice(0, i + marker.length);
    const after = path.slice(i + marker.length);
    if (after.startsWith("fl_attachment") || after.includes("fl_attachment,")) return url.toString();
    const safeName = (filename || inferNameFromUrl(u)).replace(/[^\w.\-]+/g, "_");
    url.pathname = `${before}fl_attachment:${safeName}/${after}`;
    return url.toString();
  } catch { return null; }
};

const ImageUploadx: React.FC<ImageUploadxProps> = ({
  label = "Imagen",
  value = null,
  maxSizeMB = 5,
  accept = "image/*",
  disabled = false,
  helperText,
  size = "md",
  className = "",
  mode = "create",
  readOnly = false,

  uploading = false,
  progress,
  uploadProgress,
  uploadText = "Subiendo imagen…",
  minUploadMs = 2000,

  confirmOnDelete = true,
  confirmMessage = "¿Seguro que quieres eliminar esta imagen?",
  confirmYesLabel = "Sí",
  confirmNoLabel = "Cancelar",

  onChange,
  onView,
  onDownload,
  onDelete,
}) => {
  const effectiveMode: Mode = readOnly ? "view" : mode;
  const canPick = effectiveMode !== "view" && !disabled;
  const showChangeDelete = effectiveMode !== "view";
  const showEmptyCTA = effectiveMode !== "view";

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // --- Overlay de carga con tiempo mínimo visible ---
  const startedAtRef = useRef<number | null>(null);
  const hideTRef = useRef<number | null>(null);
  const [busyVisible, setBusyVisible] = useState(false);

  // alias de progress
  const incomingProgress = typeof progress === "number" ? progress : uploadProgress;
  const safeProgress =
    typeof incomingProgress === "number"
      ? Math.max(0, Math.min(100, incomingProgress))
      : undefined;

  const wantBusy = (effectiveMode !== "view") && (processing || uploading);

  useEffect(() => {
    if (wantBusy) {
      if (!busyVisible) setBusyVisible(true);
      if (startedAtRef.current == null) startedAtRef.current = Date.now();
      if (hideTRef.current) { clearTimeout(hideTRef.current); hideTRef.current = null; }
      return;
    }
    const started = startedAtRef.current;
    const elapsed = started ? Date.now() - started : minUploadMs;
    const remaining = Math.max(0, minUploadMs - elapsed);
    if (remaining === 0) {
      setBusyVisible(false);
      startedAtRef.current = null;
    } else {
      hideTRef.current = window.setTimeout(() => {
        setBusyVisible(false);
        startedAtRef.current = null;
        hideTRef.current = null;
      }, remaining);
    }
  }, [wantBusy, minUploadMs, busyVisible]);

  useEffect(() => () => { if (hideTRef.current) clearTimeout(hideTRef.current); }, []);

  // --- Confirmación de borrado (popover anclado al botón) ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !confirmRef.current?.contains(t) &&
        !anchorRef.current?.contains(t)
      ) setConfirmOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setConfirmOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [confirmOpen]);

  const doDelete = () => {
    setFile(null);
    setExternalUrl(null);
    setPreviewUrl(null);
    onDelete?.();
    onChange?.(null);
  };

  // --- Sincroniza prop `value` ---
  useEffect(() => {
    if (!value) { setFile(null); setExternalUrl(null); setPreviewUrl(null); return; }
    if (value instanceof File) {
      setFile(value); setExternalUrl(null);
      const url = URL.createObjectURL(value); setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === "string") {
      setFile(null); setExternalUrl(value); setPreviewUrl(value);
    }
  }, [value]);

  // Limpia objectURL si cambia el file interno
  useEffect(() => {
    let localUrl: string | null = null;
    if (file) { localUrl = URL.createObjectURL(file); setPreviewUrl(localUrl); }
    return () => { if (localUrl) URL.revokeObjectURL(localUrl); };
  }, [file]);

  const thumbClasses = size === "sm" ? "w-12 h-12" : "w-[72px] h-[72px]";
  const iconBtnClasses = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const hasImage = Boolean(previewUrl);

  const validateAndSet = useCallback(
    async (f: File | null) => {
      if (!f) return;
      setError(null);
      if (!f.type.startsWith("image/")) { setError("El archivo debe ser una imagen."); return; }
      if (f.size > maxSizeMB * 1024 * 1024) { setError(`La imagen supera ${maxSizeMB} MB.`); return; }
      try {
        setProcessing(true);
        setFile(f);
        onChange?.(f);
      } finally {
        setProcessing(false);
      }
    },
    [maxSizeMB, onChange]
  );

  const handlePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    void validateAndSet(f);
    e.target.value = "";
  }, [validateAndSet]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!canPick) return;
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    void validateAndSet(f);
  }, [canPick, validateAndSet]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!canPick) return;
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) { const f = item.getAsFile(); if (f) void validateAndSet(f); }
  }, [canPick, validateAndSet]);

  const openPicker = () => { if (!canPick) return; inputRef.current?.click(); };

  const handleView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!previewUrl) return;
    if (onView) return onView(previewUrl);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!previewUrl) return;
    if (onDownload) { onDownload(previewUrl); return; }

    try {
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        forceDownload(url, file.name || "imagen");
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      const resp = await fetch(previewUrl, { mode: "cors" });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const name = inferNameFromUrl(previewUrl, "imagen");
      forceDownload(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const name = inferNameFromUrl(previewUrl, "imagen");
      const cld = cloudinaryAttachmentUrl(previewUrl, name);
      if (cld) { window.open(cld, "_blank", "noopener,noreferrer"); return; }
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!showChangeDelete) return;
    if (confirmOnDelete) {
      setConfirmOpen(true);
    } else {
      doDelete();
    }
  };

  const fileName = useMemo(() => file?.name ?? externalUrl?.split("/").pop() ?? "", [file, externalUrl]);
  const fileSize = useMemo(() => (file ? formatBytes(file.size) : ""), [file]);

  const isBusy = busyVisible;

  return (
    <div
      className={`w-full ${className}`}
      onPaste={handlePaste}
      aria-readonly={effectiveMode === "view"}
      aria-busy={isBusy}
    >
      {/* Label */}
      {label && (
        <label className="block text-base font-normal text-gray90 text-left mb-2">
          {label}
        </label>
      )}

      {/* Zona interactiva */}
      <div
        onDragOver={(e) => { if (!canPick) return; e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => canPick && setDragActive(false)}
        onDrop={handleDrop}
        className={[
          "relative rounded-md border transition-colors bg-white p-3",
          canPick
            ? dragActive ? "border-gray-500 bg-gray-50" : "border-gray-300 hover:border-gray-400"
            : "border-gray-300",
          disabled && effectiveMode !== "view" ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        {/* Estado vacío */}
        {!hasImage && (
          <div className="flex items-center gap-3 select-none">
            <div className={`${thumbClasses} rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center`}>
              <Icon icon="mdi:image-off-outline" className="text-gray-400 text-xl" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray90 font-roboto">
                {showEmptyCTA ? (
                  <>
                    Arrastra una imagen o{" "}
                    <button type="button" onClick={openPicker} className="text-blue-700 hover:underline focus:outline-none">
                      selecciónala
                    </button>
                  </>
                ) : ("Sin imagen")}
              </div>
              {showEmptyCTA && (
                <div className="text-xs text-gray-500">
                  {helperText ?? `PNG/JPG hasta ${maxSizeMB} MB. También puedes pegar desde el portapapeles.`}
                </div>
              )}
            </div>

            {showEmptyCTA && (
              <>
                <button
                  type="button"
                  onClick={openPicker}
                  className={`${iconBtnClasses} rounded-md border border-gray-300 bg-white text-gray90 inline-flex items-center justify-center hover:bg-gray-50`}
                  aria-label="Elegir archivo"
                >
                  {(processing || uploading) ? (
                    <Icon icon="line-md:loading-twotone-loop" className="text-lg animate-spin" />
                  ) : (
                    <Icon icon="tabler:upload" className="text-lg" />
                  )}
                </button>

                <input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={handlePick}
                  disabled={disabled}
                />
              </>
            )}
          </div>
        )}

        {/* Estado con imagen */}
        {hasImage && (
          <div className="flex items-center gap-3 select-none">
            <div className={`${thumbClasses} overflow-hidden rounded-md border border-gray-200 bg-gray-50 shrink-0`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl!} alt="Vista previa" className="w-full h-full object-cover" draggable={false} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-roboto text-gray90 truncate" title={fileName}>
                {fileName || "imagen"}
              </div>
              {fileSize && <div className="text-xs text-gray-500">{fileSize}</div>}
            </div>

            <div className={`flex items-center gap-2 ${isBusy ? "pointer-events-none opacity-70" : ""}`}>
              <button
                type="button"
                onClick={(e) => handleDownload(e)}
                className={`${iconBtnClasses} rounded-md bg-gray-900 text-white inline-flex items-center justify-center hover:bg-gray-800`}
                title="Descargar"
                aria-label="Descargar imagen"
              >
                <Icon icon="tabler:download" className="text-lg" />
              </button>

              <button
                type="button"
                onClick={(e) => handleView(e)}
                className={`${iconBtnClasses} rounded-md bg-gray-900 text-white inline-flex items-center justify-center hover:bg-gray-800`}
                title="Ver"
                aria-label="Ver imagen"
              >
                <Icon icon="tabler:eye" className="text-lg" />
              </button>

              {showChangeDelete && (
                <>
                  <button
                    type="button"
                    onClick={openPicker}
                    className={`${iconBtnClasses} rounded-md border border-gray-300 bg-white text-gray90 inline-flex items-center justify-center hover:bg-gray-50`}
                    title="Cambiar imagen"
                    aria-label="Cambiar imagen"
                  >
                    <Icon icon="tabler:photo-edit" className="text-lg" />
                  </button>

                  {/* Botón eliminar + popover anclado a la derecha */}
                  <div ref={anchorRef} className="relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(e); }}
                      className={`${iconBtnClasses} rounded-md bg-gray-900 text-white inline-flex items-center justify-center hover:bg-gray-800`}
                      title="Eliminar"
                      aria-label="Eliminar imagen"
                    >
                      <Icon icon="tabler:trash" className="text-lg" />
                    </button>

                    {confirmOpen && (
                      <div
                        id="img-del-confirm"
                        ref={confirmRef}
                        role="dialog"
                        aria-modal="true"
                        className="absolute top-full right-0 mt-2 z-50 w-[260px] rounded-lg border border-gray-200 bg-white shadow-xl p-3"
                        style={{ maxWidth: "min(260px, calc(100vw - 32px))" }}
                      >
                        <div className="flex items-start gap-2">
                          <Icon icon="tabler:alert-circle" className="text-gray-700 mt-0.5" />
                          <p className="text-sm text-gray-800">
                            {confirmMessage}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmOpen(false)}
                            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                          >
                            {confirmNoLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setConfirmOpen(false); doDelete(); }}
                            className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800"
                          >
                            {confirmYesLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handlePick}
                    disabled={disabled}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Overlay de carga con mínimo visible */}
        {isBusy && (
          <div className="absolute inset-0 z-40 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 rounded-md">
            <div className="flex items-center gap-2 text-gray-800">
              <Icon icon="tabler:cloud-upload" className="text-xl" />
              <span className="text-sm font-medium">{uploadText}</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
            <div className="w-[220px] h-1 rounded bg-gray-200 overflow-hidden mt-2">
              {typeof safeProgress === "number" ? (
                <div className="h-full bg-gray-900 transition-all" style={{ width: `${safeProgress}%` }} />
              ) : (
                <div className="h-full bg-gray-900 w-2/3 animate-pulse rounded" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : helperText && !hasImage && showEmptyCTA ? (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default ImageUploadx;
