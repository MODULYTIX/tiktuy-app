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

// Normaliza un valor a T[]
function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object') {
    const o = val as any;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.data)) return o.data as T[];
  }
  return [];
}

export default function ImportProductosPreviewModal({
  open,
  onClose,
  token,
  data,
  onImported,
  preloadedCategoriaOptions = [],
}: Props) {
  // ----------------- STATE -----------------
  const initialPreview: PreviewProductoDTO[] = toArray<PreviewProductoDTO>(data?.preview);
  const [groups, setGroups] = useState<PreviewProductoDTO[]>(initialPreview);

  useEffect(() => {
    setGroups(toArray<PreviewProductoDTO>(data?.preview));
  }, [data]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriaNames = useMemo(
    () => toArray<Option>(preloadedCategoriaOptions as unknown).map(o => o.label),
    [preloadedCategoriaOptions]
  );

  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);

  const headerChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerChkRef.current)
      headerChkRef.current.indeterminate = !allSelected && someSelected;
  }, [allSelected, someSelected]);

  const toggleRow = (idx: number) =>
    setSelected(prev => ({ ...prev, [idx]: !prev[idx] }));

  const toggleAll = () =>
    setSelected(allSelected ? {} : Object.fromEntries(groups.map((_, i) => [i, true])));

  // Modal confirm delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ----------------- VALIDATION -----------------
  const norm = (s: string) =>
    (s ?? '').toString().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const categoriaSet = useMemo(() => new Set(categoriaNames.map(norm)), [categoriaNames]);

  const isEmpty = (s: unknown) => String(s ?? '').trim().length === 0;

  const toNumber = (v: any) => {
    if (v === '' || v == null) return NaN;
    let s = String(v).trim();
    s = s.replace(/,/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(/,/, '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const toInt = (v: any) => {
    const n = toNumber(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };

  const parsePeso = (v: any) => {
    if (v === '' || v == null) return NaN;
    const m = String(v).trim().match(/[\d.,]+/);
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
    if (inv.nombre_producto) e.push('Campo requerido: Nombre');
    if (inv.categoria) e.push('Campo requerido: Categoria');
    if (inv.precio) e.push('Precio inválido (>= 0)');
    if (inv.cantidad) e.push('Cantidad inválida (≥ 0)');
    if (inv.stock_minimo) e.push('Stock mínimo inválido (≥ 0)');
    if (inv.peso) e.push('Peso inválido (≥ 0)');
    return e;
  };

  const bgWarnFromCatalog = (has: boolean, val: string | null | undefined) => {
    const v = String(val ?? '').trim();
    if (!v) return 'bg-red-50';
    return has ? '' : 'bg-amber-50';
  };

  const colorCategoria = (value?: string | null) =>
    bgWarnFromCatalog(categoriaSet.has(norm(String(value ?? ''))), value);

  // ----------------- PATCH -----------------
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

  const computeHasInvalid = (arr: PreviewProductoDTO[]) =>
    arr.some(g => !recomputeValido(g));

  const computeTotalValid = (arr: PreviewProductoDTO[]) =>
    arr.filter(g => recomputeValido(g)).length;

  const totalValidosHeader = computeTotalValid(groups);

  // ----------------- SUBMIT -----------------
  const confirmarImportacion = async () => {
    setError(null);

    let groupsToSend = someSelected ? groups.filter((_, i) => selected[i]) : groups;

    groupsToSend = groupsToSend.map(g => {
      const valido = recomputeValido(g);
      return { ...g, valido, errores: valido ? [] : recomputeErrores(g) };
    });

    const empty = groupsToSend.find(g => isEmpty(g.categoria));
    if (empty) {
      setError(`Hay filas con "Categoría" vacía (p.ej. fila Excel ${empty.fila}).`);
      return;
    }

    if (computeHasInvalid(groupsToSend)) {
      setError('Hay datos inválidos o faltantes. Corrige los campos en rojo.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: ImportProductosPayload = { groups: groupsToSend };
      await importProductosDesdePreview(payload, token);
      onImported();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error al importar productos');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ----------------- UI -----------------
  return (
    <CenteredModal title="" onClose={onClose} widthClass="max-w-[1360px] w-[95vw]">

      {/* Header */}
      <div className="flex items-start gap-3 text-[#1F2A44] mb-2">
        <Icon icon="vaadin:stock" width="20" height="20" />
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

      {/* Barra superior elegante */}
      <div className="mt-3 mb-4 rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">

        {/* Checkbox general */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            ref={headerChkRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-400 text-[#1F2A44] focus:ring-[#1F2A44]"
          />
          <span className="text-[14px] text-gray-700 font-medium">
            Seleccionar todo
          </span>
        </label>

        {/* Botón eliminar profesional */}
        <button
          disabled={!someSelected}
          onClick={() => setShowDeleteConfirm(true)}
          className={`
            flex items-center gap-2 px-4 h-10 text-sm rounded-md border text-red-600 
            border-red-300 hover:bg-red-50 transition-all
            ${!someSelected ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}
          `}
        >
          <Icon icon="tabler:trash" width="18" />
          Eliminar seleccionadas
        </button>
      </div>

      {/* Modal elegante de confirmación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[380px] animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon="tabler:alert-circle" width="22" className="text-red-500" />
              Confirmar eliminación
            </h3>

            <p className="text-gray-600 text-sm mb-5">
              ¿Estás seguro que deseas eliminar las filas seleccionadas? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  setGroups(prev => prev.filter((_, i) => !selected[i]));
                  setSelected({});
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
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

          <thead>
            <tr className="sticky top-0 z-10 bg-[#F3F6FA] text-[13px] font-semibold text-gray-600">
              <th className="border-b px-2 py-3" />
              <th className="border-b px-3 py-3 text-left">N. Producto</th>
              <th className="border-b px-3 py-3 text-left">Descripción</th>
              <th className="border-b px-3 py-3 text-left">Categoría</th>
              <th className="border-b px-3 py-3 text-right">Precio</th>
              <th className="border-b px-3 py-3 text-right">Cantidad</th>
              <th className="border-b px-3 py-3 text-right">Stock mínimo</th>
              <th className="border-b px-3 py-3 text-right">Peso</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, gi) => {
              const inv = invalidField(g);
              return (
                <tr key={gi} className="odd:bg-white even:bg-gray-50 hover:bg-[#F8FAFD] transition-colors">
                  <td className="border-b px-2 py-2">
                    <input
                      type="checkbox"
                      checked={!!selected[gi]}
                      onChange={() => toggleRow(gi)}
                      className="h-4 w-4 rounded-[4px]"
                    />
                  </td>

                  {/* N. Producto */}
                  <td className="border-b px-3 py-2">
                    <input
                      value={g.nombre_producto ?? ''}
                      onChange={(e) => patchGroup(gi, { nombre_producto: e.target.value })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate 
                        focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 
                        ${inv.nombre_producto ? 'bg-red-50' : ''}`}
                    />
                  </td>

                  {/* Descripción */}
                  <td className="border-b px-3 py-2">
                    <input
                      value={g.descripcion ?? ''}
                      onChange={(e) => patchGroup(gi, { descripcion: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate 
                      focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                    />
                  </td>

                  {/* Categoría */}
                  <td className={`border-b px-3 py-2 ${colorCategoria(g.categoria)}`}>
                    <input
                      value={g.categoria ?? ''}
                      list={`cat-${gi}`}
                      onChange={(e) => patchGroup(gi, { categoria: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate 
                      focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                    />
                    <datalist id={`cat-${gi}`}>
                      {categoriaNames.map(n => <option key={n} value={n} />)}
                    </datalist>
                  </td>

                  {/* Precio */}
                  <td className="border-b px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={g.precio ?? ''}
                      onChange={(e) => patchGroup(gi, { precio: Number(e.target.value) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right 
                        focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 
                        ${!Number.isFinite(toNumber(g.precio)) || toNumber(g.precio) < 0 ? 'bg-red-50' : ''}`}
                    />
                  </td>

                  {/* Cantidad */}
                  <td className="border-b px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={g.cantidad ?? ''}
                      onChange={(e) => patchGroup(gi, { cantidad: Math.trunc(Number(e.target.value) || 0) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right 
                        focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 
                        ${!Number.isInteger(toInt(g.cantidad)) || toInt(g.cantidad) < 0 ? 'bg-red-50' : ''}`}
                    />
                  </td>

                  {/* Stock mínimo */}
                  <td className="border-b px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={g.stock_minimo ?? ''}
                      onChange={(e) => patchGroup(gi, { stock_minimo: Math.trunc(Number(e.target.value) || 0) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right 
                        focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 
                        ${!Number.isInteger(toInt(g.stock_minimo)) || toInt(g.stock_minimo) < 0 ? 'bg-red-50' : ''}`}
                    />
                  </td>

                  {/* Peso */}
                  <td className="border-b px-3 py-2 text-right">
                    <input
                      type="text"
                      value={g.peso ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = parsePeso(raw);
                        patchGroup(gi, { peso: Number.isFinite(n) ? (n as any) : (raw as any) });
                      }}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right 
                        focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 
                        ${!Number.isFinite(parsePeso(g.peso)) || parsePeso(g.peso) < 0 ? 'bg-red-50' : ''}`}
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
      <div className="flex justify-end gap-2 mt-4 pt-3">
        <button
          onClick={onClose}
          className="px-4 h-10 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Cerrar
        </button>

        <button
          onClick={confirmarImportacion}
          disabled={
            submitting ||
            computeHasInvalid(someSelected ? groups.filter((_, i) => selected[i]) : groups)
          }
          className="px-5 h-10 text-sm rounded-md bg-[#1F2A44] text-white hover:bg-[#182238] disabled:opacity-60"
        >
          {submitting ? 'Importando…' : 'Cargar Datos'}
        </button>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn .15s ease-out;
        }

        table td, table th { border-right: 1px solid #eef0f2; }
        thead tr th:last-child, tbody tr td:last-child { border-right: none; }
      `}</style>

    </CenteredModal>
  );
}
