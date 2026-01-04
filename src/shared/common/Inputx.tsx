import React, { useRef, useLayoutEffect } from "react";
import { Icon } from "@iconify/react";

/* =========================
   Inputx (texto genérico)
   ========================= */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // 👈 ahora opcional
  placeholder?: string;
  /** Activa el ojito para mostrar/ocultar contraseña (solo si type="password") */
  withPasswordToggle?: boolean;
}

export function Inputx({
  label,
  placeholder = "Escribe aquí",
  className,
  withPasswordToggle = false,
  type = "text",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === "password";
  const shouldToggle = withPasswordToggle && isPassword;

  const finalType = shouldToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* 👇 solo pinta el label si existe */}
      {label ? (
        <label className="block text-base font-normal text-gray90 text-left">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          {...props}
          type={finalType}
          placeholder={placeholder}
          className={`w-full h-10 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm ${
            shouldToggle ? "pr-10" : ""
          } ${className ?? ""}`}
        />

        {shouldToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-2 flex items-center justify-center text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Icon
              icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
              width={20}
              height={20}
            />
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================
   InputxPhone (variante para número telefónico)
   ========================= */
interface InputPhoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // 👈 opcional
  placeholder?: string;
  countryCode: string;
}

export function InputxPhone({
  label,
  countryCode,
  placeholder = "Escribe tu número",
  className,
  ...props
}: InputPhoneProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label ? (
        <label className="block text-base font-normal text-gray90 text-left">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
          {countryCode}
        </span>

        <input
          {...props}
          placeholder={placeholder}
          type="tel"
          inputMode="tel"
          pattern="[0-9]*"
          className={`w-full h-10 pl-12 pr-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm ${
            className ?? ""
          }`}
        />
      </div>
    </div>
  );
}

/* ==========================================================
   InputxNumber (numérico con flechas solo en focus)
   ========================================================== */
type InputNumberProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string; // 👈 opcional
  decimals?: number;
  placeholder?: string;
  step?: number | string;
};

export function InputxNumber({
  label,
  className,
  decimals = 2,
  placeholder,
  step,
  min,
  max,
  disabled,
  onChange,
  ...props
}: InputNumberProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const scale = Math.pow(10, decimals);
  const defaultStep = step ?? 1 / scale;
  const stepInt = Math.max(1, Math.round(Number(defaultStep) * scale));

  const minInt =
    min != null && !Number.isNaN(Number(min))
      ? Math.round(Number(min) * scale)
      : null;
  const maxInt =
    max != null && !Number.isNaN(Number(max))
      ? Math.round(Number(max) * scale)
      : null;

  const toInt = (v: string): number | null => {
    if (v == null) return null;
    const s = v.trim();
    if (s === "") return null;
    const n = Number(s.replace(",", "."));
    return Number.isNaN(n) ? null : Math.round(n * scale);
  };

  const fmt = (cents: number) => (cents / scale).toFixed(decimals);

  const clampInt = (x: number) => {
    let v = x;
    if (minInt != null) v = Math.max(v, minInt);
    if (maxInt != null) v = Math.min(v, maxInt);
    return v;
  };

  const applyInt = (nextInt: number) => {
    const el = inputRef.current;
    if (!el) return;
    const clamped = clampInt(nextInt);
    el.value = fmt(clamped);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const inc = () => {
    if (disabled) return;
    const curr = toInt(inputRef.current?.value ?? "") ?? 0;
    applyInt(curr + stepInt);
  };

  const dec = () => {
    if (disabled) return;
    const curr = toInt(inputRef.current?.value ?? "") ?? 0;
    applyInt(curr - stepInt);
  };

  const onBlurRound = () => {
    const curr = toInt(inputRef.current?.value ?? "");
    if (curr == null) return;
    applyInt(curr);
  };

  const onKeyDownFilter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return;

    const allowedControl = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (allowedControl.includes(e.key)) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      inc();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      dec();
      return;
    }

    if (e.key >= "0" && e.key <= "9") return;

    if (decimals > 0 && (e.key === "." || e.key === ",")) {
      const el = e.currentTarget;
      const hasSep = el.value.includes(".") || el.value.includes(",");
      const replacingAll =
        el.selectionStart === 0 && el.selectionEnd === el.value.length;
      if (!hasSep || replacingAll) return;
    }

    if (min != null && Number(min) < 0 && e.key === "-") {
      const el = e.currentTarget;
      if (el.selectionStart === 0 && !el.value.includes("-")) return;
    }

    e.preventDefault();
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label ? (
        <label className="block text-base font-normal text-gray90 text-left">
          {label}
        </label>
      ) : null}

      <div className="relative group">
        <input
          ref={inputRef}
          type="number"
          inputMode={decimals === 0 ? "numeric" : "decimal"}
          placeholder={
            placeholder ??
            (decimals > 0 ? "0." + "0".repeat(decimals) : "0")
          }
          step={defaultStep}
          min={min}
          max={max}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlurRound}
          onWheel={(e) => e.preventDefault()}
          onKeyDown={onKeyDownFilter}
          className={`w-full h-10 pl-4 pr-10 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            ${className ?? ""}`}
          {...props}
        />

        <div
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-focus-within:flex flex-col items-center justify-center gap-0.5"
        >
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={inc}
            aria-label="Incrementar"
            className="w-5 h-4 flex items-center justify-center hover:opacity-80 disabled:opacity-50"
          >
            <Icon icon="ion:caret-up" width="12" height="12" className="text-gray-500" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={dec}
            aria-label="Disminuir"
            className="w-5 h-4 flex items-center justify-center hover:opacity-80 disabled:opacity-50"
          >
            <Icon icon="ion:caret-down" width="12" height="12" className="text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   InputxTextarea (variante Textarea)
   ========================================================== */
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string; // 👈 opcional
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
};

export function InputxTextarea({
  label,
  className,
  autoResize = true,
  rows = 3,
  minRows = 3,
  maxRows,
  ...props
}: TextareaProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = taRef.current;
    if (!el || !autoResize) return;

    const cs = window.getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight || "20") || 20;

    const minH = (minRows ?? rows) * lh;
    const maxH = maxRows ? maxRows * lh : Infinity;

    el.style.height = "auto";
    const scrollH = el.scrollHeight;

    const newH = Math.min(Math.max(scrollH, minH), maxH);
    el.style.height = `${newH}px`;

    el.style.overflowY = scrollH > maxH ? "auto" : "hidden";
    el.style.overflowX = "hidden";
  };

  useLayoutEffect(() => {
    resize();
    const r = () => resize();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, autoResize, minRows, maxRows, rows]);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label ? (
        <label className="block text-base font-normal text-gray90 text-left">
          {label}
        </label>
      ) : null}

      <textarea
        ref={taRef}
        rows={rows}
        onInput={resize}
        {...props}
        className={`w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm
          resize-none overflow-x-hidden ${className ?? ""}`}
      />
    </div>
  );
}
