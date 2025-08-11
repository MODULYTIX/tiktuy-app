import { useMemo, useState, useEffect, useRef } from 'react';
import { importVentasDesdePreview } from '@/services/ecommerce/importExcel/importexcel.api';
import type {
  ImportPayload,
  PreviewGroupDTO,
  PreviewResponseDTO,
} from '@/services/ecommerce/importExcel/importexcel.type';
import {
  fetchZonasByCourierPublic,
  fetchZonasByCourierPrivado,
} from '@/services/courier/zonaTarifaria.api';
import { fetchCouriersAsociados } from '@/services/ecommerce/ecommerceCourier.api';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import CenteredModal from '@/shared/common/CenteredModal';
import Autocomplete, { type Option } from '@/shared/common/Autocomplete';

type CourierOption = { id: number; nombre: string };
type ProductoOpt = { id: number; nombre: string };

export default function ImportPreviewModal({
  open,
  onClose,
  token,
  data,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  data: PreviewResponseDTO;
  onImported: () => void;
}) {
  const [groups, setGroups] = useState<PreviewGroupDTO[]>(data.preview);
  const [courierId, setCourierId] = useState<number | ''>(''); // requerido por backend
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
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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
        // dedupe
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

  // Si hay un solo courier, auto-seleccionarlo
  useEffect(() => {
    if (!courierId && localCouriers.length === 1) {
      setCourierId(localCouriers[0].id);
    }
  }, [localCouriers, courierId]);

  // Autodetectar courier desde el texto del preview (si aún no se eligió)
  const byCourierName = useMemo(() => {
    const map = new Map<string, CourierOption>();
    localCouriers.forEach((c) => map.set(norm(c.nombre), c));
    return map;
  }, [localCouriers]);
  useEffect(() => {
    if (courierId || !groups?.length || !localCouriers.length) return;
    const firstMatch = groups.map((g) => byCourierName.get(norm(g.courier))).find(Boolean);
    if (firstMatch) setCourierId(firstMatch.id);
  }, [courierId, groups, byCourierName, localCouriers.length]);

  // ===== Distritos por courier (FIX TS2345) =====
  useEffect(() => {
    let cancel = false;

    // Garantiza string[] desde cualquier respuesta
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
      if (!courierId) {
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
  }, [courierId, token]);

  // ===== Productos (reales) =====
  const [productos, setProductos] = useState<ProductoOpt[]>([]);
  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const res = await fetchProductos(token);
        if (cancel) return;
        const mapped: ProductoOpt[] = (res || []).map((p: any) => ({
          id: p.id,
          nombre: p.nombre_producto,
        }));
        setProductos(mapped);
      } catch (e) {
        console.error('No se pudieron cargar productos:', e);
        if (!cancel) setProductos([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [token]);

  // Opciones para Autocomplete/select
  const courierOptions: Option[] = localCouriers.map((c) => ({
    value: c.id,
    label: c.nombre,
  }));
  const distritoOptions: Option[] = distritos.map((d) => ({ value: d, label: d }));
  const productoOptions: Option[] = productos.map((p) => ({
    value: p.id,
    label: p.nombre,
  }));

  // Validaciones (producto NO invalida visualmente)
  const courierSet = useMemo(
    () => new Set(localCouriers.map((c) => norm(c.nombre))),
    [localCouriers]
  );
  const distritoSet = useMemo(() => new Set(distritos.map(norm)), [distritos]);

  const isInvalidCourier = (s: string) => !!s && !courierSet.has(norm(s));
  const isInvalidDistrito = (s: string) => !!s && !distritoSet.has(norm(s));
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
  const hasInvalid = useMemo(() => {
    if (typeof courierId !== 'number') return true;
    for (const g of groups) {
      if (isInvalidCourier(g.courier)) return true;
      if (isInvalidDistrito(g.distrito)) return true;
      if ((g.monto_total ?? 0) < 0) return true;
      for (const it of g.items) {
        if (isInvalidCantidad(it.cantidad)) return true;
      }
    }
    return false;
  }, [groups, courierId]);

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

  // aplicar valor a todas las filas seleccionadas
  const applyToSelected = (patch: Partial<PreviewGroupDTO>) => {
    setGroups((prev) => prev.map((g, i) => (selected[i] ? { ...g, ...patch } : g)));
  };

  // Confirmar importación
  const confirmarImportacion = async () => {
    setError(null);

    if (typeof courierId !== 'number') {
      setError('Selecciona un courier válido.');
      return;
    }
    if (hasInvalid) {
      setError('Hay datos inválidos o faltantes. Corrige los campos en rojo.');
      return;
    }

    const groupsToSend = someSelected ? groups.filter((_, i) => selected[i]) : groups;

    const payload: ImportPayload = {
      groups: groupsToSend,
      courierId, // number
      trabajadorId: trabajadorId ? Number(trabajadorId) : undefined,
      estadoId: estadoId ? Number(estadoId) : undefined,
    };

    try {
      setLoading(true);
      await importVentasDesdePreview(payload, token);
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
    <CenteredModal title="Validación de datos" onClose={onClose} widthClass="max-w=[1400px]">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
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
          <b>Distritos:</b> {distritos.length}
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

              {/* Distrito */}
              <th className="px-2 py-2 border-b border-gray-200">
                <select
                  className="w-full border rounded px-2 py-1"
                  disabled={!(typeof courierId === 'number') || !distritos.length}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    applyToSelected({ distrito: v });
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">
                    {typeof courierId !== 'number'
                      ? 'Elige courier'
                      : distritos.length
                      ? 'Seleccionar'
                      : 'Sin distritos'}
                  </option>
                  {distritos.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
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

              {/* Producto objetivo (selector de producto EXISTENTE) */}
              <th className="px-2 py-2 border-b border-gray-200">
                <select
                  className="w-full border rounded px-2 py-1"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    const p = productos.find((pp) => String(pp.id) === v);
                    if (!p) return;
                    setGroups((prev) =>
                      prev.map((g, i) => {
                        if (!selected[i]) return g;
                        return {
                          ...g,
                          items: g.items.map((it) => ({
                            ...it,
                            producto: p.nombre,
                            producto_id: p.id,
                          })),
                        };
                      })
                    );
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">Producto objetivo</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
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
                    const iso = e.target.value
                      ? new Date(e.target.value).toISOString()
                      : '';
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
            {groups.map((g, gi) => (
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
                  <Autocomplete
                    value={g.distrito}
                    onChange={(v) => patchGroup(gi, { distrito: v })}
                    options={distritoOptions}
                    placeholder="Distrito"
                    invalid={isInvalidDistrito(g.distrito)}
                    className="w-full"
                  />
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
                    value={g.courier}
                    onChange={(v) => patchGroup(gi, { courier: v })}
                    options={courierOptions}
                    placeholder="Courier"
                    invalid={isInvalidCourier(g.courier)}
                    className="w-full"
                  />
                </td>

                {/* Producto + Cantidad */}
                <td className="border-b border-gray-100 px-2 py-1 align-top">
                  <div className="space-y-1">
                    {g.items.map((it, ii) => (
                      <select
                        key={ii}
                        value={
                          (it as any).producto_id ??
                          (productos.find((p) => p.nombre === (it.producto || ''))?.id ?? '')
                        }
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          const prod = productos.find((p) => p.id === id);
                          setGroups((prev) =>
                            prev.map((gg, idx) =>
                              idx !== gi
                                ? gg
                                : {
                                    ...gg,
                                    items: gg.items.map((x, idx2) =>
                                      idx2 === ii
                                        ? {
                                            ...x,
                                            producto: prod?.nombre || '',
                                            producto_id: prod?.id,
                                          }
                                        : x
                                    ),
                                  }
                            )
                          );
                        }}
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="">Seleccionar producto...</option>
                        {productoOptions.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
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
                    value={
                      g.fecha_entrega
                        ? new Date(g.fecha_entrega).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      const iso = e.target.value
                        ? new Date(e.target.value).toISOString()
                        : '';
                      patchGroup(gi, { fecha_entrega: iso });
                    }}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
              </tr>
            ))}
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
          {loading ? 'Importando…' : 'Cargar Datos'}
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
