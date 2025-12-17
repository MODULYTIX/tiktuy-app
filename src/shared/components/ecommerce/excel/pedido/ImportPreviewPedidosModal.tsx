// src/shared/components/ecommerce/excel/ImportPreviewPedidosModal.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchSedesEcommerceCourierAsociados } from '@/services/ecommerce/ecommerceCourier.api';

import CenteredModal from '@/shared/common/CenteredModal';
import Autocomplete, { type Option } from '@/shared/common/Autocomplete';
import type {
  ImportPayload,
  PreviewGroupDTO,
  PreviewResponseDTO,
} from '@/services/ecommerce/importexcelPedido/importexcelPedido.type';
import { importPedidosDesdePreview } from '@/services/ecommerce/importexcelPedido/importexcelPedido.api';
import { Icon } from '@iconify/react';

// Productos y zonas por sede
import {
  fetchProductosPorSede,
  fetchZonasTarifariasPorSede,
} from '@/services/ecommerce/pedidos/pedidos.api';
import type {
  ProductoSede,
  ZonaTarifariaSede,
} from '@/services/ecommerce/pedidos/pedidos.types';

// ---------- helpers fecha local ----------

// Para sedes asociadas (lo que usa este modal)
type SedeOptionRaw = {
  sede_id: number;
  nombre: string;
  ciudad: string | null;
};

const productoKey = (gIdx: number, iIdx: number) => `${gIdx}-${iIdx}`;

