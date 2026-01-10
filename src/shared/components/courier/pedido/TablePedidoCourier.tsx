import { useEffect, useMemo, useRef, useState } from "react";

import type {
  Paginated,
  PedidoListItem,
  ListPedidosHoyQuery,
  ListByEstadoQuery,
  PedidoDetalle,
} from "@/services/courier/pedidos/pedidos.types";

import {
  fetchPedidosAsignadosHoy,
  fetchPedidosPendientes,
  fetchPedidosTerminados,
  fetchPedidoDetalle,
  reassignPedido,
  reprogramarPedido,
  exportPedidosAsignadosPdf, // ✅ NUEVO
} from "@/services/courier/pedidos/pedidos.api";

import DetallePedidoDrawer from "./DetallePedidoDrawer";
import ReprogramarPedidoModal from "./ReprogramarPedidoModal";

import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import { SearchInputx } from "@/shared/common/SearchInputx";
import Tittlex from "@/shared/common/Tittlex";
import TableActionx from "@/shared/common/TableActionx";
import Badgex from "@/shared/common/Badgex"; // ✅ NUEVO

type View = "asignados" | "pendientes" | "terminados";

interface Props {
  view: View;
  token: string;
  onVerDetalle?: (id: number) => void;
  onAsignar?: (ids: number[]) => void;
  onReasignar?: (pedido: PedidoListItem) => void;
}

/* ---- utilidades de formato ---- */
const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});
const two = (n: number) => String(n).padStart(2, "0");

// 🔑 NORMALIZA cualquier fecha a YYYY-MM-DD
function normalizeDateOnly(v?: string) {
  if (!v) return undefined;
  return v.slice(0, 10); // evita timezone / ISO issues
}

function normalizeRange(desde?: string, hasta?: string) {
  const d = normalizeDateOnly(desde);
  const h = normalizeDateOnly(hasta);

  return {
    ...(d ? { desde: d } : {}),
    ...(h ? { hasta: h } : {}),
  };
}

