// src/shared/components/ecommerce/excel/ImportPreviewPedidosModal.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  fetchZonasByCourierPublic,
  fetchZonasByCourierPrivado,
} from '@/services/courier/zonaTarifaria/zonaTarifaria.api';
import { fetchCouriersAsociados } from '@/services/ecommerce/ecommerceCourier.api';

import CenteredModal from '@/shared/common/CenteredModal';
import Autocomplete, { type Option } from '@/shared/common/Autocomplete';
import type {
  ImportPayload,
  PreviewGroupDTO,
  PreviewResponseDTO,
} from '@/services/ecommerce/importexcelPedido/importexcelPedido.type';
import { importPedidosDesdePreview } from '@/services/ecommerce/importexcelPedido/importexcelPedido.api';
import { Icon } from '@iconify/react';

// ---------- helpers fecha local <-> ISO ----------
const toISOFromLocal = (local: string) => {
  if (!local) return '';
  const [date, time] = local.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
};
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
    dt.getHours()
  )}:${pad(dt.getMinutes())}`;
};

type CourierOption = { id: number; nombre: string };

export default function ImportPreviewPedidosModal({
  open,
  onClose,
  token,
  data,
  onImported,
  allowMultiCourier = true,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  data: PreviewResponseDTO;
  onImported: () => void;
  allowMultiCourier?: boolean;
}) {
  // ---------- estado / lógica original ----------
  const [groups, setGroups] = useState<PreviewGroupDTO[]>(data.preview);
  const [courierId, setCourierId] = useState<number | ''>('');
  const [trabajadorId] = useState<number | ''>('');
  const [estadoId] = useState<number | ''>('');
  const [distritos, setDistritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selección por fila
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);
  const headerChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerChkRef.current) headerChkRef.current.indeterminate = !allSelected && someSelected;
  }, [allSelected, someSelected]);

  const toggleRow = (idx: number) =>
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  const toggleAll = () => {
    if (allSelected) setSelected({});
    else {
      const next: Record<number, boolean> = {};
      groups.forEach((_, i) => (next[i] = true));
      setSelected(next);
    }
  };

  const norm = (s: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // couriers asociados
  const [localCouriers, setLocalCouriers] = useState<CourierOption[]>([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const list: any[] = await fetchCouriersAsociados(token);
        if (cancel) return;
        const activos = (list || []).filter(
          (c) =>
            c?.estado_asociacion?.toLowerCase?.() === 'activo' ||
            c?.estado_asociacion === undefined
        );
        const mapped: CourierOption[] = activos.map((c) => ({
          id: c.id,
          nombre: c.nombre_comercial,
        }));
        const seen = new Set<number>();
        setLocalCouriers(mapped.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))));
      } catch {
        if (!cancel) setLocalCouriers([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token]);

  // autoselección si modo single
  useEffect(() => {
    if (!allowMultiCourier && !courierId && localCouriers.length === 1) {
      setCourierId(localCouriers[0].id);
    }
  }, [allowMultiCourier, localCouriers, courierId]);

  const byCourierName = useMemo(() => {
    const map = new Map<string, CourierOption>();
    localCouriers.forEach((c) => map.set(norm(c.nombre), c));
    return map;
  }, [localCouriers]);
  useEffect(() => {
    if (allowMultiCourier || courierId || !groups?.length || !localCouriers.length) return;
    const firstMatch = groups.map((g) => byCourierName.get(norm(g.courier))).find(Boolean);
    if (firstMatch) setCourierId(firstMatch.id);
  }, [allowMultiCourier, courierId, groups, byCourierName, localCouriers.length]);

  // distritos sugeridos (solo single)
  useEffect(() => {
    let cancel = false;
    const toDistritoList = (arr: unknown): string[] =>
      Array.from(
        new Set(
          (Array.isArray(arr) ? arr : [])
            .map((z: any) => (typeof z?.distrito === 'string' ? z.distrito : ''))
            .filter((d): d is string => d.length > 0)
        )
      );
    (async () => {
      if (allowMultiCourier || !courierId) return setDistritos([]);
      try {
        const pub = await fetchZonasByCourierPublic(Number(courierId));
        if (cancel) return;
        const list = toDistritoList(pub);
        if (list.length) return setDistritos(list);
        const priv = await fetchZonasByCourierPrivado(Number(courierId), token);
        if (!cancel) setDistritos(toDistritoList(priv));
      } catch {
        if (!cancel) setDistritos([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [allowMultiCourier, courierId, token]);

  // opciones UI
  const courierOptions: Option[] = localCouriers.map((c) => ({ value: String(c.id), label: c.nombre }));
  const distritoOptions: Option[] = distritos.map((d) => ({ value: d, label: d }));

  // validaciones
  const isInvalidCourier = (s: string) =>
    !!s && !localCouriers.some((c) => norm(c.nombre) === norm(s));
  const isInvalidDistrito = (s: string) => !s || s.trim().length === 0;
  const isInvalidCantidad = (n: number | null) => n == null || Number.isNaN(n) || Number(n) <= 0;

  // patches (sin cambios)
  const patchGroup = (idx: number, patch: Partial<PreviewGroupDTO>) =>
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));

  const hasInvalid = useMemo(() => {
    if (!allowMultiCourier && typeof courierId !== 'number') return true;
    for (const g of groups) {
      if (isInvalidDistrito(g.distrito)) return true;
      if ((g.monto_total ?? 0) < 0) return true;
      for (const it of g.items) if (isInvalidCantidad(it.cantidad)) return true;
    }
    return false;
  }, [allowMultiCourier, groups, courierId]);

  const handleCantidad = (gIdx: number, iIdx: number, val: number) =>
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== gIdx
          ? g
          : { ...g, items: g.items.map((it, ii) => (ii === iIdx ? { ...it, cantidad: val } : it)) }
      )
    );

  const handleProductoNombre = (gIdx: number, iIdx: number, val: string) =>
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== gIdx
          ? g
          : {
              ...g,
              items: g.items.map((it, ii) =>
                ii === iIdx ? { ...it, producto: val, producto_id: undefined } : it
              ),
            }
      )
    );

  const applyToSelected = (patch: Partial<PreviewGroupDTO>) =>
    setGroups((prev) => prev.map((g, i) => (selected[i] ? { ...g, ...patch } : g)));

  const confirmarImportacion = async () => {
    setError(null);
    if (!allowMultiCourier && typeof courierId !== 'number') {
      setError('Selecciona un courier válido.');
      return;
    }
    if (hasInvalid) {
      setError('Hay datos inválidos o faltantes. Corrige los campos en rojo.');
      return;
    }
    const groupsToSend = Object.values(selected).some(Boolean)
      ? groups.filter((_, i) => selected[i])
      : groups;

    const payload: ImportPayload = {
      groups: groupsToSend,
      ...(allowMultiCourier ? {} : { courierId: courierId as number }),
      trabajadorId: trabajadorId ? Number(trabajadorId) : undefined,
      estadoId: estadoId ? Number(estadoId) : undefined,
    };

    try {
      setLoading(true);
      await importPedidosDesdePreview(payload, token);
      onImported();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // ---------- UI (diseño) ----------
  return (
    <CenteredModal title="" onClose={onClose} widthClass="max-w-[1400px] w-[95vw]">
      {/* Header visual superpuesto a la barra del modal para quedar a la MISMA altura que la “X” */}
      <div className="pb-3  border-gray-200 flex items-center gap-3">
        <span className="text-[#1F2A7A]">
          <Icon icon="vaadin:stock" width="22" height="22" />
        </span>
        <div className="text-[#1F2A7A]">
          <h2 className="uppercase tracking-wide font-bold text-[18px] leading-6">
            Validación de datos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Datos ingresados del excel, ultima validación
          </p>
        </div>
        <div className="ml-auto text-sm text-gray-600"></div>
      </div>

      {/* Barra superior (con los mismos campos) */}
      <div className="flex flex-wrap items-center gap-2 mb-3 mt-2">
        {!allowMultiCourier && (
          <select
            className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">
              {localCouriers.length ? 'Seleccionar Courier (requerido)' : 'Cargando couriers...'}
            </option>
            {localCouriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fila “Seleccionar / aplicar masivo” */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 mb-2">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="bg-white">
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  ref={headerChkRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded accent-amber-500"
                  title="Seleccionar todo"
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) applyToSelected({ nombre: v });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  list={!allowMultiCourier ? 'distritos-list' : undefined}
                  placeholder="Seleccionar"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  disabled={!allowMultiCourier && !(typeof courierId === 'number')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) applyToSelected({ distrito: v });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v) applyToSelected({ distrito: v });
                  }}
                />
                {!allowMultiCourier && (
                  <datalist id="distritos-list">
                    {distritos.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                )}
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) applyToSelected({ telefono: v });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) applyToSelected({ direccion: v });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) applyToSelected({ referencia: v });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const c = localCouriers.find((x) => String(x.id) === val);
                    if (c) applyToSelected({ courier: c.nombre });
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">Seleccionar</option>
                  {localCouriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <span className="text-gray-500">Producto</span>
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  placeholder="Cantidad"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) {
                        setGroups((prev) =>
                          prev.map((g, i) =>
                            !selected[i] ? g : { ...g, items: g.items.map((it) => ({ ...it, cantidad: n })) }
                          )
                        );
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Monto"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) applyToSelected({ monto_total: n });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="datetime-local"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2A44]/20"
                  onChange={(e) => {
                    const iso = toISOFromLocal(e.target.value);
                    if (iso) applyToSelected({ fecha_entrega: iso });
                    e.currentTarget.value = '';
                  }}
                />
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* ===== Tabla ===== */}
      <div className="rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
          </colgroup>

          <thead>
            <tr className="sticky top-0 z-10 bg-[#F3F6FA] text-xs font-semibold text-gray-600">
              <th className="border-b border-gray-200 px-2 py-3" />
              <th className="border-b border-gray-200 px-3 py-3 text-left">Nombre</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Distrito</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Celular</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Dirección</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Referencia</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Courier</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Producto</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Cantidad</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Monto</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Fec. Entrega</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, gi) => {
              const isNewDistrito =
                !!g.distrito && (!allowMultiCourier ? !distritos.some((d) => norm(d) === norm(g.distrito)) : false);
              const distritoClass = isNewDistrito ? 'border-amber-500 bg-amber-50 text-amber-700' : '';

              return (
                <tr key={gi} className="odd:bg-white even:bg-gray-50 hover:bg-[#F8FAFD] transition-colors duration-150">
                  <td className="border-b border-gray-200 px-2 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={!!selected[gi]}
                      onChange={() => toggleRow(gi)}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      value={g.nombre}
                      onChange={(e) => patchGroup(gi, { nombre: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={g.nombre}
                    />
                  </td>

                  <td className={`border-b border-gray-200 px-3 py-2 align-middle ${distritoClass}`}>
                    <Autocomplete
                      value={g.distrito || ''}
                      onChange={(v: string) => patchGroup(gi, { distrito: v })}
                      options={!allowMultiCourier ? distritoOptions : []}
                      placeholder="Distrito"
                      invalid={isInvalidDistrito(g.distrito)}
                      className="w-full"
                    />
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      value={g.telefono}
                      onChange={(e) => patchGroup(gi, { telefono: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={g.telefono}
                    />
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      value={g.direccion}
                      onChange={(e) => patchGroup(gi, { direccion: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={g.direccion}
                    />
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      value={g.referencia || ''}
                      onChange={(e) => patchGroup(gi, { referencia: e.target.value })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={g.referencia || ''}
                    />
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <Autocomplete
                      value={g.courier || ''}
                      onChange={(v: string) => patchGroup(gi, { courier: v })}
                      options={courierOptions}
                      placeholder="Courier"
                      invalid={!allowMultiCourier && isInvalidCourier(g.courier)}
                      className="w-full"
                    />
                    {allowMultiCourier && isInvalidCourier(g.courier) && g.courier ? (
                      <div className="text-[11px] text-amber-600 mt-1">
                        Nombre de courier no coincide con asociados. Se intentará resolver por similitud.
                      </div>
                    ) : null}
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <div className="space-y-1">
                      {g.items.map((it, ii) => (
                        <input
                          key={ii}
                          value={it.producto || ''}
                          placeholder="Nombre del producto"
                          onChange={(e) => handleProductoNombre(gi, ii, e.target.value)}
                          className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 truncate focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                          title={it.producto || ''}
                        />
                      ))}
                    </div>
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right">
                    <div className="space-y-1">
                      {g.items.map((it, ii) => (
                        <input
                          key={ii}
                          type="number"
                          min={0}
                          value={it.cantidad ?? 0}
                          onChange={(e) => handleCantidad(gi, ii, Number(e.target.value))}
                          className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${
                            isInvalidCantidad(it.cantidad) ? 'bg-red-50' : ''
                          }`}
                          title={String(it.cantidad ?? '')}
                        />
                      ))}
                    </div>
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={g.monto_total ?? 0}
                      onChange={(e) => patchGroup(gi, { monto_total: Number(e.target.value) })}
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${
                        (g.monto_total ?? 0) < 0 ? 'bg-red-50' : ''
                      }`}
                      title={String(g.monto_total ?? '')}
                    />
                  </td>

                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      type="datetime-local"
                      value={toLocalInput(g.fecha_entrega)}
                      onChange={(e) => patchGroup(gi, { fecha_entrega: toISOFromLocal(e.target.value) || undefined })}
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5 focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
                      title={toLocalInput(g.fecha_entrega)}
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
      <div className="flex justify-end gap-2 mt-4">
        <button className="px-4 h-10 text-sm rounded-md border border-gray-300 hover:bg-gray-50" onClick={onClose}>
          Cerrar
        </button>
        <button
          onClick={confirmarImportacion}
          disabled={loading || hasInvalid}
          className="px-5 h-10 text-sm rounded-md bg-[#1F2A44] text-white hover:bg-[#182238] disabled:opacity-60"
          title={hasInvalid ? 'Corrige los campos en rojo' : ''}
        >
          {loading ? 'Importando…' : allowMultiCourier ? 'Cargar Datos ' : 'Cargar Datos'}
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
