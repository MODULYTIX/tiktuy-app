// src/shared/components/ecommerce/excel/ImportPreviewPedidosModal.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  fetchZonasByCourierPublic,
  fetchZonasByCourierPrivado,
} from '@/services/courier/zonaTarifaria.api';
import { fetchCouriersAsociados } from '@/services/ecommerce/ecommerceCourier.api';

import CenteredModal from '@/shared/common/CenteredModal';
import Autocomplete, { type Option } from '@/shared/common/Autocomplete';
import type { ImportPayload, PreviewGroupDTO, PreviewResponseDTO } from '@/services/ecommerce/importexcelPedido/importexcelPedido.type';
import { importPedidosDesdePreview } from '@/services/ecommerce/importexcelPedido/importexcelPedido.api';

// Tipos del flujo de PEDIDOS (unificados)


type CourierOption = { id: number; nombre: string };

// Helpers fecha local <-> ISO (evita corrimientos)
const toISOFromLocal = (local: string) => {
  if (!local) return '';
  const [date, time] = local.split('T'); // "YYYY-MM-DD", "HH:mm"
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm); // local time
  return dt.toISOString();
};

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const d = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

export default function ImportPreviewPedidosModal({
  open,
  onClose,
  token,
  data,
  onImported,
  allowMultiCourier = true, // ⬅️ NUEVO: modo multi-courier
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  data: PreviewResponseDTO;
  onImported: () => void;
  allowMultiCourier?: boolean;
}) {
  const [groups, setGroups] = useState<PreviewGroupDTO[]>(data.preview);
  const [courierId, setCourierId] = useState<number | ''>(''); // requerido solo si allowMultiCourier === false
  const [trabajadorId, setTrabajadorId] = useState<number | ''>('');
  const [estadoId, setEstadoId] = useState<number | ''>('');
  const [distritos, setDistritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selección por fila
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);
  const headerChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerChkRef.current) {
      headerChkRef.current.indeterminate = !allSelected && someSelected;
    }
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

  // Normalización
  const norm = (s: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // ===== Couriers (asociados reales) =====
  const [localCouriers, setLocalCouriers] = useState<CourierOption[]>([]);
  useEffect(() => {
    let cancel = false;
    async function load() {
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
        const dedup = mapped.filter((c) =>
          seen.has(c.id) ? false : (seen.add(c.id), true)
        );
        setLocalCouriers(dedup);
      } catch (e) {
        console.error('No se pudieron cargar couriers asociados:', e);
        if (!cancel) setLocalCouriers([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [token]);

  // En modo courier único: si hay un solo courier, auto-seleccionarlo
  useEffect(() => {
    if (!allowMultiCourier && !courierId && localCouriers.length === 1) {
      setCourierId(localCouriers[0].id);
    }
  }, [allowMultiCourier, localCouriers, courierId]);

  // Autodetectar courier desde el texto del preview (solo ayuda visual si es single-courier)
  const byCourierName = useMemo(() => {
    const map = new Map<string, CourierOption>();
    localCouriers.forEach((c) => map.set(norm(c.nombre), c));
    return map;
  }, [localCouriers]);
  useEffect(() => {
    if (allowMultiCourier) return; // en multi no se autoselecciona uno global
    if (courierId || !groups?.length || !localCouriers.length) return;
    const firstMatch = groups.map((g) => byCourierName.get(norm(g.courier))).find(Boolean);
    if (firstMatch) setCourierId(firstMatch.id);
  }, [allowMultiCourier, courierId, groups, byCourierName, localCouriers.length]);

  // ===== Distritos por courier (solo para sugerencias, y solo si courier único) =====
  useEffect(() => {
    let cancel = false;

    const toDistritoList = (arr: unknown): string[] => {
      const list = Array.isArray(arr) ? arr : [];
      return Array.from(
        new Set(
          list
            .map((z: any) => (typeof z?.distrito === 'string' ? z.distrito : ''))
            .filter((d): d is string => d.length > 0)
        )
      );
    };

    async function load() {
      if (allowMultiCourier || !courierId) {
        setDistritos([]);
        return;
      }
      try {
        const zonasPub = await fetchZonasByCourierPublic(Number(courierId));
        if (cancel) return;

        const uniqPub: string[] = toDistritoList(zonasPub);
        if (uniqPub.length) {
          setDistritos(uniqPub);
          return;
        }

        const zonasPriv = await fetchZonasByCourierPrivado(Number(courierId), token);
        if (cancel) return;

        const uniqPriv: string[] = toDistritoList(zonasPriv);
        setDistritos(uniqPriv);
      } catch (e) {
        console.error('No se pudo cargar distritos del courier', e);
        if (!cancel) setDistritos([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [allowMultiCourier, courierId, token]);

  // Opciones para Autocomplete/select
  const courierOptions: Option[] = localCouriers.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }));
  const distritoOptions: Option[] = distritos.map((d) => ({ value: d, label: d }));

  // Validaciones
  const isInvalidCourier = (s: string) =>
    !!s && !localCouriers.some((c) => norm(c.nombre) === norm(s));
  const isInvalidDistrito = (s: string) => !s || s.trim().length === 0;
  const isInvalidCantidad = (n: number | null) =>
    n == null || Number.isNaN(n) || Number(n) <= 0;

  // Patch de grupo
  const patchGroup = (idx: number, patch: Partial<PreviewGroupDTO>) => {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  // Totales y bandera de inválidos
  const totalValidos = useMemo(
    () => groups.filter((g) => g.valido).length,
    [groups]
  );

  // En multi-courier: NO bloqueamos por courier desconocido, solo resaltamos.
  // En single-courier: exigimos courierId numérico.
  const hasInvalid = useMemo(() => {
    if (!allowMultiCourier && typeof courierId !== 'number') return true;
    for (const g of groups) {
      if (isInvalidDistrito(g.distrito)) return true;
      if ((g.monto_total ?? 0) < 0) return true;
      for (const it of g.items) {
        if (isInvalidCantidad(it.cantidad)) return true;
      }
    }
    return false;
  }, [allowMultiCourier, groups, courierId]);

  // Editar cantidad por item
  const handleCantidad = (gIdx: number, iIdx: number, val: number) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== gIdx
          ? g
          : {
              ...g,
              items: g.items.map((it, ii) =>
                ii === iIdx ? { ...it, cantidad: val } : it
              ),
            }
      )
    );
  };

  // Editar nombre de producto por item (texto libre). Limpia producto_id para forzar auto-resolución/creación controlada.
  const handleProductoNombre = (gIdx: number, iIdx: number, val: string) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== gIdx
          ? g
          : {
              ...g,
              items: g.items.map((it, ii) =>
                ii === iIdx
                  ? {
                      ...it,
                      producto: val,
                      producto_id: undefined,
                    }
                  : it
              ),
            }
      )
    );
  };

  // aplicar valor a todas las filas seleccionadas
  const applyToSelected = (patch: Partial<PreviewGroupDTO>) => {
    setGroups((prev) => prev.map((g, i) => (selected[i] ? { ...g, ...patch } : g)));
  };

  // Confirmar importación
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
      // En single-courier enviamos courierId (override). En multi, NO lo incluimos.
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

  return (
    <CenteredModal title="Validación de datos (Pedidos)" onClose={onClose} widthClass="max-w-[1400px]">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Selector de courier global: solo si NO es multi-courier */}
        {!allowMultiCourier && (
          <select
            className="border rounded px-2 py-1 text-sm"
            value={courierId}
            onChange={(e) => {
              const val = e.target.value;
              setCourierId(val ? Number(val) : '');
            }}
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

        <input
          className="border rounded px-2 py-1 text-sm w-44"
          placeholder="TrabajadorId (opcional)"
          value={trabajadorId}
          onChange={(e) => setTrabajadorId(Number(e.target.value) || '')}
        />
        <input
          className="border rounded px-2 py-1 text-sm w-40"
          placeholder="EstadoId (opcional)"
          value={estadoId}
          onChange={(e) => setEstadoId(Number(e.target.value) || '')}
        />

        <div className="ml-auto text-sm bg-gray-50 rounded px-2 py-1">
          <b>Total:</b> {groups.length} · <b>Válidos:</b> {totalValidos} ·{' '}
          {!allowMultiCourier && <><b>Distritos:</b> {distritos.length}</>}
        </div>
      </div>

      {/* Fila de “Seleccionar” (bulk apply) */}
      <div className="border rounded-t overflow-hidden">
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
                  title="Seleccionar todo"
                />
              </th>

              {/* Nombre */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="w-full border rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) applyToSelected({ nombre: val });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Distrito (texto libre con sugerencias si single-courier) */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  list={!allowMultiCourier ? 'distritos-list' : undefined}
                  className="w-full border rounded px-2 py-1"
                  placeholder={
                    allowMultiCourier
                      ? 'Escribe distrito'
                      : typeof courierId !== 'number'
                      ? 'Elige courier'
                      : distritos.length
                      ? 'Escribe o elige distrito'
                      : 'Escribe distrito'
                  }
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

              {/* Celular */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="w-full border rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) applyToSelected({ telefono: val });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Dirección */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="w-full border rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) applyToSelected({ direccion: val });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Referencia */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  placeholder="Seleccionar"
                  className="w-full border rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) applyToSelected({ referencia: val });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Courier (aplica nombre en filas) */}
              <th className="px-2 py-2 border-b border-gray-200">
                <select
                  className="w-full border rounded px-2 py-1"
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

              {/* Producto (se edita en cada fila) */}
              <th className="px-2 py-2 border-b border-gray-200">
                <span className="text-gray-500">Producto</span>
              </th>

              {/* Cantidad (multi-apply) */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  placeholder="Cantidad"
                  className="w-full border rounded px-2 py-1 text-right"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) {
                        setGroups((prev) =>
                          prev.map((g, i) => {
                            if (!selected[i]) return g;
                            return {
                              ...g,
                              items: g.items.map((it) => ({ ...it, cantidad: n })),
                            };
                          })
                        );
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Monto */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Monto"
                  className="w-full border rounded px-2 py-1 text-right"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number((e.target as HTMLInputElement).value);
                      if (!Number.isNaN(n)) applyToSelected({ monto_total: n });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </th>

              {/* Fec. Entrega */}
              <th className="px-2 py-2 border-b border-gray-200">
                <input
                  type="datetime-local"
                  className="w-full border rounded px-2 py-1"
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
      <div className="border-x border-b rounded-b overflow-auto max-h-[55vh]">
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
            <tr className="sticky top-0 z-10 bg-gray-100 text-xs font-medium">
              <th className="border-b border-gray-200 px-2 py-2"></th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Nombre</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Distrito</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Celular</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Dirección</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Referencia</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Courier</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Producto</th>
              <th className="border-b border-gray-200 px-2 py-2 text-right">Cantidad</th>
              <th className="border-b border-gray-200 px-2 py-2 text-right">Monto</th>
              <th className="border-b border-gray-200 px-2 py-2 text-left">Fec. Entrega</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, gi) => {
              // En single-courier usamos sugerencias; en multi solo texto libre.
              const isNewDistrito =
                !!g.distrito && (!allowMultiCourier
                  ? !distritos.some((d) => norm(d) === norm(g.distrito))
                  : false);
              const distritoClass = isNewDistrito ? 'border-amber-500 bg-amber-50 text-amber-700' : '';

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
                      value={g.nombre}
                      onChange={(e) => patchGroup(gi, { nombre: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <div
                      className={`w-full ${distritoClass}`}
                      title={isNewDistrito ? 'Distrito no registrado (puede no existir en zonas)' : undefined}
                    >
                      <Autocomplete
                        value={g.distrito || ''}
                        onChange={(v: string) => patchGroup(gi, { distrito: v })}
                        options={!allowMultiCourier ? distritoOptions : []}
                        placeholder="Distrito"
                        invalid={isInvalidDistrito(g.distrito)}
                        className="w-full"
                      />
                    </div>
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      value={g.telefono}
                      onChange={(e) => patchGroup(gi, { telefono: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      value={g.direccion}
                      onChange={(e) => patchGroup(gi, { direccion: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      value={g.referencia || ''}
                      onChange={(e) => patchGroup(gi, { referencia: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <Autocomplete
                      value={g.courier || ''}
                      onChange={(v: string) => patchGroup(gi, { courier: v })}
                      options={courierOptions}
                      placeholder="Courier"
                      // 🔸 En multi no bloquea, solo resalta si no coincide con la lista
                      invalid={!allowMultiCourier && isInvalidCourier(g.courier)}
                      className="w-full"
                    />
                    {allowMultiCourier && isInvalidCourier(g.courier) && g.courier ? (
                      <div className="text-[11px] text-amber-600 mt-1">
                        Nombre de courier no coincide con asociados. Se intentará resolver por similitud.
                      </div>
                    ) : null}
                  </td>

                  {/* Producto + Cantidad */}
                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <div className="space-y-1">
                      {g.items.map((it, ii) => (
                        <input
                          key={ii}
                          value={it.producto || ''}
                          placeholder="Nombre del producto"
                          onChange={(e) => handleProductoNombre(gi, ii, e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      ))}
                    </div>
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <div className="space-y-1">
                      {g.items.map((it, ii) => (
                        <input
                          key={ii}
                          type="number"
                          min={0}
                          value={it.cantidad ?? 0}
                          onChange={(e) => handleCantidad(gi, ii, Number(e.target.value))}
                          className={`w-full border rounded px-2 py-1 text-right ${
                            isInvalidCantidad(it.cantidad) ? 'border-red-500 bg-red-50' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="number"
                      step="0.01"
                      value={g.monto_total ?? 0}
                      onChange={(e) => patchGroup(gi, { monto_total: Number(e.target.value) })}
                      className={`w-full border rounded px-2 py-1 text-right ${
                        (g.monto_total ?? 0) < 0 ? 'border-red-500 bg-red-50' : ''
                      }`}
                    />
                  </td>

                  <td className="border-b border-gray-100 px-2 py-1 align-top">
                    <input
                      type="datetime-local"
                      value={toLocalInput(g.fecha_entrega)}
                      onChange={(e) => {
                        const iso = toISOFromLocal(e.target.value);
                        patchGroup(gi, { fecha_entrega: iso || undefined });
                      }}
                      className="w-full border rounded px-2 py-1"
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
          disabled={loading || hasInvalid}
          className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          title={hasInvalid ? 'Corrige los campos en rojo' : ''}
        >
          {loading ? 'Importando…' : allowMultiCourier ? 'Cargar Datos (multi-courier)' : 'Cargar Datos'}
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