/* ✅ NUEVO: HOY en Perú como YYYY-MM-DD (para que el backend filtre hoy por defecto) */
function getTodayPEYYYYMMDD() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export default function TablePedidoCourier({
  view,
  token,
  onAsignar,
  onReasignar,
}: Props) {
  /* paginación (server-side) */
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);

  /*  filtros de FECHA (server-side) */
  const [desde, setDesde] = useState<string>(() => getTodayPEYYYYMMDD());
  const [hasta, setHasta] = useState<string>(""); // YYYY-MM-DD (vacío hasta que elijas)

  /* filtros (client-side, visuales) */
  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroCantidad, setFiltroCantidad] = useState("");
  const [searchProducto, setSearchProducto] = useState("");

  // ✅ PARA PENDIENTES + TERMINADOS: filtro por motorizado
  const [filtroMotorizado, setFiltroMotorizado] = useState("");

  /* data */
  const [data, setData] = useState<Paginated<PedidoListItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  /* selección */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* ✅ NUEVO: estado descarga PDF (pendientes) */
  const [pdfLoading, setPdfLoading] = useState(false);

  /* detalle */
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* trigger para refetch luego de reasignar / reprogramar */
  const [reloadTick, setReloadTick] = useState(0);

  /* Reprogramar (modal) */
  const [reprogOpen, setReprogOpen] = useState(false);
  const [pedidoReprog, setPedidoReprog] = useState<PedidoListItem | null>(null);
  const [reprogLoading, setReprogLoading] = useState(false);

  // reset cuando cambia la vista
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setFiltroDistrito("");
    setFiltroCantidad("");
    setSearchProducto("");
    setFiltroMotorizado("");

    setDesde(getTodayPEYYYYMMDD());
    setHasta("");
  }, [view]);

  // si cambia rango => volver a la primera página
  useEffect(() => {
    setPage(1);
  }, [desde, hasta]);

  // querys para backend
  const qHoy: ListPedidosHoyQuery = useMemo(
    () => ({
      page,
      perPage,
      ...normalizeRange(desde, hasta),
    }),
    [page, perPage, desde, hasta]
  );

  const qEstado: ListByEstadoQuery = useMemo(
    () => ({
      page,
      perPage,
      sortBy: "programada",
      order: "asc",
      ...normalizeRange(desde, hasta),
    }),
    [page, perPage, desde, hasta]
  );

  // fetch según vista
  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      if (!token) {
        setError("No hay token");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        let resp: Paginated<PedidoListItem>;
        if (view === "asignados") {
          resp = await fetchPedidosAsignadosHoy(token, qHoy, {
            signal: ac.signal,
          });
        } else if (view === "pendientes") {
          resp = await fetchPedidosPendientes(token, qEstado, {
            signal: ac.signal,
          });
        } else {
          resp = await fetchPedidosTerminados(token, qEstado, {
            signal: ac.signal,
          });
        }
        setData(resp);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error al cargar pedidos");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [token, view, qHoy, qEstado, reloadTick]);

  const itemsBase = data?.items ?? [];

  // distritos únicos para el filtro
  const distritos = useMemo(
    () =>
      Array.from(
        new Set(itemsBase.map((x) => x.cliente?.distrito).filter(Boolean))
      ).sort() as string[],
    [itemsBase]
  );

  // ✅ PARA PENDIENTES + TERMINADOS: motorizados únicos para el filtro
  const motorizados = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of itemsBase) {
      const m = (p as any)?.motorizado;
      if (!m?.id) continue;
      const label =
        `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() ||
        `Motorizado #${m.id}`;
      if (!map.has(m.id)) map.set(m.id, label);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [itemsBase]);

  // filtros visuales (client-side)
  const itemsFiltrados = useMemo(() => {
    let arr = [...itemsBase];

    // 1) Distrito
    if (filtroDistrito) {
      arr = arr.filter((x) => x.cliente?.distrito === filtroDistrito);
    }

    // 2) Pendientes/Terminados: filtrar por motorizado | Asignados: filtrar por cantidad
    if (view === "pendientes" || view === "terminados") {
      if (filtroMotorizado) {
        const id = Number(filtroMotorizado);
        arr = arr.filter((x) => ((x as any)?.motorizado?.id ?? -1) === id);
      }
    } else {
      if (filtroCantidad) {
        const cant = Number(filtroCantidad);
        const cantidadDeItems = (x: PedidoListItem) =>
          x.items_total_cantidad ??
          x.items?.reduce((s, it) => s + it.cantidad, 0) ??
          0;
        arr = arr.filter((x) => cantidadDeItems(x) === cant);
      }
    }

    // 3) búsqueda por nombre de producto
    if (searchProducto.trim()) {
      const q = searchProducto.trim().toLowerCase();
      arr = arr.filter((x) =>
        (x.items ?? []).some((it) => it.nombre.toLowerCase().includes(q))
      );
    }

    return arr;
  }, [
    itemsBase,
    filtroDistrito,
    filtroCantidad,
    filtroMotorizado,
    searchProducto,
    view,
  ]);

  // ✅ selección de items visibles (para checkbox header)
  const pageIds = itemsFiltrados.map((p) => p.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected =
    !allSelected && pageIds.some((id) => selectedIds.includes(id));

  // header checkbox indeterminate
  const headerCbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const totalPages = data?.totalPages ?? 1;

  // Paginador
  const pagerItems = useMemo<(number | string)[]>(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    if (!totalPages || totalPages <= 1) return pages;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }

      for (let i = start; i <= end; i++) pages.push(i);
      if (start > 1) {
        pages.unshift("…");
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push("…");
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (!totalPages) return;
    if (p < 1 || p > totalPages || p === page || loading) return;
    setPage(p);
  };

  // 👁️ Ver detalle
  const handleVerDetalle = async (pedidoId: number) => {
    try {
      const data = await fetchPedidoDetalle(token, pedidoId);
      setDetalle(data);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error al cargar detalle:", err);
    }
  };

  // Reasignar
  const handleReasignar = async (p: PedidoListItem) => {
    if (onReasignar) return onReasignar(p);

    try {
      const raw = window.prompt(
        `Reasignar pedido ${p.codigo_pedido}\n\nIngrese el ID del nuevo repartidor:`,
        ""
      );
      if (!raw) return;
      const nuevoId = Number(raw);
      if (!Number.isFinite(nuevoId) || nuevoId <= 0) {
        setError("ID de repartidor inválido");
        return;
      }
      setLoading(true);
      setError("");
      await reassignPedido(token, { pedido_id: p.id, motorizado_id: nuevoId });
      setReloadTick((t) => t + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error al reasignar pedido");
    } finally {
      setLoading(false);
    }
  };

  // Reprogramar (abrir modal)
  const openReprogramar = (p: PedidoListItem) => {
    setPedidoReprog(p);
    setReprogOpen(true);
  };

  // Confirmar reprogramación
  const handleConfirmReprogramar = async (payload: {
    fecha_entrega_programada: string;
    observacion?: string;
  }) => {
    if (!pedidoReprog) return;

    try {
      setReprogLoading(true);
      setError("");

      await reprogramarPedido(token, {
        pedido_id: pedidoReprog.id,
        fecha_entrega_programada: payload.fecha_entrega_programada,
        observacion: payload.observacion ?? "",
      });

      setReprogOpen(false);
      setPedidoReprog(null);
      setReloadTick((t) => t + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error al reprogramar pedido");
    } finally {
      setReprogLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFiltroDistrito("");
    setFiltroCantidad("");
    setFiltroMotorizado("");
    setSearchProducto("");

    setDesde(getTodayPEYYYYMMDD());
    setHasta("");
  };

  // ✅ NUEVO: descargar PDF SOLO para Pendientes
  const handleDownloadPendientesPdf = async () => {
    try {
      if (view !== "pendientes") return;

      if (!selectedIds.length) {
        setError("Selecciona al menos un pedido para descargar.");
        return;
      }

      setPdfLoading(true);
      setError("");

      const blob = await exportPedidosAsignadosPdf(token, {
        pedidoIds: selectedIds,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-pendientes-${getTodayPEYYYYMMDD()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? "Error al descargar PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  // ✅ REEMPLAZO: Estado con Badgex (shape normal, NO pill)
  const getEstadoPill = (estado: string) => {
    const lower = (estado || "").toLowerCase();

    const cls =
      lower === "pendiente"
        ? "bg-amber-50 text-amber-700 border border-amber-200"
        : lower === "entregado"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-amber-50 text-amber-700 border border-amber-200"; // antes gris → ahora amarillo suave

    const label = lower === "pendiente" ? "Pendiente" : estado || "—";

    return (
      <Badgex
        className={`inline-flex items-center ${cls}`}
        size="xs"
        shape="soft"
        title={label}
      >
        {label}
      </Badgex>
    );
  };

  const title =
    view === "asignados"
      ? "Pedidos Asignados"
      : view === "pendientes"
      ? "Pedidos Pendientes"
      : "Pedidos Terminados";

  const description =
    view === "asignados"
      ? "Selecciona y asigna pedidos a un repartidor."
      : view === "pendientes"
      ? "Pedidos en gestión con el cliente (contacto, reprogramación, etc.)."
      : "Pedidos completados o cerrados.";

  return (
    <div className="flex flex-col gap-5 w-full bg-transparent overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Tittlex variant="section" title={title} description={description} />

        {/* ✅ BOTONES DERECHA: Asignados / Pendientes */}
        <div className="flex items-center gap-2">
          {view === "pendientes" && (
            <Buttonx
              label={pdfLoading ? "Generando PDF..." : "Descargar PDF"}
              variant="secondary"
              icon="mdi:file-pdf-box"
              onClick={handleDownloadPendientesPdf}
              // ✅ SOLO se activa cuando hay selección
              disabled={!selectedIds.length || loading || pdfLoading}
              title={
                !selectedIds.length
                  ? "Selecciona pedidos para descargar"
                  : "Descargar PDF"
              }
            />
          )}

          {view === "asignados" && (
            <Buttonx
              label="Asignar Repartidor"
              variant="secondary"
              icon="mdi:account-arrow-right-outline"
              onClick={() => onAsignar?.(selectedIds)}
              disabled={!selectedIds.length || loading}
              title={
                !selectedIds.length
                  ? "Selecciona al menos un pedido"
                  : "Asignar Repartidor"
              }
            />
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90">
        <div className="grid gap-4">
          {/* ===== Fila 1 ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <SelectxDate
              label="Fecha Inicio"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              disabled={loading}
            />
            <SelectxDate
              label="Fecha Fin"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              disabled={loading}
            />

            <Selectx
              label="Distrito"
              name="filtro_distrito"
              value={filtroDistrito}
              onChange={(e) => setFiltroDistrito(e.target.value)}
              placeholder="Todos los distritos"
              disabled={loading}
            >
              {distritos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Selectx>

            {view === "pendientes" || view === "terminados" ? (
              <Selectx
                label="Motorizado"
                name="filtro_motorizado"
                value={filtroMotorizado}
                onChange={(e) => setFiltroMotorizado(e.target.value)}
                placeholder="Todos los motorizados"
                disabled={loading}
              >
                {motorizados.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.label}
                  </option>
                ))}
              </Selectx>
            ) : (
              <Selectx
                label="Cantidad de productos"
                name="filtro_cantidad"
                value={filtroCantidad}
                onChange={(e) => setFiltroCantidad(e.target.value)}
                placeholder="Seleccionar cantidad"
                disabled={loading}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {two(n)}
                  </option>
                ))}
              </Selectx>
            )}
          </div>

          {/* ===== Fila 2 ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <SearchInputx
              placeholder="Buscar productos por nombre..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              className="w-full"
            />

            <Buttonx
              variant="outlined"
              onClick={handleClearFilters}
              label="Limpiar filtros"
              icon="mynaui:delete"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="py-10 text-center text-gray-500">Cargando...</div>
      )}
      {!loading && error && (
        <div className="py-10 text-center text-red-600">{error}</div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-white rounded-md overflow-hidden shadow-default">
          <div className="overflow-x-auto bg-white">
            <table
              key={view}
              className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md"
            >
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[28%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[5%]" />
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">
                    <input
                      ref={headerCbRef}
                      type="checkbox"
                      className="cursor-pointer"
                      checked={allSelected}
                      onChange={(e) => {
                        // ✅ selección SOLO en asignados y pendientes (para PDF)
                        if (view !== "asignados" && view !== "pendientes") return;

                        if (e.target.checked) {
                          setSelectedIds((prev) =>
                            Array.from(new Set([...prev, ...pageIds]))
                          );
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => !pageIds.includes(id))
                          );
                        }
                      }}
                      disabled={view !== "asignados" && view !== "pendientes"}
                    />
                  </th>

                  <th className="px-4 py-3 text-left">Fec. Entrega</th>
                  <th className="px-4 py-3 text-left">Distrito</th>
                  <th className="px-4 py-3 text-left">Ecommerce</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Dirección de Entrega</th>
                  <th className="px-4 py-3 text-center">
                    Cant. de productos
                  </th>
                  <th className="px-4 py-3 text-left">Monto</th>

                  {(view === "pendientes" || view === "terminados") && (
                    <th className="px-4 py-3 text-center">Estado</th>
                  )}

                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {itemsFiltrados.map((p) => {
                  const fecha = p.fecha_entrega_programada;

                  const cantidad =
                    p.items_total_cantidad ??
                    p.items?.reduce((s, it) => s + it.cantidad, 0) ??
                    0;

                  const direccion = p.cliente?.direccion ?? "";
                  const montoNumber = Number(p.monto_recaudar || 0);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray10 transition-colors"
                    >
                      <td className="h-12 px-4 py-3">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) => {
                            // ✅ SOLO en asignados + pendientes (PDF)
                            if (view !== "asignados" && view !== "pendientes")
                              return;

                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, p.id]
                                : prev.filter((x) => x !== p.id)
                            );
                          }}
                          disabled={view !== "asignados" && view !== "pendientes"}
                        />
                      </td>

                      <td className="h-12 px-4 py-3 text-gray70">
                        {fecha ?? "—"}
                      </td>

                      <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                        {p.cliente?.distrito ?? "—"}
                      </td>

                      <td className="h-12 px-4 py-3 text-gray70">
                        {p.ecommerce?.nombre_comercial ?? "—"}
                      </td>

                      <td className="h-12 px-4 py-3 text-gray70">
                        {p.cliente?.nombre ?? "—"}
                      </td>

                      <td
                        className="h-12 px-4 py-3 text-gray70 truncate max-w-[260px]"
                        title={direccion}
                      >
                        {direccion || "—"}
                      </td>

                      <td className="h-12 px-4 py-3 text-center text-gray70">
                        {two(cantidad)}
                      </td>

                      <td className="h-12 px-4 py-3 text-gray70">
                        {PEN.format(montoNumber)}
                      </td>

                      {(view === "pendientes" || view === "terminados") && (
                        <td className="px-4 py-3 text-center">
                          {getEstadoPill(p.estado_nombre ?? "—")}
                        </td>
                      )}

                      <td className="h-12 px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <TableActionx
                            variant="view"
                            title={`Ver ${p.id}`}
                            onClick={() => handleVerDetalle(p.id)}
                            size="sm"
                          />

                          {view === "asignados" && (
                            <TableActionx
                              variant="custom"
                              title={`Reprogramar ${p.id}`}
                              icon="mdi:calendar-edit"
                              colorClassName="bg-amber-100 text-amber-700 ring-1 ring-amber-300 hover:bg-amber-200 hover:ring-amber-400 focus-visible:ring-amber-500"
                              onClick={() => openReprogramar(p)}
                              size="sm"
                            />
                          )}

                          {view === "pendientes" && (
                            <TableActionx
                              variant="custom"
                              title={`Reasignar ${p.id}`}
                              icon="mdi:swap-horizontal"
                              colorClassName="bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-200 hover:ring-indigo-400 focus-visible:ring-indigo-500"
                              onClick={() => handleReasignar(p)}
                              size="sm"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!itemsFiltrados.length && (
                  <tr className="hover:bg-transparent">
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray70 italic"
                    >
                      No hay pedidos para esta etapa con los filtros
                      seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 border-b border-gray90 py-3 px-3 mt-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1 || loading}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                aria-label="Página anterior"
              >
                &lt;
              </button>

              {pagerItems.map((p, i) =>
                typeof p === "string" ? (
                  <span key={`dots-${i}`} className="px-2 text-gray70">
                    {p}
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={page === p ? "page" : undefined}
                    className={[
                      "w-8 h-8 flex items-center justify-center rounded",
                      page === p
                        ? "bg-gray90 text-white"
                        : "bg-gray10 text-gray70 hover:bg-gray20",
                    ].join(" ")}
                    disabled={loading}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages || loading}
                className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
                aria-label="Página siguiente"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drawer del detalle */}
      <DetallePedidoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        detalle={detalle}
      />

      {/* Modal Reprogramar */}
      <ReprogramarPedidoModal
        open={reprogOpen}
        loading={reprogLoading}
        pedidoCodigo={pedidoReprog?.codigo_pedido}
        fechaActual={pedidoReprog?.fecha_entrega_programada ?? null}
        onClose={() => {
          setReprogOpen(false);
          setPedidoReprog(null);
        }}
        onConfirm={handleConfirmReprogramar}
      />
    </div>
  );
}
