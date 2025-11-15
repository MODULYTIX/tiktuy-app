// src/shared/common/ImageUploadx.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

type Size = "sm" | "md";

export interface ImageUploadxProps {
  label?: string;
  /** Archivo actual o URL existente (ediciones) */
  value?: File | string | null;
  /** Límite de tamaño (MB) para validar archivos nuevos */
  maxSizeMB?: number;
  /** Aceptados, por defecto imágenes */
  accept?: string;
  /** Deshabilitar interacción */
  disabled?: boolean;
  /** Texto de ayuda debajo */
  helperText?: string;
  /** Tamaño del thumbnail y controles */
  size?: Size;
  /** Clase extra para el contenedor */
  className?: string;

  /** Dispara cuando el usuario elige una nueva imagen (o la borra con null) */
  onChange?: (file: File | null) => void;

  /** Acciones opcionales si quieres manejar tú la vista/descarga */
  onView?: (url: string) => void;
  onDownload?: (url: string) => void;
  onDelete?: () => void;
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
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
  onChange,
  onView,
  onDownload,
  onDelete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Sincroniza prop `value`
  useEffect(() => {
    if (!value) {
      setFile(null);
      setExternalUrl(null);
      setPreviewUrl(null);
      return;
    }
    if (value instanceof File) {
      setFile(value);
      setExternalUrl(null);
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === "string") {
      setFile(null);
      setExternalUrl(value);
      setPreviewUrl(value);
    }
  }, [value]);

  // Limpia objectURL si cambia el file interno
  useEffect(() => {
    let localUrl: string | null = null;
    if (file) {
      localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    }
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [file]);

  const thumbClasses =
    size === "sm"
      ? "w-12 h-12"
      : "w-[72px] h-[72px]";

  const iconBtnClasses =
    size === "sm"
      ? "w-8 h-8"
      : "w-9 h-9";

  const hasImage = Boolean(previewUrl);

  const validateAndSet = useCallback(
    async (f: File | null) => {
      if (!f) return;
      setError(null);
      if (!f.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen.");
        return;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`La imagen supera ${maxSizeMB} MB.`);
        return;
      }
      try {
        setProcessing(true);
        // Aquí podrías hacer compresión/optimización si quisieras
        setFile(f);
        onChange?.(f);
      } finally {
        setProcessing(false);
      }
    },
    [maxSizeMB, onChange]
  );

  const handlePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      void validateAndSet(f);
      // Limpia para poder volver a seleccionar el mismo archivo
      e.target.value = "";
    },
    [validateAndSet]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0] ?? null;
      void validateAndSet(f);
    },
    [disabled, validateAndSet]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return;
      const item = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/")
      );
      if (item) {
        const f = item.getAsFile();
        if (f) void validateAndSet(f);
      }
    },
    [disabled, validateAndSet]
  );

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleView = () => {
    if (!previewUrl) return;
    if (onView) return onView(previewUrl);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    if (onDownload) return onDownload(previewUrl);
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = (file?.name ?? "imagen") || "imagen";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDelete = () => {
    setFile(null);
    setExternalUrl(null);
    setPreviewUrl(null);
    onDelete?.();
    onChange?.(null);
  };

  const fileName = useMemo(() => file?.name ?? externalUrl?.split("/").pop() ?? "", [file, externalUrl]);
  const fileSize = useMemo(() => (file ? formatBytes(file.size) : ""), [file]);

  return (
    <div
      className={`w-full ${className}`}
      onPaste={handlePaste}
    >
      {/* Label */}
      {label && (
        <label className="block text-base font-normal text-gray90 text-left mb-2">
          {label}
        </label>
      )}

      {/* Zona interactiva */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={[
          "rounded-md border transition-colors",
          "bg-white",
          dragActive ? "border-gray-500 bg-gray-50" : "border-gray-300",
          disabled ? "opacity-60 pointer-events-none" : "hover:border-gray-400",
          "p-3",
        ].join(" ")}
      >
        {/* Estado vacío */}
        {!hasImage && (
          <div className="flex items-center gap-3">
            <div className={`${thumbClasses} rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center`}>
              <Icon icon="mdi:image-outline" className="text-gray-400 text-xl" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray90 font-roboto">
                Arrastra una imagen o{" "}
                <button
                  type="button"
                  onClick={openPicker}
                  className="text-blue-700 hover:underline focus:outline-none"
                >
                  selecciónala
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {helperText ?? `PNG/JPG hasta ${maxSizeMB} MB. También puedes pegar desde el portapapeles.`}
              </div>
            </div>

            <button
              type="button"
              onClick={openPicker}
              className={`${iconBtnClasses} rounded-md border border-gray-300 bg-white text-gray90 inline-flex items-center justify-center hover:bg-gray-50`}
              aria-label="Elegir archivo"
            >
              {processing ? (
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
          </div>
        )}

        {/* Estado con imagen */}
        {hasImage && (
          <div className="flex items-center gap-3">
            {/* Preview */}
            <div className={`${thumbClasses} overflow-hidden rounded-md border border-gray-200 bg-gray-50 shrink-0`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl!}
                alt="Vista previa"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>

            {/* Nombre + peso */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-roboto text-gray90 truncate" title={fileName}>
                {fileName || "imagen"}
              </div>
              {fileSize && <div className="text-xs text-gray-500">{fileSize}</div>}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className={`${iconBtnClasses} rounded-md bg-gray-900 text-white inline-flex items-center justify-center hover:bg-gray-800`}
                title="Descargar"
                aria-label="Descargar imagen"
              >
                <Icon icon="tabler:download" className="text-lg" />
              </button>

              <button
                type="button"
                onClick={handleView}
                className={`${iconBtnClasses} rounded-md bg-gray-900 text-white inline-flex items-center justify-center hover:bg-gray-800`}
                title="Ver"
                aria-label="Ver imagen"
              >
                <Icon icon="tabler:eye" className="text-lg" />
              </button>

              <button
                type="button"
                onClick={openPicker}
                className={`${iconBtnClasses} rounded-md border border-gray-300 bg-white text-gray90 inline-flex items-center justify-center hover:bg-gray-50`}
                title="Cambiar imagen"
                aria-label="Cambiar imagen"
              >
                <Icon icon="tabler:photo-edit" className="text-lg" />
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className={`${iconBtnClasses} rounded-md bg-gray-900 text-white inline-flex items-center justify-center hover:bg-gray-800`}
                title="Eliminar"
                aria-label="Eliminar imagen"
              >
                <Icon icon="tabler:trash" className="text-lg" />
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handlePick}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : helperText && !hasImage ? (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default ImageUploadx;
