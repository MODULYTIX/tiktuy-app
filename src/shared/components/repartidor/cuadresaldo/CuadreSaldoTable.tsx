// src/shared/components/repartidor/cuadresaldo/CuadreSaldoTable.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCuadreResumen,
  fetchCuadreDetalle,
  putCuadreValidacion,
} from "@/services/repartidor/cuadreSaldo/cuadreSaldo.api";
import type {
  CuadreResumenItem,
  CuadreDetalleResponse,
} from "@/services/repartidor/cuadreSaldo/cuadreSaldo.types";

/* ===================== Helpers UI ===================== */

type Estado = "Validado" | "Por Validar";

const formatPEN = (v: number) =>
  `S/. ${v.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toYMD = (isoLike: string) => isoLike.slice(0, 10); // 'YYYY-MM-DD'
const ymdToDMY = (ymd: string) => {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
};
const isoToDMY = (iso: string) => ymdToDMY(toYMD(iso));

const EstadoPill: React.FC<{ estado: Estado }> = ({ estado }) => {
  const ok = estado === "Validado";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        ok ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-900",
      ].join(" ")}
    >
      {estado}
    </span>
  );
};

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 5 12 5c4.64 0 8.577 2.51 9.964 6.678.07.214.07.43 0 .644C20.577 16.49 16.64 19 12 19c-4.64 0-8.577-2.51-9.964-6.678z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const Checkbox = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
    {...props}
  />
);

/* ===================== Modal ===================== */

type ModalProps = React.PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
}>;

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
};

/* ===================== Componente ===================== */

type Props = {
  token: string;
  /** Filtro desde la página (YYYY-MM-DD) */
  desde?: string;
  /** Filtro desde la página (YYYY-MM-DD) */
  hasta?: string;
  /** Señal desde el header para VALIDAR en lote los seleccionados */
  triggerValidate?: number;
};

const CuadreSaldoTable: React.FC<Props> = ({
  token,
  desde,
  hasta,
  triggerValidate,
}) => {
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Datos
  const [items, setItems] = useState<CuadreResumenItem[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Selección (por fecha YYYY-MM-DD)
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allChecked = useMemo(() => {
    const keys = items.map((it) => toYMD(it.fecha));
    if (!keys.length) return false;
    return keys.every((k) => selected[k]);
  }, [items, selected]);

  const toggleAll = () => {
    const keys = items.map((it) => toYMD(it.fecha));
    const nextVal = !allChecked;
    const s: Record<string, boolean> = { ...selected };
    keys.forEach((k) => (s[k] = nextVal));
    setSelected(s);
  };
  const toggleOne = (ymd: string) =>
    setSelected((prev) => ({ ...prev, [ymd]: !prev[ymd] }));

  // Detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<CuadreDetalleResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  /* --------- Carga de resumen --------- */
  const loadResumen = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchCuadreResumen(token, {
        desde,
        hasta,
        page,
        pageSize,
      });
      setItems(data.items);
      setTotal(data.total);
      setSelected({});
    } catch (e: any) {
      setErr(e?.message ?? "Error al cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  // Si cambian filtros, reset page
  useEffect(() => {
    setPage(1);
  }, [desde, hasta]);

  // Cargar cuando cambian dependencias
  useEffect(() => {
    loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize, desde, hasta]);

  /* --------- Acciones --------- */

  const openDetalle = async (iso: string) => {
    const ymd = toYMD(iso);
    setDetailOpen(true);
    setDetailDate(ymd);
    setDetail(null);
    setDetailErr(null);
    setDetailLoading(true);
    try {
      const d = await fetchCuadreDetalle(token, ymd);
      setDetail(d);
    } catch (e: any) {
      setDetailErr(e?.message ?? "Error al cargar el detalle");
    } finally {
      setDetailLoading(false);
    }
  };

  const onValidar = async (ymd: string, nextValue: boolean) => {
    try {
      await putCuadreValidacion(token, ymd, { validado: nextValue });
      await loadResumen();
    } catch (e: any) {
      alert(e?.message ?? "Error al actualizar validación");
    }
  };

  // Validación masiva (true = validar)
  const onValidarSeleccionados = async () => {
    const list = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!list.length) {
      alert("Selecciona al menos un día para validar.");
      return;
    }
    try {
      await Promise.all(
        list.map((ymd) => putCuadreValidacion(token, ymd, { validado: true }))
      );
      await loadResumen();
    } catch (e: any) {
      alert(e?.message ?? "Error al validar seleccionados");
    }
  };

  // Escucha la señal desde el botón del header
  const prevTrig = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (triggerValidate === undefined) return;
    if (prevTrig.current === undefined) {
      prevTrig.current = triggerValidate;
      return;
    }
    if (triggerValidate !== prevTrig.current) {
      prevTrig.current = triggerValidate;
      onValidarSeleccionados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerValidate]);

  /* ===================== Render ===================== */

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="w-12 p-4">
                <Checkbox checked={allChecked} onChange={toggleAll} />
              </th>
              <th className="p-4 font-semibold">Fec. Entrega</th>
              <th className="p-4 font-semibold">Monto por Servicio</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {err && (
              <tr>
                <td colSpan={5} className="p-4 text-red-600">
                  {err}
                </td>
              </tr>
            )}

            {!err && items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-500">
                  No hay datos para el filtro seleccionado.
                </td>
              </tr>
            )}

            {items.map((row) => {
              const ymd = toYMD(row.fecha);
              const estado: Estado = row.validado ? "Validado" : "Por Validar";
              return (
                <tr key={ymd} className="hover:bg-gray-50">
                  <td className="p-4">
                    <Checkbox
                      checked={!!selected[ymd]}
                      onChange={() => toggleOne(ymd)}
                    />
                  </td>
                  <td className="p-4">{isoToDMY(row.fecha)}</td>
                  <td className="p-4">
                    {formatPEN(row.totalServicioMotorizado)}
                  </td>
                  <td className="p-4">
                    <EstadoPill estado={estado} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="Ver detalle"
                        onClick={() => openDetalle(row.fecha)}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 hover:bg-gray-50"
                      >
                        <EyeIcon />
                      </button>

                      <button
                        onClick={() => onValidar(ymd, !row.validado)}
                        className={[
                          "rounded-md px-3 py-1.5 text-sm",
                          row.validado
                            ? "border hover:bg-gray-50"
                            : "bg-gray-900 text-white hover:opacity-90",
                        ].join(" ")}
                      >
                        {row.validado ? "Quitar validación" : "Validar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-600">
                  Cargando…
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="text-xs text-gray-600">
            Página {page} de {totalPages} • {total} día(s)
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              {"<"}
            </button>
            <button
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detalle */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          detailDate ? `Detalle del ${ymdToDMY(detailDate)}` : "Detalle del día"
        }
      >
        {detailLoading && (
          <div className="p-4 text-sm text-gray-600">Cargando detalle…</div>
        )}
        {detailErr && (
          <div className="p-4 text-sm text-red-600">{detailErr}</div>
        )}

        {detail && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Recaudado: </span>
                <strong>{formatPEN(detail.totalRecaudado)}</strong>
              </div>
              <div>
                <span className="text-gray-500">Total Servicio: </span>
                <strong>{formatPEN(detail.totalServicioMotorizado)}</strong>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="p-3">Hora</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Método</th>
                    <th className="p-3">Distrito</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-right">Servicio</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {detail.pedidos.map((p) => {
                    const hora = p.fechaEntrega
                      ? new Date(p.fechaEntrega).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-3">{hora}</td>
                        <td className="p-3">{p.codigo}</td>
                        <td className="p-3">{p.cliente}</td>
                        <td className="p-3">{p.metodoPago ?? "-"}</td>
                        <td className="p-3">{p.distrito}</td>
                        <td className="p-3 text-right">
                          {formatPEN(p.monto ?? 0)}
                        </td>
                        <td className="p-3 text-right">
                          {p.servicioCourier != null
                            ? formatPEN(p.servicioCourier)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {detail.pedidos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-3 text-gray-500">
                        Sin pedidos para este día.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CuadreSaldoTable;