export default function ImportPreviewPedidosModal({
  open,
  onClose,
  token,
  data,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  allowMultiCourier: boolean; // se mantiene por compat, aunque ya no se usa
  data: PreviewResponseDTO;
  onImported: () => void;
}) {
  // ---------- estado base ----------
  const [groups, setGroups] = useState<PreviewGroupDTO[]>(data.preview);
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
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<number, boolean> = {};
      groups.forEach((_, i) => {
        next[i] = true;
      });
      setSelected(next);
    }
  };

  const norm = (s: string) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // ============ SEDES DEL ECOMMERCE ============
  const [sedes, setSedes] = useState<SedeOptionRaw[]>([]);

  useEffect(() => {
    if (!open || !token) return;
    let cancel = false;

    (async () => {
      try {
        const list: any[] = await fetchSedesEcommerceCourierAsociados(token);
        if (cancel) return;

        const mapped: SedeOptionRaw[] = (list || []).map((s: any) => ({
          sede_id: Number(s.sede_id),
          nombre: s.nombre || '',
          ciudad: s.ciudad ?? null,
        }));

        setSedes(mapped);
      } catch (e) {
        if (!cancel) {
          console.error('Error cargando sedes para importación:', e);
          setSedes([]);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [open, token]);

  const findSedeByNombre = (nombre: string) =>
    sedes.find((s) => norm(s.nombre) === norm(nombre));

  // ================= PRODUCTOS POR SEDE =================
  const [productosPorSede, setProductosPorSede] = useState<
    Record<number, ProductoSede[]>
  >({});

  const loadProductosForSede = async (sedeId: number) => {
    if (!sedeId || productosPorSede[sedeId]) return;
    try {
      const list = (await fetchProductosPorSede(
        sedeId,
        token
      )) as unknown as ProductoSede[];
      setProductosPorSede((prev) => ({
        ...prev,
        [sedeId]: Array.isArray(list) ? list : [],
      }));
    } catch (e) {
      console.error('Error cargando productos de la sede:', e);
    }
  };

  // ================= ZONAS / DISTRITOS POR SEDE =================
  const [zonasPorSede, setZonasPorSede] = useState<
    Record<number, ZonaTarifariaSede[]>
  >({});

  const loadZonasForSede = async (sedeId: number) => {
    if (!sedeId || zonasPorSede[sedeId]) return;
    try {
      const data = (await fetchZonasTarifariasPorSede(
        sedeId
      )) as unknown as ZonaTarifariaSede[];
      setZonasPorSede((prev) => ({
        ...prev,
        [sedeId]: Array.isArray(data) ? data : [],
      }));
    } catch (e) {
      console.error('Error cargando zonas tarifarias de la sede:', e);
    }
  };

  // Pre-cargar productos y zonas para las sedes que ya vienen en el Excel
  useEffect(() => {
    if (!open) return;
    groups.forEach((g) => {
      if (!g.courier) return;
      const sede = findSedeByNombre(g.courier);
      if (sede) {
        void loadProductosForSede(sede.sede_id);
        void loadZonasForSede(sede.sede_id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groups, sedes]);

  // opciones UI para Autocomplete de Sede (antes courier)
  const sedeOptions: Option[] = useMemo(
    () =>
      sedes.map((s) => ({
        value: s.nombre,
        label: s.nombre,
      })),
    [sedes]
  );

  // ================= VALIDACIONES =================
  const isInvalidSede = (s: string) =>
    !s || !sedes.some((sed) => norm(sed.nombre) === norm(s));

  const isInvalidDistrito = (d?: string | null) =>
    !d || !d.toString().trim();

  const isInvalidCantidad = (n: number | null, stock?: number) =>
    n == null ||
    Number.isNaN(n) ||
    Number(n) <= 0 ||
    (stock != null && Number(n) > stock);

  // errores de producto por fila
  const [productoErrors, setProductoErrors] = useState<Record<string, boolean>>({});

  // Validar productos cuando haya productosPorSede o cambien los grupos
  useEffect(() => {
    const newErrors: Record<string, boolean> = {};

    groups.forEach((g, gi) => {
      if (!g.courier) return;
      const sede = findSedeByNombre(g.courier);
      if (!sede) return;

      const productos = productosPorSede[sede.sede_id];
      if (!productos || productos.length === 0) return;

      g.items.forEach((it, ii) => {
        if (!it.producto) return;
        const key = productoKey(gi, ii);
        const nombreNorm = norm(it.producto);

        const found = productos.find(
          (p) =>
            norm(p.nombre_producto) === nombreNorm ||
            norm(p.codigo_identificacion ?? '') === nombreNorm
        );

        if (!found) {
          newErrors[key] = true;
        }
      });
    });

    setProductoErrors(newErrors);
  }, [groups, productosPorSede, sedes]);

  const hasInvalid = useMemo(() => {
    for (const g of groups) {
      if (isInvalidSede(g.courier || '')) return true;
      if (isInvalidDistrito(g.distrito)) return true;
      if ((g.monto_total ?? 0) < 0) return true;

      for (const it of g.items) {
        if (isInvalidCantidad(it.cantidad, it.stock ?? undefined)) return true;
      }
    }

    if (Object.values(productoErrors).some(Boolean)) return true;

    return false;
  }, [groups, sedes, productoErrors]);

  // ================= PATCH HELPERS =================
  const patchGroup = (idx: number, patch: Partial<PreviewGroupDTO>) =>
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));

  const handleCantidad = (gIdx: number, iIdx: number, val: number) => {
    setGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== gIdx) return g;

        // Actualizamos items
        const newItems = g.items.map((it, ii) =>
          ii === iIdx ? { ...it, cantidad: val } : it
        );

        // Recalculamos monto_total
        let total = 0;
        for (const item of newItems) {
          const cant = item.cantidad ?? 0;
          const precio = item.precio_unitario ?? 0;
          total += cant * precio;
        }

        return {
          ...g,
          items: newItems,
          monto_total: total,
        };
      })
    );
  };


  // cuando cambias el nombre del producto en una fila
  const handleProductoNombre = (gIdx: number, iIdx: number, val: string) => {
    setGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== gIdx) return g;

        const sede = g.courier ? findSedeByNombre(g.courier) : undefined;

        let productoReal: ProductoSede | undefined = undefined;
        if (sede && productosPorSede[sede.sede_id]) {
          productoReal = productosPorSede[sede.sede_id].find(
            (p) => norm(p.nombre_producto) === norm(val)
          );
        }

        return {
          ...g,
          items: g.items.map((it, ii) => {
            if (ii !== iIdx) return it;

            // Producto NO encontrado
            if (!productoReal) {
              return {
                ...it,
                producto: val,
                producto_id: undefined,
                precio_unitario: undefined,
                stock: undefined,
              };
            }

            // ✔ Producto encontrado
            const cantidadActual = it.cantidad && it.cantidad > 0 ? it.cantidad : 1;

            return {
              ...it,
              producto: productoReal!.nombre_producto,
              producto_id: productoReal!.id,
              precio_unitario: productoReal!.precio,
              stock: productoReal!.stock,
              cantidad: cantidadActual,
            };
          }),

          // Recalcular monto total del grupo
          monto_total: (() => {
            let total = 0;

            for (let idx = 0; idx < g.items.length; idx++) {
              const item = g.items[idx];

              const cantidad =
                idx === iIdx
                  ? item.cantidad && item.cantidad > 0
                    ? item.cantidad
                    : 1
                  : item.cantidad ?? 0;

              const precio =
                idx === iIdx
                  ? productoReal?.precio ?? item.precio_unitario ?? 0
                  : item.precio_unitario ?? 0;

              total += cantidad * precio;
            }

            return total;
          })(),
        };
      })
    );
  };

  // cuando cambias la sede (campo courier en el DTO)
  const handleSedeChange = (gIdx: number, value: string) => {
    const sede = findSedeByNombre(value);
    if (sede) {
      void loadProductosForSede(sede.sede_id);
      void loadZonasForSede(sede.sede_id);
    }

    // 👉 Ya NO tocamos el distrito aquí, se mantiene lo que venga del Excel / usuario
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== gIdx
          ? g
          : {
            ...g,
            courier: value,
          }
      )
    );
  };

  function normalizeGroupForSend(g: PreviewGroupDTO): PreviewGroupDTO {
    return {
      ...g,
      monto_total: Number(g.monto_total ?? 0),
      fecha_entrega: g.fecha_entrega
        ? new Date(g.fecha_entrega).toISOString()
        : '',
    };
  }

  const confirmarImportacion = async () => {
    setError(null);

    if (hasInvalid) {
      setError('Hay datos inválidos o faltantes. Corrige los campos en rojo.');
      return;
    }

    const groupsToSend = Object.values(selected).some(Boolean)
      ? groups.filter((_, i) => selected[i])
      : groups;

    const payload: ImportPayload = {
      groups: groupsToSend.map(normalizeGroupForSend),
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

  // ===== eliminar filas seleccionadas (como en productos) =====
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = () => {
    setGroups((prev) => prev.filter((_, i) => !selected[i]));
    setSelected({});
    setShowDeleteConfirm(false);
  };

  if (!open) return null;

  // ---------- UI ----------
  return (
    <CenteredModal title="" onClose={onClose} widthClass="max-w-[1680px] w-[98vw]">
      {/* Header visual */}
      <div className="pb-3 border-gray-200 flex items-center gap-3">
        <span className="text-[#1F2A7A]">
          <Icon icon="vaadin:stock" width="22" height="22" />
        </span>
        <div className="text-[#1F2A7A]">
          <h2 className="uppercase tracking-wide font-bold text-[18px] leading-6">
            Validación de datos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Datos ingresados del excel, última validación
          </p>
        </div>
      </div>

      {/* Barra superior tipo “productos”: seleccionar todo + eliminar filas */}
      <div className="mt-3 mb-4 rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
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

        <button
          disabled={!someSelected}
          onClick={() => setShowDeleteConfirm(true)}
          className={`
            flex items-center gap-2 px-4 h-10 text-sm rounded-md border text-red-600 
            border-red-300 hover:bg-red-50 transition-all
            ${!someSelected
              ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
              : ''
            }
          `}
        >
          <Icon icon="tabler:trash" width="18" />
          Eliminar seleccionadas
        </button>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[380px] animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon icon="tabler:alert-circle" width="22" className="text-red-500" />
              Confirmar eliminación
            </h3>

            <p className="text-gray-600 text-sm mb-5">
              ¿Estás seguro que deseas eliminar las filas seleccionadas? Esta
              acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Tabla ===== */}
      <div className="rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
        <table className="w-full table-auto border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
          </colgroup>

          <thead>
            <tr className="sticky top-0 z-10 bg-[#F3F6FA] text-xs font-semibold text-gray-600">
              <th className="border-b border-gray-200 px-2 py-3" />
              <th className="border-b border-gray-200 px-3 py-3 text-left">Nombre</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Distrito</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Celular</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Dirección</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Referencia</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Sede</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">Producto</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Cantidad</th>
              <th className="border-b border-gray-200 px-3 py-3 text-right">Monto</th>
              <th className="border-b border-gray-200 px-3 py-3 text-left">
                Fec. Entrega
              </th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, gi) => {
              const isInvalidSedeRow = isInvalidSede(g.courier || '');
              const sedeClass = isInvalidSedeRow ? 'bg-red-50' : '';

              const sede = g.courier ? findSedeByNombre(g.courier) : undefined;
              const distritosDeSede: Option[] = sede
                ? (zonasPorSede[sede.sede_id] || []).map((z) => ({
                  value: z.distrito,
                  label: z.distrito,
                }))
                : [];

              const distritoInvalido = isInvalidDistrito(g.distrito);

              return (
                <tr
                  key={gi}
                  className="odd:bg-white even:bg-gray-50 hover:bg-[#F8FAFD] transition-colors duration-150"
                >
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

                  {/* DISTRITO: ahora obligatorio y ligado a la sede (zonas) */}
                  <td
                    className={`border-b border-gray-200 px-3 py-2 align-middle ${distritoInvalido ? 'bg-red-50' : ''
                      }`}
                  >
                    <Autocomplete
                      value={g.distrito || ''}
                      onChange={(v: string) => patchGroup(gi, { distrito: v })}
                      options={distritosDeSede}
                      placeholder="Distrito"
                      className="w-full"
                    />
                    {distritoInvalido && (
                      <div className="text-[11px] text-red-600 mt-1">
                        El distrito es obligatorio.
                      </div>
                    )}
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

                  {/* Sede (antes courier) */}
                  <td
                    className={`border-b border-gray-200 px-3 py-2 align-middle ${sedeClass}`}
                  >
                    <Autocomplete
                      value={g.courier || ''}
                      onChange={(v: string) => handleSedeChange(gi, v)}
                      options={sedeOptions}
                      placeholder="Sede"
                      invalid={isInvalidSedeRow}
                      className="w-full"
                    />
                    {isInvalidSedeRow && g.courier ? (
                      <div className="text-[11px] text-red-600 mt-1">
                        La sede no coincide con las sedes asociadas al ecommerce.
                      </div>
                    ) : null}
                  </td>

                  {/* PRODUCTOS */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <div className="space-y-1">
                      {g.items.map((it, ii) => {
                        const key = productoKey(gi, ii);
                        const hasError = !!productoErrors[key];

                        const rowSede = g.courier
                          ? findSedeByNombre(g.courier)
                          : undefined;
                        const productosOptions: Option[] = rowSede
                          ? (productosPorSede[rowSede.sede_id] || []).map((p) => ({
                            value: p.nombre_producto,
                            label: p.nombre_producto,
                          }))
                          : [];

                        return (
                          <div key={ii} className="space-y-0.5">
                            <Autocomplete
                              value={it.producto || ''}
                              onChange={(v: string) =>
                                handleProductoNombre(gi, ii, v || '')
                              }
                              options={productosOptions}
                              placeholder="Nombre del producto"
                              className={`w-full ${hasError
                                ? 'bg-red-50 border-red-300 rounded-md'
                                : ''
                                }`}
                            />

                            {hasError && (
                              <div className="text-[11px] text-red-600">
                                Producto no encontrado en la sede seleccionada.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* CANTIDAD */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right">
                    <div className="space-y-1">
                      {g.items.map((it, ii) => {
                        const cantidad = it.cantidad ?? 0;
                        const stock = it.stock ?? undefined;

                        const cantidadInvalida = isInvalidCantidad(cantidad, stock);

                        return (
                          <div key={ii} className="space-y-0.5">
                            <input
                              type="number"
                              min={0}
                              value={cantidad}
                              onChange={(e) =>
                                handleCantidad(gi, ii, Number(e.target.value))
                              }
                              className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right  
                                focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20
                                ${cantidadInvalida ? 'bg-red-50' : ''}
                              `}
                              title={String(cantidad)}
                            />

                            {stock !== undefined && cantidad > stock && (
                              <div className="text-[11px] text-red-600">
                                Stock insuficiente. Máximo disponible: {stock}.
                              </div>
                            )}

                            {cantidad <= 0 && (
                              <div className="text-[11px] text-red-600">
                                La cantidad debe ser mayor a 0.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* MONTO */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={g.monto_total ?? 0}
                      onChange={(e) =>
                        patchGroup(gi, { monto_total: Number(e.target.value) })
                      }
                      className={`w-full bg-transparent border border-transparent rounded px-0 py-0.5 text-right focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20 ${(g.monto_total ?? 0) < 0 ? 'bg-red-50' : ''
                        }`}
                      title={String(g.monto_total ?? '')}
                    />
                  </td>

                  {/* FECHA ENTREGA */}
                  <td className="border-b border-gray-200 px-3 py-2 align-middle">
                    <input
                      type="date"
                      value={g.fecha_entrega ? g.fecha_entrega.slice(0, 10) : ''}
                      onChange={(e) =>
                        patchGroup(gi, {
                          fecha_entrega: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        })
                      }
                      className="w-full bg-transparent border border-transparent rounded px-0 py-0.5
    focus:bg-white focus:border-[#1F2A44] focus:ring-2 focus:ring-[#1F2A44]/20"
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
        <button
          className="px-4 h-10 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
          onClick={onClose}
        >
          Cerrar
        </button>
        <button
          onClick={confirmarImportacion}
          disabled={loading || hasInvalid}
          className="px-5 h-10 text-sm rounded-md bg-[#1F2A44] text-white hover:bg-[#182238] disabled:opacity-60"
          title={hasInvalid ? 'Corrige los campos en rojo' : ''}
        >
          {loading ? 'Importando…' : 'Cargar Datos'}
        </button>
      </div>

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
        tbody tr:last-child td { border-bottom: 1px solid #eef0f2; }
      `}</style>
    </CenteredModal>
  );
}
