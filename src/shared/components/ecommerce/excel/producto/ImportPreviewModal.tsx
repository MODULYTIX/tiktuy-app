import { useMemo, useRef, useState, useEffect } from "react";
import type {
  ImportProductosPayload,
  PreviewProductoDTO,
  PreviewProductosResponseDTO,
} from "@/services/ecommerce/importExcelProducto/importexcel.type";
import type { Option } from "@/shared/common/Autocomplete";
import CenteredModal from "@/shared/common/CenteredModal";
import { importProductosDesdePreview } from "@/services/ecommerce/importExcelProducto/importexcel.api";
import { Icon } from "@iconify/react/dist/iconify.js";
import Buttonx from "@/shared/common/Buttonx";

// -------------- UTILS: Fuzzy Match --------------
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getSuggestion(input: string, candidates: string[]): string | null {
  const normalize = (s: string) => s.trim().toLowerCase();
  const target = normalize(input);
  if (!target) return null;

  // 1. Exact match (ignore)
  if (candidates.some(c => normalize(c) === target)) return null;

  let bestMatch: string | null = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const cNorm = normalize(candidate);

    // 2. Contains (strong hint)
    if (cNorm.includes(target) || target.includes(cNorm)) {
      // Prefer the one that is closer in length
      const dist = Math.abs(cNorm.length - target.length);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = candidate;
      }
      continue;
    }

    // 3. Levenshtein for typos
    // Only verify if length is somewhat close
    if (Math.abs(cNorm.length - target.length) > 5) continue;

    const dist = levenshtein(target, cNorm);
    // Threshold: allowing ~3 edits max for reasonable words
    if (dist <= 3 && dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}
// ------------------------------------------------
// Normaliza un valor a T[]
function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === "object") {
    const o = val as any;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.data)) return o.data as T[];
  }
  return [];
}
// ------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  data: PreviewProductosResponseDTO;
  onImported: () => void;
  preloadedAlmacenOptions?: Option[];
  preloadedCategoriaOptions?: Option[];
  existingProductNames?: string[];
};

