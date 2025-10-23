import React, { useRef, useLayoutEffect } from "react";
import { Icon } from "@iconify/react";

/* =========================
   Inputx (texto genérico)
   ========================= */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    placeholder?: string;
}

export function Inputx({
    label,
    placeholder = "Escribe aquí",
    className,
    ...props
}: InputProps) {
    return (
        <div className="w-full flex flex-col gap-1.5">
            <label className="block text-base font-normal text-gray90 text-left">
                {label}
            </label>

            <div className="relative">
                <input
                    {...props}
                    placeholder={placeholder}
                    className={`w-full h-10 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm ${className ?? ""}`}
                />
            </div>
        </div>
    );
}

/* =========================
   InputxPhone (variante para número telefónico)
   ========================= */
interface InputPhoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    placeholder?: string;
    countryCode: string; // Código del país, por ejemplo '+51'
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
            <label className="block text-base font-normal text-gray-900 text-left">
                {label}
            </label>

            <div className="relative">
                {/* Código de país */}
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">{countryCode}</span>
                
                {/* Campo para el número de teléfono */}
                <input
                    {...props}
                    placeholder={placeholder}
                    type="tel" // Tipo de campo de teléfono
                    inputMode="tel" // Para dispositivos móviles
                    pattern="[0-9]*" // Solo números
                    className={`w-full h-10 pl-12 pr-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm ${className ?? ""}`}
                />
            </div>
        </div>
    );
}

/* ==========================================================
   InputxNumber (numérico con flechas solo en focus)
   - Sin spinner nativo
   - Preciso: operaciones en enteros escalados
   - Redondeo a 'decimals'
   - Filtro de teclado (solo números y sep. decimal si aplica)
   ========================================================== */
type InputNumberProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label: string;
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

    const minInt = min != null && !Number.isNaN(Number(min)) ? Math.round(Number(min) * scale) : null;
    const maxInt = max != null && !Number.isNaN(Number(max)) ? Math.round(Number(max) * scale) : null;

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
        el.dispatchEvent(new Event("input", { bubbles: true })); // React → onChange
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
        if (curr == null) return; // vacío
        applyInt(curr); // reescribe con toFixed(decimals)
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

        // Dígitos
        if (e.key >= "0" && e.key <= "9") return;

        // Punto / coma (solo si decimals > 0 y aún no hay separador o se reemplaza todo)
        if (decimals > 0 && (e.key === "." || e.key === ",")) {
            const el = e.currentTarget;
            const hasSep = el.value.includes(".") || el.value.includes(",");
            const replacingAll = el.selectionStart === 0 && el.selectionEnd === el.value.length;
            if (!hasSep || replacingAll) return;
        }

        // Signo negativo permitido si min<0 y al inicio
        if (min != null && Number(min) < 0 && e.key === "-") {
            const el = e.currentTarget;
            if (el.selectionStart === 0 && !el.value.includes("-")) return;
        }

        e.preventDefault();
    };

    return (
        <div className="w-full flex flex-col gap-1.5">
            <label className="block text-base font-normal text-gray90 text-left">
                {label}
            </label>

            <div className="relative group">
                <input
                    ref={inputRef}
                    type="number"
                    inputMode={decimals === 0 ? "numeric" : "decimal"}
                    placeholder={placeholder ?? (decimals > 0 ? "0." + "0".repeat(decimals) : "0")}
                    step={defaultStep}
                    min={min}
                    max={max}
                    disabled={disabled}
                    onChange={onChange}
                    onBlur={onBlurRound}
                    onWheel={(e) => e.preventDefault()} // no cambia por rueda
                    onKeyDown={onKeyDownFilter}
                    className={`w-full h-10 pl-4 pr-10 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none font-roboto text-sm
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            ${className ?? ""}`}
                    {...props}
                />

                {/* Flechas triangulares minimalistas (solo en focus) */}
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
   - Auto-resize hasta maxRows; luego aparece scroll vertical
   - Sin scroll horizontal (overflow-x hidden)
   - Sin resize manual (consistente)
   ========================================================== */
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    /** Activa auto-resize (default true) */
    autoResize?: boolean;
    /** Mínimo de filas visibles (default 3) */
    minRows?: number;
    /** Máximo de filas antes de mostrar scroll; si no se pasa, crece libre */
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

        // Medimos line-height real
        const cs = window.getComputedStyle(el);
        const lh = parseFloat(cs.lineHeight || "20") || 20;

        const minH = (minRows ?? rows) * lh;
        const maxH = maxRows ? maxRows * lh : Infinity;

        // Reset para medir scrollHeight correctamente
        el.style.height = "auto";
        const scrollH = el.scrollHeight;

        // Calcula altura dentro de rangos
        const newH = Math.min(Math.max(scrollH, minH), maxH);
        el.style.height = `${newH}px`;

        // Control del overflow
        el.style.overflowY = scrollH > maxH ? "auto" : "hidden";
        el.style.overflowX = "hidden";
    };

    // Ajusta al montar y cuando cambia el value controlado
    useLayoutEffect(() => {
        resize();
        // Reajusta también en cambios de tamaño de ventana
        const r = () => resize();
        window.addEventListener("resize", r);
        return () => window.removeEventListener("resize", r);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value, autoResize, minRows, maxRows, rows]);

    return (
        <div className="w-full flex flex-col gap-1.5">
            <label className="block text-base font-normal text-gray90 text-left">
                {label}
            </label>

            <textarea
                ref={taRef}
                rows={rows}
                onInput={resize}
                {...props}
                className={`w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 outline-none font-roboto text-sm
                resize-none overflow-x-hidden ${className ?? ""}`}
            />
        </div>
    );
}
