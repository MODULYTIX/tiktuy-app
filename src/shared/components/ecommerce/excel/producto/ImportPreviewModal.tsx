import { useMemo, useRef, useState, useEffect } from 'react';
import type { ImportProductosPayload, PreviewProductoDTO, PreviewProductosResponseDTO } from '@/services/ecommerce/importExcelProducto/importexcel.type';
import type { Option } from '@/shared/common/Autocomplete';
import { importProductosDesdePreview } from '@/services/ecommerce/importExcelProducto/importexcel.api';
import CenteredModal from '@/shared/common/CenteredModal';

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
  const initialPreview: PreviewProductoDTO[] = Array.isArray(data?.preview) ? data.preview : [];
  const [groups, setGroups] = useState<PreviewProductoDTO[]>(initialPreview);

  useEffect(() => {
    setGroups(Array.isArray(data?.preview) ? data.preview : []);
  }, [data]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriaNames = useMemo(() => (preloadedCategoriaOptions ?? []).map(o => o.label), [preloadedCategoriaOptions]);
  const almacenNames   = useMemo(() => (preloadedAlmacenOptions   ?? []).map(o => o.label), [preloadedAlmacenOptions]);

  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected  = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);
  const headerChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerChkRef.current) {
      headerChkRef.current.indeterminate = !allSelected && someSelected;
    }
  }, [allSelected, someSelected]);

  const toggleRow  = (idx: number) => setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  const toggleAll  = () => setSelected(allSelected ? {} : Object.fromEntries(groups.map((_, i) => [i, true])));

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

  const colorCategoria = (value: string | null | undefined) => {
    const v = String(value ?? '').trim();
    if (!v) return 'border-red-500 bg-red-50';
    return categoriaSet.has(norm(v)) ? '' : 'border-amber-500 bg-amber-50';
  };
  const colorAlmacen = (value: string | null | undefined) => {
    const v = String(value ?? '').trim();
    if (!v) return 'border-red-500 bg-red-50';
    return almacenSet.has(norm(v)) ? '' : 'border-amber-500 bg-amber-50';
  };

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

  const applyToSelected = (patch: Partial<PreviewProductoDTO>) => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (!selected[i]) return g;
        const next = { ...g, ...patch };
        next.valido = recomputeValido(next);
        next.errores = next.valido ? [] : recomputeErrores(next);
        return next;
      })
    );
  };

  // Nota: calcularemos invalidez sobre lo que se enviará (seleccionadas o todas)
  const computeHasInvalid = (arr: PreviewProductoDTO[]) => arr.some((g) => !recomputeValido(g));
  const computeTotalValid = (arr: PreviewProductoDTO[]) => arr.filter((g) => recomputeValido(g)).length;

  const allRowsTotalValidos = useMemo(() => computeTotalValid(groups), [groups]);

  const confirmarImportacion = async () => {
    setError(null);

    // Determina qué filas se envían
    let groupsToSend = someSelected ? groups.filter((_, i) => selected[i]) : groups;

    // Sincroniza valido/errores antes de enviar
    groupsToSend = groupsToSend.map((g) => {
      const valido = recomputeValido(g);
      return { ...g, valido, errores: valido ? [] : recomputeErrores(g) };
    });

    // Validación previa UI (solo lo que se enviará)
    const firstEmpty = groupsToSend.find((g) => isEmpty(g.categoria) || isEmpty(g.almacen));
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

  // Para el header “Válidos” mostramos el total sobre todas las filas visibles
  const totalValidosHeader = allRowsTotalValidos;

  return (
    <CenteredModal title="Validación de productos" onClose={onClose} widthClass="max-w-[1200px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="ml-auto text-sm bg-gray-50 rounded px-2 py-1">
          <b>Total:</b> {groups.length} · <b>Válidos:</b> {totalValidosHeader}
        </div>
      </div>

      {/* Fila de “Seleccionar / aplicar masivo” */}
      <div className="border rounded-t overflow-hidden">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-[22%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead>
            <tr className="bg-white">
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  ref={headerChkRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  title="Seleccionar todo"
                />
              </th>

              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Nombre de producto (Enter para aplicar)"
                  className="w-full border rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) applyToSelected({ nombre_producto: val });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Descripción (Enter para aplicar)"
                  className="w-full border rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyToSelected({ descripcion: (e.target as HTMLInputElement).value });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Categoría (masivo) con datalist */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  list="categorias-sugeridas"
                  placeholder="Categoría (escribe o elige y Enter)"
                  className="w-full border rounded px-2 py-1"
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
              </th>

              {/* Almacén (masivo) con datalist */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  list="almacenes-sugeridos"
                  placeholder="Almacén (escribe o elige y Enter)"
                  className="w-full border rounded px-2 py-1"
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
              </th>

              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  className="w-full border rounded px-2 py-1 text-right"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) applyToSelected({ precio: n });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  placeholder="Cantidad"
                  className="w-full border rounded px-2 py-1 text-right"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) applyToSelected({ cantidad: Math.trunc(n) });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  placeholder="Stock mínimo"
                  className="w-full border rounded px-2 py-1 text-right"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) applyToSelected({ stock_minimo: Math.trunc(n) });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              <th className="hidden" />
            </tr>
          </thead>
        </table>
      </div>

      {/* Tabla */}
      <div className="border-x border-b rounded-b overflow-auto max-h-[55vh]">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-[22%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>

          <thead>
            <tr className="sticky top-0 z-10 bg-gray-100 text-xs font-medium">
              <th className="border-b border-gray-200 px-2 py-2" />
              <th className="border-b border-gray-200 px-2 py-2 text-left">N. Producto</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Descripción</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Categoría</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Almacén</th>
              <th className="border-b border-gray-200 px-2 py-2 text-right">Precio</th>
              <th className="border-b border-gray-200 px-2 py-2 text-right">Cantidad</th>
              <th className="border-b border-gray-200 px-2 py-2 text-right">Stock mínimo</th>
              <th className="border-b border-gray-200 px-2 py-2 text-right">Peso</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, gi) => {
              const inv = invalidField(g);
              return (
                <tr key={gi} className="odd:bg-white even:bg-gray-50">
                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="checkbox"
                      checked={!!selected[gi]}
                      onChange={() => toggleRow(gi)}
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      value={g.nombre_producto ?? ''}
                      onChange={(e) => patchGroup(gi, { nombre_producto: e.target.value })}
                      className={`w-full border rounded px-2 py-1 ${inv.nombre_producto ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      value={g.descripcion ?? ''}
                      onChange={(e) => patchGroup(gi, { descripcion: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>

                  {/* Categoría (free text + datalist) */}
                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      list={`categorias-row-${gi}`}
                      value={g.categoria ?? ''}
                      onChange={(e) => patchGroup(gi, { categoria: e.target.value })}
                      placeholder="Categoría"
                      className={`w-full border rounded px-2 py-1 ${colorCategoria(g.categoria)}`}
                    />
                    <datalist id={`categorias-row-${gi}`}>
                      {categoriaNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </td>

                  {/* Almacén (free text + datalist) */}
                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      list={`almacenes-row-${gi}`}
                      value={g.almacen ?? ''}
                      onChange={(e) => patchGroup(gi, { almacen: e.target.value })}
                      placeholder="Almacén"
                      className={`w-full border rounded px-2 py-1 ${colorAlmacen(g.almacen)}`}
                    />
                    <datalist id={`almacenes-row-${gi}`}>
                      {almacenNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="number"
                      step="0.01"
                      value={g.precio ?? 0}
                      onChange={(e) => patchGroup(gi, { precio: Number(e.target.value) })}
                      className={`w-full border rounded px-2 py-1 text-right ${inv.precio ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="number"
                      min={0}
                      value={g.cantidad ?? 0}
                      onChange={(e) => patchGroup(gi, { cantidad: Math.trunc(Number(e.target.value) || 0) })}
                      className={`w-full border rounded px-2 py-1 text-right ${inv.cantidad ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="number"
                      min={0}
                      value={g.stock_minimo ?? 0}
                      onChange={(e) => patchGroup(gi, { stock_minimo: Math.trunc(Number(e.target.value) || 0) })}
                      className={`w-full border rounded px-2 py-1 text-right ${inv.stock_minimo ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={g.peso ?? 0}
                      onChange={(e) => patchGroup(gi, { peso: Number(e.target.value) })}
                      className={`w-full border rounded px-2 py-1 text-right ${inv.peso ? 'border-red-500 bg-red-50' : ''}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">
          Cerrar
        </button>
        <button
          onClick={confirmarImportacion}
          // Deshabilita si hay inválidos en lo que se enviará (seleccionadas o todas)
          disabled={submitting || computeHasInvalid(someSelected ? groups.filter((_, i) => selected[i]) : groups)}
          className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          title={computeHasInvalid(someSelected ? groups.filter((_, i) => selected[i]) : groups) ? 'Corrige los campos en rojo' : ''}
        >
          {submitting ? 'Importando…' : 'Importar productos'}
        </button>
      </div>

      <style>{`
        table td, table th { border-right: 1px solid #eef0f2; }
        thead tr th:last-child, tbody tr td:last-child { border-right: none; }
        tbody tr:last-child td { border-bottom: 1px solid #eef0f2; }
      `}</style>
    </CenteredModal>
  );
}
