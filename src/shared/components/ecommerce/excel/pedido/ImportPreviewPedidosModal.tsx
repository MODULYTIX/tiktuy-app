// src/shared/components/ecommerce/excel/ImportPreviewPedidosModal.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchSedesEcommerceCourierAsociados } from "@/services/ecommerce/ecommerceCourier.api";

import CenteredModal from "@/shared/common/CenteredModal";
import Autocomplete, { type Option } from "@/shared/common/Autocomplete";
import type {
  ImportPayload,
  PreviewGroupDTO,
  PreviewResponseDTO,
} from "@/services/ecommerce/importexcelPedido/importexcelPedido.type";
import { importPedidosDesdePreview } from "@/services/ecommerce/importexcelPedido/importexcelPedido.api";
import { Icon } from "@iconify/react";

// Productos y zonas por sede
import {
  fetchProductosPorSede,
  fetchZonasTarifariasPorSede,
} from "@/services/ecommerce/pedidos/pedidos.api";
import type {
  ProductoSede,
  ZonaTarifariaSede,
} from "@/services/ecommerce/pedidos/pedidos.types";

import Buttonx from "@/shared/common/Buttonx";

// Para sedes asociadas (lo que usa este modal)
type SedeOptionRaw = {
  sede_id: number;
  nombre: string;
  ciudad: string | null;
};

const productoKey = (gIdx: number, iIdx: number) => `${gIdx}-${iIdx}`;