export default function ImportProductosPreviewModal({
  open,
  onClose,
  token,
  data,
  onImported,
  preloadedCategoriaOptions = [],
  existingProductNames = [],
}: Props) {
  // ----------------- STATE -----------------
  const initialPreview: PreviewProductoDTO[] = toArray<PreviewProductoDTO>(
    data?.preview
  );
  const [groups, setGroups] = useState<PreviewProductoDTO[]>(initialPreview);

  useEffect(() => {
    setGroups(toArray<PreviewProductoDTO>(data?.preview));
  }, [data]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const categoriaNames = useMemo(
    () =>
      toArray<Option>(preloadedCategoriaOptions as unknown).map((o) => o.label),
    [preloadedCategoriaOptions]
  );

  // ----------------- SUGGESTIONS -----------------
  const suggestionsMap = useMemo(() => {
    const map: Record<number, string | null> = {};
    if (!existingProductNames.length) return map;

    groups.forEach((g, idx) => {
      map[idx] = getSuggestion(g.nombre_producto, existingProductNames);
    });
    return map;
  }, [groups, existingProductNames]);

  const applySuggestion = (idx: number, suggestion: string) => {
    patchGroup(idx, { nombre_producto: suggestion, sugerencias: [] });
  };

  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);

  const headerChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerChkRef.current)
      headerChkRef.current.indeterminate = !allSelected && someSelected;
  }, [allSelected, someSelected]);

  const toggleRow = (idx: number) =>
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const toggleAll = () =>
    setSelected(
      allSelected ? {} : Object.fromEntries(groups.map((_, i) => [i, true]))
    );

  // Modal confirm delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ----------------- VALIDATION -----------------
  const norm = (s: string) =>
    (s ?? "")
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  const categoriaSet = useMemo(
    () => new Set(categoriaNames.map(norm)),
    [categoriaNames]
  );

  const isEmpty = (s: unknown) => String(s ?? "").trim().length === 0;

  const toNumber = (v: any) => {
    if (v === "" || v == null) return NaN;
    let s = String(v).trim();
    s = s
      .replace(/,/g, "")
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(/,/, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const toInt = (v: any) => {
    const n = toNumber(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };

  const parsePeso = (v: any) => {
    if (v === "" || v == null) return NaN;
    const m = String(v)
      .trim()
      .match(/[\d.,]+/);
    if (!m) return NaN;
    return toNumber(m[0]);
  };

  const invalidField = (g: PreviewProductoDTO) => {
    const precio = toNumber(g.precio);
    const cantidad = toInt(g.cantidad);
    const stockMin = toInt(g.stock_minimo);
    const peso = parsePeso(g.peso);
    return {
      nombre_producto: isEmpty(g.nombre_producto),
      categoria: isEmpty(g.categoria),
      precio: !(Number.isFinite(precio) && precio >= 0),
      cantidad: !(Number.isInteger(cantidad) && cantidad >= 0),
      stock_minimo: !(Number.isInteger(stockMin) && stockMin >= 0),
      peso: !(Number.isFinite(peso) && peso >= 0),
    };
  };

  const recomputeValido = (g: PreviewProductoDTO) => {
    const inv = invalidField(g);
    return !(
      inv.nombre_producto ||
      inv.categoria ||
      inv.precio ||
      inv.cantidad ||
      inv.stock_minimo ||
      inv.peso
    );
  };

  const recomputeErrores = (g: PreviewProductoDTO) => {
    const inv = invalidField(g);
    const e: string[] = [];
    if (inv.nombre_producto) e.push("Campo requerido: Nombre");
    if (inv.categoria) e.push("Campo requerido: Categoria");
    if (inv.precio) e.push("Precio inválido (>= 0)");
    if (inv.cantidad) e.push("Cantidad inválida (≥ 0)");
    if (inv.stock_minimo) e.push("Stock mínimo inválido (≥ 0)");
    if (inv.peso) e.push("Peso inválido (≥ 0)");
    return e;
  };

  const bgWarnFromCatalog = (has: boolean, val: string | null | undefined) => {
    const v = String(val ?? "").trim();
    if (!v) return "bg-red-50";
    return has ? "" : "bg-amber-50";
  };

  const colorCategoria = (value?: string | null) =>
    bgWarnFromCatalog(categoriaSet.has(norm(String(value ?? ""))), value);

  // ----------------- PATCH -----------------
  const patchGroup = (idx: number, patch: Partial<PreviewProductoDTO>) => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const next = { ...g, ...patch };
        next.valido = recomputeValido(next);
        next.errores = next.valido ? [] : recomputeErrores(next);
        return next;
      })
    );
  };

  const computeHasInvalid = (arr: PreviewProductoDTO[]) =>
    arr.some((g) => !recomputeValido(g));

  const computeTotalValid = (arr: PreviewProductoDTO[]) =>
    arr.filter((g) => recomputeValido(g)).length;

  const totalValidosHeader = computeTotalValid(groups);

  // ----------------- SUBMIT -----------------
  const confirmarImportacion = async () => {
    setError(null);

    let groupsToSend = someSelected
      ? groups.filter((_, i) => selected[i])
      : groups;

    groupsToSend = groupsToSend.map((g) => {
      const valido = recomputeValido(g);
      return { ...g, valido, errores: valido ? [] : recomputeErrores(g) };
    });

    const empty = groupsToSend.find((g) => isEmpty(g.categoria));
    if (empty) {
      setError(
        `Hay filas con "Categoría" vacía (p.ej. fila Excel ${empty.fila}).`
      );
      return;
    }

    if (computeHasInvalid(groupsToSend)) {
      setError("Hay datos inválidos o faltantes. Corrige los campos en rojo.");
      return;
    }

    if (groupsToSend.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      setProgress(0);

      // Calculamos un tamaño de lote dinámico para tener aprox 10 actualizaciones de barra
      // Si son pocos (<10), será de 1 en 1. Si son 100, de 10 en 10.
      const total = groupsToSend.length;
      const chunksTarget = 10;
      const BATCH_SIZE = Math.max(1, Math.ceil(total / chunksTarget));

      let processed = 0;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = groupsToSend.slice(i, i + BATCH_SIZE);
        const payload: ImportProductosPayload = { groups: batch };
        await importProductosDesdePreview(payload, token);

        processed += batch.length;
        setProgress(Math.round((processed / total) * 100));
      }

      onImported();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Error al importar productos");
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  if (!open) return null;

  // ----------------- UI -----------------
  const disabledImport =
    submitting ||
    computeHasInvalid(
      someSelected ? groups.filter((_, i) => selected[i]) : groups
    );

  return (
    <CenteredModal
      title=""
      onClose={submitting ? () => { } : onClose}
      widthClass="max-w-[1360px] w-[95vw]"
      hideCloseButton
      hideHeader
      bodyClassName="p-4 sm:p-5 md:p-6 bg-white max-h-[80vh] overflow-auto"
    >
      {/* Esto “tapa” el header default del CenteredModal (X solita + línea) */}
      <div className="relative -mt-14 sm:-mt-16">
        {/* Barra de cobertura (blanca) */}
        <div className="h-14 sm:h-16 bg-white" />

        {/* Contenido real (todo en blanco, sin fondo gris) */}
        <div className="bg-white rounded-2xl">
          {/* Header principal (con nuestra X, ya no queda solita arriba) */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                    <Icon
                      icon="vaadin:stock"
                      width="22"
                      height="22"
                      className="text-primary"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                      Validación de datos
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Datos ingresados del excel, última validación
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-[12px] text-slate-700">
                    <span className="text-slate-500 font-semibold">Total:</span>
                    <span className="font-bold tabular-nums">
                      {groups.length}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-semibold">
                      Válidos:
                    </span>
                    <span className="font-bold tabular-nums">
                      {totalValidosHeader}
                    </span>
                  </span>

                  {/* Nuestra X integrada (sin línea rara arriba) */}
                  <button
                    type="button"
                    onClick={() => !submitting && onClose()}
                    className={`w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-700 ${submitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    aria-label="Cerrar"
                    title="Cerrar"
                    disabled={submitting}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-5 sm:px-6 py-4 bg-white">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      ref={headerChkRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-400 text-primary focus:ring-primary/30"
                    />
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-slate-800">
                        Seleccionar todo
                      </div>
                      <div className="text-xs text-slate-500">
                        Selecciona filas para importar o eliminar
                      </div>
                    </div>
                  </label>

                  <Buttonx
                    variant="outlined"
                    label="Eliminar seleccionadas"
                    icon="tabler:trash"
                    disabled={!someSelected}
                    onClick={() => setShowDeleteConfirm(true)}
                    className={[
                      "!h-10 !px-4 !text-sm",
                      "!border-rose-300 !text-rose-600 hover:!bg-rose-50",
                      !someSelected
                        ? "opacity-50 cursor-not-allowed hover:!bg-transparent"
                        : "",
                    ].join(" ")}
                  />
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Campos inválidos / requeridos
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Categoría no encontrada en catálogo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm delete modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
              <div className="w-full max-w-[420px] rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
                <div className="px-5 py-4 bg-white border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 shadow-sm flex items-center justify-center shrink-0">
                      <Icon
                        icon="tabler:alert-circle"
                        width="22"
                        className="text-rose-600"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-slate-900">
                        Confirmar eliminación
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        Esta acción no se puede deshacer.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 bg-white">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    ¿Estás seguro que deseas eliminar las filas seleccionadas?
                  </p>

                  <div className="mt-4 flex justify-end gap-2">
                    <Buttonx
                      variant="outlined"
                      label="Cancelar"
                      icon="mdi:close"
                      onClick={() => setShowDeleteConfirm(false)}
                    />
                    <Buttonx
                      variant="secondary"
                      label="Eliminar"
                      icon="tabler:trash"
                      onClick={() => {
                        setGroups((prev) =>
                          prev.filter((_, i) => !selected[i])
                        );
                        setSelected({});
                        setShowDeleteConfirm(false);
                      }}
                      className="!bg-rose-600 hover:!bg-rose-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table card */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Vista previa
                  </div>
                  <div className="text-xs text-slate-500">
                    Edita en línea y corrige los campos marcados
                  </div>
                </div>

                {someSelected ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                    <span className="font-semibold text-slate-500">
                      Seleccionadas:
                    </span>
                    <span className="font-bold tabular-nums">
                      {groups.filter((_, i) => selected[i]).length}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                    <span className="font-semibold text-slate-500">Modo:</span>
                    <span className="font-bold">Importar todo</span>
                  </span>
                )}
              </div>
            </div>

            {/* Scroll table */}
            <div className="max-h-[60vh] overflow-auto bg-white">
              <table className="w-full table-fixed text-sm bg-white">
                <colgroup>
                  <col className="w-9" />
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                  <tr className="text-[12px] font-bold">
                    <th className="p-3 border-b border-gray-200" />
                    <th className="p-3 text-left border-b border-gray-200">
                      Nombre de Producto
                    </th>
                    <th className="p-3 text-left border-b border-gray-200">
                      Descripción
                    </th>
                    <th className="p-3 text-left border-b border-gray-200">
                      Categoría
                    </th>
                    <th className="p-3 text-right border-b border-gray-200">
                      Precio
                    </th>
                    <th className="p-3 text-right border-b border-gray-200">
                      Cantidad
                    </th>
                    <th className="p-3 text-right border-b border-gray-200">
                      Stock mínimo
                    </th>
                    <th className="p-3 text-right border-b border-gray-200">
                      Peso
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {groups.map((g, gi) => {
                    const inv = invalidField(g);

                    const baseInput =
                      "w-full rounded-lg px-2 py-1.5 bg-transparent border border-transparent " +
                      "focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 " +
                      "hover:bg-white/60 transition-colors outline-none";

                    return (
                      <tr
                        key={gi}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="p-3 align-top">
                          <input
                            type="checkbox"
                            checked={!!selected[gi]}
                            onChange={() => toggleRow(gi)}
                            className="h-4 w-4 rounded-[4px] border-gray-400 text-primary focus:ring-primary/30"
                          />
                        </td>

                        {/* N. Producto */}
                        <td className="p-3 align-top">
                          <input
                            value={g.nombre_producto ?? ""}
                            onChange={(e) =>
                              patchGroup(gi, {
                                nombre_producto: e.target.value,
                              })
                            }
                            className={[
                              baseInput,
                              inv.nombre_producto ? "bg-rose-50" : "",
                            ].join(" ")}
                          />
                          {suggestionsMap[gi] && (
                            <div
                              className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200"
                              onClick={() => applySuggestion(gi, suggestionsMap[gi]!)}
                              title="Click para usar este nombre"
                            >
                              <span>Productos parecidos: <strong>{suggestionsMap[gi]}</strong></span>
                            </div>
                          )}
                        </td>

                        {/* Descripción */}
                        <td className="p-3 align-top">
                          <input
                            value={g.descripcion ?? ""}
                            onChange={(e) =>
                              patchGroup(gi, { descripcion: e.target.value })
                            }
                            className={baseInput}
                          />
                        </td>

                        {/* Categoría */}
                        <td
                          className={[
                            "p-3 align-top",
                            colorCategoria(g.categoria),
                          ].join(" ")}
                        >
                          <input
                            value={g.categoria ?? ""}
                            list={`cat-${gi}`}
                            onChange={(e) =>
                              patchGroup(gi, { categoria: e.target.value })
                            }
                            className={baseInput}
                          />
                          <datalist id={`cat-${gi}`}>
                            {categoriaNames.map((n) => (
                              <option key={n} value={n} />
                            ))}
                          </datalist>
                        </td>

                        {/* Precio */}
                        <td className="p-3 align-top text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={g.precio ?? ""}
                            onChange={(e) =>
                              patchGroup(gi, { precio: Number(e.target.value) })
                            }
                            className={[
                              baseInput,
                              "text-right",
                              !Number.isFinite(toNumber(g.precio)) ||
                                toNumber(g.precio) < 0
                                ? "bg-rose-50"
                                : "",
                            ].join(" ")}
                          />
                        </td>

                        {/* Cantidad */}
                        <td className="p-3 align-top text-right">
                          <input
                            type="number"
                            min={0}
                            value={g.cantidad ?? ""}
                            onChange={(e) =>
                              patchGroup(gi, {
                                cantidad: Math.trunc(
                                  Number(e.target.value) || 0
                                ),
                              })
                            }
                            className={[
                              baseInput,
                              "text-right",
                              !Number.isInteger(toInt(g.cantidad)) ||
                                toInt(g.cantidad) < 0
                                ? "bg-rose-50"
                                : "",
                            ].join(" ")}
                          />
                        </td>

                        {/* Stock mínimo */}
                        <td className="p-3 align-top text-right">
                          <input
                            type="number"
                            min={0}
                            value={g.stock_minimo ?? ""}
                            onChange={(e) =>
                              patchGroup(gi, {
                                stock_minimo: Math.trunc(
                                  Number(e.target.value) || 0
                                ),
                              })
                            }
                            className={[
                              baseInput,
                              "text-right",
                              !Number.isInteger(toInt(g.stock_minimo)) ||
                                toInt(g.stock_minimo) < 0
                                ? "bg-rose-50"
                                : "",
                            ].join(" ")}
                          />
                        </td>

                        {/* Peso */}
                        <td className="p-3 align-top text-right">
                          <input
                            type="number"
                            step={0.001}
                            value={g.peso ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const n = parsePeso(raw);
                              patchGroup(gi, {
                                peso: Number.isFinite(n)
                                  ? (n as any)
                                  : (raw as any),
                              });
                            }}
                            className={[
                              baseInput,
                              "text-right",
                              !Number.isFinite(parsePeso(g.peso)) ||
                                parsePeso(g.peso) < 0
                                ? "bg-rose-50"
                                : "",
                            ].join(" ")}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <Icon
                  icon="tabler:alert-triangle"
                  width="18"
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="font-bold">Revisar datos</div>
                  <div className="mt-0.5">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-end gap-2">
            {submitting && (
              <div className="flex-1 mr-4">
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <Buttonx
              variant="outlined"
              label="Cancelar"
              icon="mdi:close"
              onClick={onClose}
              disabled={submitting}
            />

            <Buttonx
              variant="secondary"
              label={submitting ? "Importando…" : "Cargar Datos"}
              icon={
                submitting
                  ? "line-md:loading-twotone-loop"
                  : "mdi:cloud-upload-outline"
              }
              onClick={confirmarImportacion}
              disabled={disabledImport}
              className={submitting ? "[&_svg]:animate-spin" : ""}
            />
          </div>
        </div>
      </div>
    </CenteredModal>
  );
}
