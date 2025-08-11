// src/shared/components/common/Autocomplete.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface Option {
  value: string | number;
  label: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (next: string) => void;
  options: Option[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  disabled?: boolean;
  maxItems?: number;
  /** Opcional: te da el option elegido (útil si quieres el id/value real de BD) */
  onSelectOption?: (opt: Option) => void;
}

/**
 * Autocomplete editable:
 * - Permite texto libre (validación externa con `invalid`)
 * - Lista filtrada por `label` (case/acentos-insensitive)
 * - Navegación con teclado (↑/↓/Enter/Esc)
 * - Cierra con click fuera o blur
 */
export default function Autocomplete({
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
  className = '',
  disabled = false,
  maxItems = 30,
  onSelectOption,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const norm = (s: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const q = norm(value);
  const filtered = useMemo(() => {
    if (!options?.length) return [];
    return options
      .filter((o) => norm(o.label).includes(q))
      .slice(0, Math.max(1, maxItems));
  }, [options, q, maxItems]);

  const select = (opt: Option) => {
    onChange(opt.label);
    onSelectOption?.(opt);
    setOpen(false);
    setHighlight(-1);
    // mantener foco en input para seguir editando rápido
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!filtered.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? filtered.length - 1 : h - 1));
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < filtered.length) {
        e.preventDefault();
        select(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  // Cerrar con click fuera
  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const highlightLabel = (label: string) => {
    if (!q) return label;
    const idx = norm(label).indexOf(q);
    if (idx === -1) return label;
    const end = idx + q.length;
    return (
      <>
        {label.slice(0, idx)}
        <mark className="bg-yellow-100">{label.slice(idx, end)}</mark>
        {label.slice(end)}
      </>
    );
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onKeyDown={onKeyDown}
        className={`w-full border rounded px-2 py-1 text-sm outline-none ${
          invalid ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-1 focus:ring-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded shadow-lg max-h-56 overflow-auto z-20">
          {filtered.length === 0 ? (
            <div className="px-2 py-2 text-sm text-gray-500">Sin resultados</div>
          ) : (
            filtered.map((o, i) => (
              <button
                key={`${o.value}-${o.label}`}
                type="button"
                className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-100 ${
                  i === highlight ? 'bg-gray-100' : ''
                }`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()} // para no perder el foco antes del click
                onClick={() => select(o)}
                title={o.label}
              >
                {highlightLabel(o.label)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
