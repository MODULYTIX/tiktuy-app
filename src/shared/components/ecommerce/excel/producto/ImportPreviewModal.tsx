import { useMemo, useRef, useState, useEffect } from 'react';
import type {
  ImportProductosPayload,
  PreviewProductoDTO,
  PreviewProductosResponseDTO,
} from '@/services/ecommerce/importExcelProducto/importexcel.type';
import type { Option } from '@/shared/common/Autocomplete';
import CenteredModal from '@/shared/common/CenteredModal';
import { importProductosDesdePreview } from '@/services/ecommerce/importExcelProducto/importexcel.api';
import { Icon } from '@iconify/react/dist/iconify.js';

type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  data: PreviewProductosResponseDTO;
  onImported: () => void;
  preloadedAlmacenOptions?: Option[];
  preloadedCategoriaOptions?: Option[];
};

export default function ImportProductosPreviewModal({
  open,
  onClose,
  token,
  data,
  onImported,
  preloadedAlmacenOptions = [],
  preloadedCategoriaOptions = [],
}: Props) {
  // ----------------- STATE -----------------
  const initialPreview: PreviewProductoDTO[] = Array.isArray(data?.preview) ? data.preview : [];
  const [groups, setGroups] = useState<PreviewProductoDTO[]>(initialPreview);

  useEffect(() => {
    setGroups(Array.isArray(data?.preview) ? data.preview : []);
  }, [data]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriaNames = useMemo(
    () => (preloadedCategoriaOptions ?? []).map(o => o.label),
    [preloadedCategoriaOptions]
  );
  const almacenNames = useMemo(
    () => (preloadedAlmacenOptions ?? []).map(o => o.label),
    [preloadedAlmacenOptions]
  );

  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected  = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);
  const headerChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerChkRef.current) {
      headerChkRef.current.indeterminate = !allSelected && someSelected;
    }
  }, [allSelected, someSelected]);

  const toggleRow  = (idx: number) => setSelected(prev => ({ ...prev, [idx]: !prev[idx] }));
  const toggleAll  = () => setSelected(allSelected ? {} : Object.fromEntries(groups.map((_, i) => [i, true])));

  // ----------------- VALIDATION (misma lógica) -----------------
  const norm = (s: string) =>
    (s ?? '').toString().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const categoriaSet = useMemo(() => new Set(categoriaNames.map(norm)), [categoriaNames]);
  const almacenSet   = useMemo(() => new Set(almacenNames.map(norm)),   [almacenNames]);

  const isEmpty  = (s: unknown) => String(s ?? '').trim().length === 0;
  const toNumber = (v: any) => (v === '' || v == null ? NaN : Number(v));
  const toInt    = (v: any) => {
    const n = toNumber(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };

  const invalidField = (g: PreviewProductoDTO) => {
    const precio    = toNumber(g.precio);
    const cantidad  = toInt(g.cantidad);
    const stockMin  = toInt(g.stock_minimo);
    const peso      = toNumber(g.peso);
    return {
      nombre_producto: isEmpty(g.nombre_producto),
      categoria: isEmpty(g.categoria),
      almacen:   isEmpty(g.almacen),
      precio:    !(Number.isFinite(precio)    && precio    >= 0),
      cantidad:  !(Number.isInteger(cantidad) && cantidad  >= 0),
      stock_minimo: !(Number.isInteger(stockMin) && stockMin >= 0),
      peso:      !(Number.isFinite(peso)      && peso      >= 0),
    };
  };

  const recomputeValido = (g: PreviewProductoDTO) => {
    const inv = invalidField(g);
    return !(
      inv.nombre_producto ||
      inv.categoria ||
      inv.almacen ||
      inv.precio ||
      inv.cantidad ||
      inv.stock_minimo ||
      inv.peso
    );
  };

  const recomputeErrores = (g: PreviewProductoDTO) => {
    const inv = invalidField(g);
    const e: string[] = [];
    if (inv.nombre_producto) e.push('Campo requerido: Nombre');
    if (inv.categoria)       e.push('Campo requerido: Categoria');
    if (inv.almacen)         e.push('Campo requerido: Almacen');
    if (inv.precio)          e.push('Precio inválido (>= 0)');
    if (inv.cantidad)        e.push('Cantidad inválida (≥ 0)');
    if (inv.stock_minimo)    e.push('Stock mínimo inválido (≥ 0)');
    if (inv.peso)            e.push('Peso inválido (≥ 0)');
    return e;
  };

  // “semáforo” visual suave sin tocar la lógica
  const bgWarnFromCatalog = (has: boolean, value: string | null | undefined) => {
    const v = String(value ?? '').trim();
    if (!v) return 'bg-red-50';
    return has ? '' : 'bg-amber-50';
  };
  const colorCategoria = (value?: string | null) => bgWarnFromCatalog(categoriaSet.has(norm(String(value ?? ''))), value);
  const colorAlmacen   = (value?: string | null) => bgWarnFromCatalog(almacenSet.has(norm(String(value ?? ''))), value);

  // ----------------- PATCH (misma lógica) -----------------
  const patchGroup = (idx: number, patch: Partial<PreviewProductoDTO>) => {
    setGroups(prev =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const next = { ...g, ...patch };
        next.valido = recomputeValido(next);
        next.errores = next.valido ? [] : recomputeErrores(next);
        return next;
      })
    );
  };

  const applyToSelected = (patch: Partial<PreviewProductoDTO>) => {
    setGroups(prev =>
      prev.map((g, i) => {
        if (!selected[i]) return g;
        const next = { ...g, ...patch };
        next.valido = recomputeValido(next);
        next.errores = next.valido ? [] : recomputeErrores(next);
        return next;
      })
    );
  };

  const computeHasInvalid = (arr: PreviewProductoDTO[]) => arr.some(g => !recomputeValido(g));
  const computeTotalValid = (arr: PreviewProductoDTO[]) => arr.filter(g => recomputeValido(g)).length;
  const allRowsTotalValidos = useMemo(() => computeTotalValid(groups), [groups]);

  // ----------------- SUBMIT (misma lógica) -----------------
  const confirmarImportacion = async () => {
    setError(null);

    let groupsToSend = someSelected ? groups.filter((_, i) => selected[i]) : groups;

    groupsToSend = groupsToSend.map(g => {
      const valido = recomputeValido(g);
      return { ...g, valido, errores: valido ? [] : recomputeErrores(g) };
    });

    const firstEmpty = groupsToSend.find(g => isEmpty(g.categoria) || isEmpty(g.almacen));
    if (firstEmpty) {
      setError(`Hay filas con "Categoría" o "Almacén" vacíos (p.ej. fila Excel ${firstEmpty.fila}).`);
      return;
    }
    const hasInvalid = computeHasInvalid(groupsToSend);
    if (hasInvalid) {
      setError('Hay datos inválidos o faltantes en las filas seleccionadas. Corrige los campos en rojo.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: ImportProductosPayload = { groups: groupsToSend };
      console.log('[IMPORT:UI] Payload a enviar (productos):', JSON.parse(JSON.stringify(payload)));
      await importProductosDesdePreview(payload, token);
      onImported();
      onClose();
    } catch (e: any) {
      console.error('[IMPORT:UI] Error importando productos:', e);
      setError(e?.message || 'Error al importar productos');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  const totalValidosHeader = allRowsTotalValidos;

  // ----------------- UI (diseño “perfecto”) -----------------
  return (
    <CenteredModal title="" onClose={onClose} widthClass="max-w-[1360px] w-[95vw]">
      {/* Header */}
      <div className="flex items-start gap-3 text-[#1F2A44] mb-2">
        <div className="mt-0.5">
          <Icon icon="vaadin:stock" width="20" height="20" />
        </div>
        <div>
          <h2 className="uppercase tracking-wide font-bold text-[20px] leading-6">
            Validación de datos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Datos ingresados del excel, última validación
          </p>
        </div>
        <div className="ml-auto text-sm bg-gray-50 rounded px-2 py-1">
          <b>Total:</b> {groups.length} · <b>Válidos:</b> {totalValidosHeader}
        </div>
      </div>

      {/* Barra masiva (look de select) */}
      <div className="mt-3 mb-4 rounded-lg border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          <div className="flex items-center">
            <input
              ref={headerChkRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded-[4px]"
              title="Seleccionar todo"
            />
          </div>

          {/* N. Producto */}
          <div className="relative">
            <input
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) applyToSelected({ nombre_producto: val });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Descripción */}
          <div className="relative">
            <input
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyToSelected({ descripcion: (e.target as HTMLInputElement).value });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Categoría */}
          <div className="relative">
            <input
              list="categorias-sugeridas"
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) applyToSelected({ categoria: v });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <datalist id="categorias-sugeridas">
              {categoriaNames.map((n) => <option key={n} value={n} />)}
            </datalist>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Almacén */}
          <div className="relative">
            <input
              list="almacenes-sugeridos"
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) applyToSelected({ almacen: v });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <datalist id="almacenes-sugeridos">
              {almacenNames.map((n) => <option key={n} value={n} />)}
            </datalist>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Precio */}
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(n)) applyToSelected({ precio: n });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Cantidad */}
          <div className="relative">
            <input
              type="number"
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(n)) applyToSelected({ cantidad: Math.trunc(n) });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Stock mínimo */}
          <div className="relative">
            <input
              type="number"
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(n)) applyToSelected({ stock_minimo: Math.trunc(n) });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>

          {/* Peso */}
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="Seleccionar"
              className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 placeholder:text-gray-400 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20 focus:border-[#1F2A44]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(n)) applyToSelected({ peso: n });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">▾</span>
          </div>
        </div>
      </div>

      {/* Tabla “texto editable” */}
      <div className="rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>

          <thead>
            <tr className="sticky top-0 z-10 bg-[#F3F6FA] text-[13px] font-semibold text-gray-600">
              <th className="border-b border-gray-200 px-2 py-3" />
              <th className="border-b border-gray-200 px-3 py-3 text-left">N. Producto</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Descripción</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Categoría</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Almacén</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Precio</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Cantidad</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Stock mínimo</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Peso</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, gi) => {
              const inv = invalidField(g);
              return (
                <tr key={gi} className="odd:bg-white even:bg-gray-50 hover:bg-[#F8FAFD] transition-colors duration-150">
                  <td className="border-b border-gray-200 px-2 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={!!selected[gi]}
                      onChange={() => toggleRow(gi)}
                      className="h-4 w-4 rounded-[4px]"
                    />
                  </td>

                  {/* N. Producto */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      value={g.nombre_producto ?? ''}
                      onChange={(e) => patchGroup(gi, { nombre_producto: e.target.value })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${inv.nombre_producto ? 'bg-red-50' : ''}`}
                      title={String(g.nombre_producto ?? '')}
                    />
                  </td>

                  {/* Descripción */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      value={g.descripcion ?? ''}
                      onChange={(e) => patchGroup(gi, { descripcion: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={String(g.descripcion ?? '')}
                    />
                  </td>

                  {/* Categoría */}
                  <td className={`border-b border-gray-200 px-3 py-2 align-middle ${colorCategoria(g.categoria)}`}>
                    <input
                      list={`categorias-row-${gi}`}
                      value={g.categoria ?? ''}
                      onChange={(e) => patchGroup(gi, { categoria: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={String(g.categoria ?? '')}
                    />
                    <datalist id={`categorias-row-${gi}`}>
                      {categoriaNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </td>

                  {/* Almacén */}
                  <td className={`border-b border-gray-200 px-3 py-2 align-middle ${colorAlmacen(g.almacen)}`}>
                    <input
                      list={`almacenes-row-${gi}`}
                      value={g.almacen ?? ''}
                      onChange={(e) => patchGroup(gi, { almacen: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={String(g.almacen ?? '')}
                    />
                    <datalist id={`almacenes-row-${gi}`}>
                      {almacenNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </td>

                  {/* Precio */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right tabular-nums">
                    <input
                      type="number"
                      step="0.01"
                      value={g.precio ?? 0}
                      onChange={(e) => patchGroup(gi, { precio: Number(e.target.value) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${!Number.isFinite(toNumber(g.precio)) || toNumber(g.precio) < 0 ? 'bg-red-50' : ''}`}
                      title={String(g.precio ?? '')}
                    />
                  </td>

                  {/* Cantidad */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right tabular-nums">
                    <input
                      type="number"
                      min={0}
                      value={g.cantidad ?? 0}
                      onChange={(e) => patchGroup(gi, { cantidad: Math.trunc(Number(e.target.value) || 0) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${!Number.isInteger(toInt(g.cantidad)) || toInt(g.cantidad) < 0 ? 'bg-red-50' : ''}`}
                      title={String(g.cantidad ?? '')}
                    />
                  </td>

                  {/* Stock mínimo */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right tabular-nums">
                    <input
                      type="number"
                      min={0}
                      value={g.stock_minimo ?? 0}
                      onChange={(e) => patchGroup(gi, { stock_minimo: Math.trunc(Number(e.target.value) || 0) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${!Number.isInteger(toInt(g.stock_minimo)) || toInt(g.stock_minimo) < 0 ? 'bg-red-50' : ''}`}
                      title={String(g.stock_minimo ?? '')}
                    />
                  </td>

                  {/* Peso */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right tabular-nums">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={g.peso ?? 0}
                      onChange={(e) => patchGroup(gi, { peso: Number(e.target.value) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${!Number.isFinite(toNumber(g.peso)) || toNumber(g.peso) < 0 ? 'bg-red-50' : ''}`}
                      title={String(g.peso ?? '')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-4 pt-3 ">
        <button onClick={onClose} className="px-4 h-10 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
          Cerrar
        </button>
        <button
          onClick={confirmarImportacion}
          disabled={submitting || computeHasInvalid(someSelected ? groups.filter((_, i) => selected[i]) : groups)}
          className="px-5 h-10 text-sm rounded-md bg-[#1F2A44] text-white hover:bg-[#182238] disabled:opacity-60"
          title={computeHasInvalid(someSelected ? groups.filter((_, i) => selected[i]) : groups) ? 'Corrige los campos en rojo' : ''}
        >
          {submitting ? 'Importando…' : 'Cargar Datos'}
        </button>
      </div>

      <style>{`
        table td, table th { border-right: 1px solid #eef0f2; }
        thead tr th:last-child, tbody tr td:last-child { border-right: none; }
      `}</style>
    </CenteredModal>
  );
}