function dateOnlyToPeruISO(dateOnly: string) {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0)).toISOString();
}

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
  allowMultiCourier: boolean;
  data: PreviewResponseDTO;
  onImported: () => void;
}) {
  // ---------- estado base ----------
  const [groups, setGroups] = useState<PreviewGroupDTO[]>(
    data.preview.map((g) => ({
      ...g,
      monto_editado: false,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // selección por fila
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const allSelected = groups.length > 0 && groups.every((_, i) => selected[i]);
  const someSelected = groups.some((_, i) => selected[i]);
  const headerChkRef = useRef<HTMLInputElement>(null);

  const normalizeProducto = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

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
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

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
          nombre: s.nombre || "",
          ciudad: s.ciudad ?? null,
        }));

        setSedes(mapped);
      } catch (e) {
        if (!cancel) {
          console.error("Error cargando sedes para importación:", e);
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
      console.error("Error cargando productos de la sede:", e);
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
      console.error("Error cargando zonas tarifarias de la sede:", e);
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

  const isSinStock = (stock?: number | null) =>
    stock == null || Number(stock) <= 0;


  const isInvalidSede = (s: string) =>
    !s || !sedes.some((sed) => norm(sed.nombre) === norm(s));

  const isInvalidDistritoBySede = (g: PreviewGroupDTO) => {
    if (!g.distrito || !g.courier) return true;

    const sede = findSedeByNombre(g.courier);
    if (!sede) return true;

    const zonas = zonasPorSede[sede.sede_id] || [];

    return !zonas.some(
      (z) => norm(z.distrito) === norm(g.distrito!)
    );
  };

  const isInvalidCantidad = (n: number | null, stock?: number) =>
    n == null ||
    Number.isNaN(n) ||
    Number(n) <= 0 ||
    stock == null ||
    Number(stock) <= 0 ||
    Number(n) > Number(stock);


  // errores de producto por fila
  const [productoErrors, setProductoErrors] = useState<Record<string, boolean>>(
    {}
  );

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
        const found = productos.find(
          (p) =>
            normalizeProducto(p.nombre_producto) ===
            normalizeProducto(it.producto)
        );

        if (!found) {
          newErrors[key] = true;
        }
      });
    });

    //  stock acumulado
    const erroresAcumulados = validarStockAcumulado(
      groups,
      findSedeByNombre
    );

    Object.assign(newErrors, erroresAcumulados);

    setProductoErrors(newErrors);
  }, [groups, productosPorSede, sedes]);




  // ================= DETECCIÓN DE DUPLICADOS =================
  const getGroupSignature = (g: PreviewGroupDTO) => {
    return JSON.stringify({
      c: g.courier ? norm(g.courier) : "",
      n: g.nombre ? norm(g.nombre) : "",
      d: g.distrito ? norm(g.distrito) : "",
      t: g.telefono ? g.telefono.trim() : "",
      dir: g.direccion ? norm(g.direccion) : "",
      // f: g.fecha_entrega ? g.fecha_entrega.slice(0, 10) : "", // Opcional: incluir fecha si es relevante
      i: g.items.map((it) => ({
        p: it.producto ? norm(it.producto) : "",
        c: it.cantidad,
      })),
    });
  };

  const duplicateIndices = useMemo(() => {
    const counts = new Map<string, number[]>();
    groups.forEach((g, i) => {
      const sig = getGroupSignature(g);
      if (!counts.has(sig)) counts.set(sig, []);
      counts.get(sig)?.push(i);
    });

    const dups = new Set<number>();
    counts.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((idx) => dups.add(idx));
      }
    });
    return dups;
  }, [groups]);

  // ================= PATCH HELPERS =================

  function validarStockAcumulado(
    groups: PreviewGroupDTO[],
    findSedeByNombre: (n: string) => any
  ): Record<string, boolean> {

    const errores: Record<string, boolean> = {};

    // key = sedeId-productoId
    const acumulado: Record<string, { total: number; stock: number }> = {};

    groups.forEach((g, gi) => {
      if (!g.courier) return;
      const sede = findSedeByNombre(g.courier);
      if (!sede) return;

      g.items.forEach((it, ii) => {
        if (!it.producto_id || !it.cantidad) return;

        const key = `${sede.sede_id}-${it.producto_id}`;

        if (!acumulado[key]) {
          acumulado[key] = {
            total: 0,
            stock: it.stock ?? 0,
          };
        }

        acumulado[key].total += it.cantidad;

        if (acumulado[key].total > acumulado[key].stock) {
          errores[productoKey(gi, ii)] = true;
        }
      });
    });

    return errores;
  }


  const patchGroup = (idx: number, patch: Partial<PreviewGroupDTO>) =>
    setGroups((prev) =>
      prev.map((g, i) =>
        i === idx
          ? {
            ...g,
            ...patch,
            valido: true,
            errores: [],
          }
          : g
      )
    );


  const handleCantidad = (gIdx: number, iIdx: number, val: number) => {
    setGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== gIdx) return g;

        const newItems = g.items.map((it, ii) =>
          ii === iIdx ? { ...it, cantidad: val } : it
        );

        let total = 0;
        for (const item of newItems) {
          const cant = item.cantidad ?? 0;
          const precio = item.precio_unitario ?? 0;
          total += cant * precio;
        }

        return {
          ...g,
          items: newItems,
          monto_total: g.monto_editado ? g.monto_total : total,
        };
      })
    );
  };

  const handleProductoNombre = (gIdx: number, iIdx: number, val: string) => {
    setGroups(prev =>
      prev.map((g, gi) => {
        if (gi !== gIdx) return g;

        const sede = g.courier ? findSedeByNombre(g.courier) : undefined;
        if (!sede) return g;

        const productos = productosPorSede[sede.sede_id] || [];
        const productoReal = productos.find(p => String(p.id) === val);

        return {
          ...g,
          items: g.items.map((it, ii) => {
            if (ii !== iIdx) return it;

            if (!productoReal) {
              return {
                ...it,
                producto: '',
                producto_id: undefined,
                precio_unitario: undefined,
                stock: undefined,
              };
            }

            return {
              ...it,
              producto: productoReal.nombre_producto,
              producto_id: productoReal.id,
              precio_unitario: productoReal.precio,
              stock: productoReal.stock,
              cantidad: it.cantidad && it.cantidad > 0 ? it.cantidad : 1,
            };
          }),
        };
      })
    );
  };

  const handleSedeChange = (gIdx: number, value: string) => {
    const sede = findSedeByNombre(value);
    if (sede) {
      void loadProductosForSede(sede.sede_id);
      void loadZonasForSede(sede.sede_id);
    }

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
        ? dateOnlyToPeruISO(g.fecha_entrega.slice(0, 10))
        : "",
    };
  }
  const hasInvalid = useMemo(() => {
    return (
      Object.keys(productoErrors).length > 0 ||
      duplicateIndices.size > 0 ||
      groups.some(
        (g) =>
          g.valido === false ||
          (Array.isArray(g.errores) && g.errores.length > 0)
      )
    );
  }, [groups, productoErrors, duplicateIndices]);

  const confirmarImportacion = async () => {
    setError(null);

    if (hasInvalid) {
      setError("Hay datos inválidos o faltantes. Corrige los campos en rojo.");
      return;
    }

    const groupsToSend = Object.values(selected).some(Boolean)
      ? groups.filter((_, i) => selected[i])
      : groups;

    try {
      setLoading(true);
      setProgress(0);

      const total = groupsToSend.length;
      const chunksTarget = 10;
      const BATCH_SIZE = Math.max(1, Math.ceil(total / chunksTarget));
      let processed = 0;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = groupsToSend.slice(i, i + BATCH_SIZE);
        const payload: ImportPayload = {
          groups: batch.map(normalizeGroupForSend),
        };

        const result = await importPedidosDesdePreview(payload, token);

        if (result.estado === "parcial" || result.estado === "error") {
          const errores = result.errores ?? [];
          throw new Error(
            `Error en el proceso (filas probables ${i + 1} - ${Math.min(i + BATCH_SIZE, total)}).\n` +
            `Se importaron ${result.insertados} de ${result.total} en este lote.\n\n` +
            errores
              .map((e) => `Fila ${e.fila}: ${e.errores.join(", ")}`)
              .join("\n")
          );
        }

        processed += batch.length;
        setProgress(Math.round((processed / total) * 100));
      }

      onImported();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Error al importar");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // ===== eliminar filas seleccionadas =====
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = () => {
    setGroups((prev) => prev.filter((_, i) => !selected[i]));
    setSelected({});
    setShowDeleteConfirm(false);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  if (!open) return null;

  const isProductoNoExiste = (gIdx: number, iIdx: number) => {
    const key = productoKey(gIdx, iIdx);
    return !!productoErrors[key];
  };

  const isProductoSinStock = (stock?: number | null) =>
    stock != null && Number(stock) <= 0;


  return (
    <CenteredModal
      title=""
      onClose={loading ? () => { } : onClose}
      widthClass="max-w-[1680px] w-[98vw]"
      hideHeader
      hideCloseButton
      bodyClassName="p-4 sm:p-5 md:p-6 bg-white max-h-[82vh] overflow-auto"
    >
      <div className="space-y-4">
        {/* ================= HEADER ================= */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                  <Icon
                    icon="mdi:clipboard-check-outline"
                    width="22"
                    height="22"
                    className="text-primary"
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                    VALIDACIÓN DE DATOS
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Datos ingresados del excel, última validación
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                      <span className="font-semibold text-slate-500">Total:</span>
                      <span className="font-extrabold tabular-nums">
                        {groups.length}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-700">
                      <span className="font-semibold text-slate-500">
                        Seleccionados:
                      </span>
                      <span className="font-extrabold tabular-nums">
                        {selectedCount}
                      </span>
                    </span>

                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold",
                        hasInvalid
                          ? "bg-rose-50 border border-rose-100 text-rose-700"
                          : "bg-emerald-50 border border-emerald-100 text-emerald-800",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "w-2 h-2 rounded-full",
                          hasInvalid ? "bg-rose-500" : "bg-emerald-500",
                        ].join(" ")}
                      />
                      {hasInvalid ? "Hay campos por corregir" : "Listo para importar"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => !loading && onClose()}
                disabled={loading}
                className={`w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50 text-slate-700 shrink-0 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ================= TOOLBAR ================= */}
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  ref={headerChkRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="mt-1 h-4 w-4 rounded border-gray-400 text-primary focus:ring-primary/30"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] text-slate-800 font-semibold">
                    Seleccionar todo
                  </span>
                  <span className="block text-[12px] text-slate-500">
                    Selecciona filas para importar o eliminar
                  </span>
                </span>
              </label>

              <Buttonx
                variant="outlined"
                label="Eliminar seleccionadas"
                icon="tabler:trash"
                disabled={!someSelected}
                onClick={() => setShowDeleteConfirm(true)}
                className={[
                  "text-sm",
                  "!border-rose-300 !text-rose-600 hover:!bg-rose-50",
                  !someSelected ? "opacity-50" : "",
                ].join(" ")}
              />
            </div>

            {/* Leyendas */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Campos inválidos / requeridos
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Sede / distrito no válido
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[12px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                Producto no encontrado en sede
              </span>
            </div>
          </div>
        </div>

        {/* ================= CONFIRM DELETE MODAL ================= */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-[420px] rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon icon="tabler:alert-circle" width="22" className="text-rose-600" />
                  <div className="text-sm font-extrabold text-slate-900">
                    Confirmar eliminación
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-slate-50"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-4 text-sm text-slate-600">
                ¿Seguro que deseas eliminar las filas seleccionadas? Esta acción no se puede deshacer.
              </div>

              <div className="px-5 pb-5 flex items-center justify-end gap-2">
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
                  onClick={handleConfirmDelete}
                  className="!bg-rose-600 hover:!bg-rose-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TABLE CARD ================= */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Vista previa</div>
              <div className="text-xs text-slate-500">
                Edita en línea y corrige los campos marcados
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-[12px] text-slate-700">
              <span className="font-semibold text-slate-500">Modo:</span>
              <span className="font-bold">Importar todo</span>
            </span>
          </div>

          <div className="overflow-auto max-h-[56vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-9" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[100px]" />
                <col className="w-[120px]" />
                <col className="w-[110px]" />
              </colgroup>

              <thead>
                <tr className="sticky top-0 z-10 bg-[#F3F6FA] text-xs font-semibold text-slate-600">
                  <th className="border-b border-gray-200 px-2 py-3" />
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Sede
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Nombre
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Distrito
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Celular
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Dirección
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Referencia
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Producto
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Cantidad
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Monto
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-center">
                    Fec. Entrega
                  </th>
                </tr>
              </thead>

              <tbody>
                {groups.map((g, gi) => {
                  const isInvalidSedeRow = isInvalidSede(g.courier || "");
                  const sedeClass = isInvalidSedeRow ? "bg-red-50" : "";

                  const sede = g.courier ? findSedeByNombre(g.courier) : undefined;
                  const distritosDeSede: Option[] = sede
                    ? (zonasPorSede[sede.sede_id] || []).map((z) => ({
                      value: z.distrito,
                      label: z.distrito,
                    }))
                    : [];

                  const distritoInvalido = isInvalidDistritoBySede(g);
                  const isDuplicate = duplicateIndices.has(gi);

                  return (
                    <React.Fragment key={gi}>
                      <tr
                        key={gi}
                        className={[
                          "transition-colors duration-150",
                          isDuplicate
                            ? "bg-red-100! border-red-200"
                            : "odd:bg-white even:bg-slate-50/40 hover:bg-[#F8FAFD]",
                        ].join(" ")}
                      >
                        <td className="border-b border-gray-200 px-2 py-2 align-middle">
                          <input
                            type="checkbox"
                            checked={!!selected[gi]}
                            onChange={() => toggleRow(gi)}
                            className="h-4 w-4 rounded accent-primary"
                          />
                        </td>

                        {/* Sede */}
                        <td
                          className={[
                            "border-b border-gray-200 px-3 py-2 align-middle",
                            sedeClass,
                          ].join(" ")}
                        >
                          <Autocomplete
                            value={g.courier || ""}
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

                          {isDuplicate && (
                            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-bold uppercase tracking-wide">
                              DUPLICADO
                            </div>
                          )}
                        </td>

                        <td className="border-b border-gray-200 px-3 py-2 align-middle">
                          <input
                            value={g.nombre}
                            onChange={(e) => patchGroup(gi, { nombre: e.target.value })}
                            className="w-full bg-transparent border border-transparent rounded px-1 py-1 truncate focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                            title={g.nombre}
                          />
                        </td>

                        {/* DISTRITO */}
                        <td
                          className={[
                            "border-b border-gray-200 px-3 py-2 align-middle",
                            distritoInvalido ? "bg-red-50" : "",
                          ].join(" ")}
                        >


                          <Autocomplete
                            value={g.distrito || ""}
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
                            className="w-full bg-transparent border border-transparent rounded px-1 py-1 truncate focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                            title={g.telefono}
                          />
                        </td>

                        <td className="border-b border-gray-200 px-3 py-2 align-middle">
                          <input
                            value={g.direccion}
                            onChange={(e) => patchGroup(gi, { direccion: e.target.value })}
                            className="w-full bg-transparent border border-transparent rounded px-1 py-1 truncate focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                            title={g.direccion}
                          />
                        </td>

                        <td className="border-b border-gray-200 px-3 py-2 align-middle">
                          <input
                            value={g.referencia || ""}
                            onChange={(e) =>
                              patchGroup(gi, { referencia: e.target.value })
                            }
                            className="w-full bg-transparent border border-transparent rounded px-1 py-1 truncate focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                            title={g.referencia || ""}
                          />
                        </td>



                        {/* PRODUCTOS */}
                        <td className="border-b border-gray-200 px-3 py-2 align-middle">
                          <div className="space-y-1">

                            {g.items.map((it, ii) => {
                              const noExiste = isProductoNoExiste(gi, ii);
                              const sinStock = isProductoSinStock(it.stock);
                              const rowSede = g.courier
                                ? findSedeByNombre(g.courier)
                                : undefined;

                              const productosOptions: Option[] = rowSede
                                ? (productosPorSede[rowSede.sede_id] || []).map((p) => ({
                                  value: String(p.id),
                                  label: p.nombre_producto,
                                }))
                                : [];

                              return (
                                <div key={ii} className="space-y-0.5">
                                  <Autocomplete
                                    value={it.producto || ""}
                                    options={productosOptions}
                                    placeholder="Nombre del producto"
                                    className={[
                                      "border-b border-gray-200 px-3 py-2 align-middle",
                                      g.items.some((_, ii) => isProductoNoExiste(gi, ii))
                                        ? "bg-red-100"
                                        : "",
                                    ].join(" ")}
                                    onChange={(label: string) => {
                                      setGroups(prev =>
                                        prev.map((g, gii) =>
                                          gii !== gi
                                            ? g
                                            : {
                                              ...g,
                                              items: g.items.map((item, iii) =>
                                                iii !== ii ? item : { ...item, producto: label }
                                              ),
                                            }
                                        )
                                      );
                                    }}
                                    onSelectOption={(opt) => {
                                      handleProductoNombre(gi, ii, String(opt.value));
                                    }}
                                  />

                                  {/* MENSAJES */}

                                  {noExiste && (
                                    <div className="text-[11px] text-red-700 font-semibold">
                                      Producto no existe en la sede
                                    </div>
                                  )}

                                  {!noExiste && sinStock && !productoErrors[productoKey(gi, ii)] && (
                                    <div className="text-[11px] text-red-600">
                                      Producto sin stock
                                    </div>
                                  )}

                                  {productoErrors[productoKey(gi, ii)] && !noExiste && (
                                    <div className="text-[11px] text-red-700 font-semibold">
                                      Stock total insuficiente considerando todas las filas
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

                              const cantidadInvalida = isInvalidCantidad(
                                cantidad,
                                stock
                              );

                              return (
                                <div key={ii} className="space-y-0.5">
                                  <input
                                    type="number"
                                    min={0}
                                    value={cantidad}
                                    onChange={(e) =>
                                      handleCantidad(gi, ii, Number(e.target.value))
                                    }
                                    className={[
                                      "w-full bg-transparent border border-transparent rounded px-2 h-10",
                                      "text-right text-base leading-tight",
                                      "focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20",
                                      cantidadInvalida ? "bg-red-50" : "",
                                    ].join(" ")}
                                    title={String(cantidad)}
                                  />

                                  {isSinStock(stock) && (
                                    <div className="text-[11px] text-red-600">
                                      Producto sin stock disponible.
                                    </div>
                                  )}

                                  {typeof stock === "number" && cantidad > stock && (
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
                              patchGroup(gi, {
                                monto_total: Number(e.target.value),
                                monto_editado: true,
                              })
                            }
                            className={[
                              "w-full bg-transparent border border-transparent rounded px-2 h-10",
                              "text-right text-base leading-tight",
                              "focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20",
                              (g.monto_total ?? 0) < 0 ? "bg-red-50" : "",
                            ].join(" ")}
                            title={String(g.monto_total ?? "")}
                          />
                        </td>

                        {/* FECHA ENTREGA */}
                        <td className="border-b border-gray-200 px-3 py-2.5 align-middle">
                          <input
                            type="date"
                            value={g.fecha_entrega ? g.fecha_entrega.slice(0, 10) : ""}
                            onChange={(e) =>
                              patchGroup(gi, {
                                fecha_entrega: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : undefined,
                              })
                            }
                            className="w-full bg-transparent border border-transparent rounded px-1 py-1 text-[0.9rem]
                            focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </td>
                      </tr>
                      {g.errores && g.errores.length > 0 && (
                        <tr className="bg-red-50">
                          <td colSpan={11} className="px-4 py-2">
                            <ul className="list-disc pl-5 text-[12px] text-red-700 space-y-1">
                              {g.errores.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </ React.Fragment >
                  );
                })}
              </tbody >
            </table>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* ================= FOOTER ================= */}
        <div className="flex items-center justify-end gap-2">
          {loading && (
            <div className="flex-1 mr-4">
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400 text-center">
                Importando... {progress}%
              </div>
            </div>
          )}

          <Buttonx
            variant="outlined"
            label="Cerrar"
            icon="mdi:close"
            onClick={onClose}
            disabled={loading}
          />

          <Buttonx
            variant="secondary"
            onClick={confirmarImportacion}
            disabled={loading || hasInvalid}
            label={loading ? "Importando…" : "Cargar Datos"}
            icon={loading ? "line-md:loading-twotone-loop" : "mdi:cloud-upload-outline"}
            className={loading ? "[&_svg]:animate-spin" : ""}
            title={hasInvalid ? "Corrige los campos en rojo" : ""}
          />
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(.97); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn { animation: fadeIn .15s ease-out; }

          table td, table th { border-right: 1px solid #eef0f2; }
          thead tr th:last-child, tbody tr td:last-child { border-right: none; }
          tbody tr:last-child td { border-bottom: 1px solid #eef0f2; }
        `}</style>
      </div>
    </CenteredModal>
  );
}
