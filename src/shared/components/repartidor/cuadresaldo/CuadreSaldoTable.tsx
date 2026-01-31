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
import TableActionx from "@/shared/common/TableActionx";
import { Icon } from "@iconify/react";
import Buttonx from "@/shared/common/Buttonx";

/* ===================== Helpers UI ===================== */

type Estado = "Validado" | "Por Validar";

const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const TZ_PE = "America/Lima";

function normalizeToYMD(val: string | Date): string {
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ_PE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(val);
  }

  if (typeof val !== "string") return "";

  const s = String(val).trim();
  if (!s) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const head = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_PE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function ymdToDMY(ymd: string) {
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return "-";
  return `${d}/${m}/${y}`;
}

function toHoraPE(isoLike: string | Date | null | undefined) {
  if (!isoLike) return "-";
  const d = typeof isoLike === "string" ? new Date(isoLike) : isoLike;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("es-PE", {
    timeZone: TZ_PE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

const normMetodoPago = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

/* Mapeo visual del método de pago */
function metodoPagoLabel(metodoPago: unknown) {
  const m = normMetodoPago(metodoPago);

  // Sin método → pedido rechazado
  if (!m) return "Pedido rechazado";

  if (m === "DIRECTO_ECOMMERCE") return "Pago Digital al Ecommerce / Pagado";
  if (m === "BILLETERA") return "Pago Digital al Courier / Pagado";
  if (m === "EFECTIVO") return "Efectivo / Pagado";

  return String(metodoPago ?? "Pedido rechazado");
}

function isRejectedPedido(p: any): boolean {
  const estado = String(
    p?.estadoNombre ??
    p?.estado_nombre ??
    ""
  ).toLowerCase().trim();

  const metodo = normMetodoPago(p?.metodoPago);

  // Estados que equivalen a rechazo
  const estadosRechazados = [
    "pedido rechazado",
    "rechazado",
    "no hizo el pedido",
  ];

  //  Rechazado por estado
  if (estadosRechazados.includes(estado)) return true;

  //  Sin método de pago → rechazo
  if (!metodo) return true;

  return false;
}


function montoVisualPedido(p: any): number {
  if (isRejectedPedido(p)) return 0;

  const metodo = normMetodoPago(p?.metodoPago);
  if (metodo === "DIRECTO_ECOMMERCE") return 0;

  return Number(p?.monto ?? 0);
}

function montoRecaudadoEfectivo(p: any): number {
  if (isRejectedPedido(p)) return 0;

  const metodo = normMetodoPago(p?.metodoPago);
  if (metodo !== "EFECTIVO") return 0;

  return Number(p?.monto ?? 0);
}

const EstadoPill: React.FC<{ estado: Estado }> = ({ estado }) => {
  const ok = estado === "Validado";
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full px-3 py-[6px] text-[12px] font-semibold shadow-sm",
        ok ? "bg-gray90 text-white" : "bg-gray-200 text-gray-900",
      ].join(" ")}
    >
      {estado}
    </span>
  );
};

const Checkbox = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
    {...props}
  />
);

/* ===================== Modal base ===================== */

type ModalProps = React.PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
}>;

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
};

/* ===================== Modal Confirmar Validación (por fila) ===================== */

type ConfirmValidateModalProps = {
  open: boolean;
  ymd: string;
  row?: CuadreResumenItem | null;
  checked: boolean;
  busy: boolean;
  onToggleChecked: (v: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmValidateModal: React.FC<ConfirmValidateModalProps> = ({
  open,
  ymd,
  row,
  checked,
  busy,
  onToggleChecked,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const fecha = ymdToDMY(ymd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-gray30">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
            <Icon icon="mdi:clipboard-check-outline" width={22} height={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray90">
              Confirmar validación
            </h3>
            <p className="text-sm text-gray-600">
              Vas a validar el cuadre del día{" "}
              <span className="font-semibold">{fecha}</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            title="Cerrar"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray30 bg-white text-gray70 hover:bg-gray10 disabled:opacity-60"
          >
            <Icon icon="mdi:close" width={18} height={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:information-outline"
                width={18}
                height={18}
                className="mt-0.5 text-emerald-700"
              />
              <div className="text-[12px] text-emerald-900">
                <div className="font-semibold">Antes de continuar</div>
                <div className="text-emerald-800/90">
                  Esta acción marcará el día como <b>Validado</b> y se reflejará
                  en la tabla.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray30 bg-white p-3">
              <div className="text-[11px] text-gray-500">Fecha</div>
              <div className="text-[13px] font-semibold text-gray90">
                {fecha}
              </div>
            </div>

            <div className="rounded-xl border border-gray30 bg-white p-3">
              <div className="text-[11px] text-gray-500">Servicio</div>
              <div className="text-[13px] font-semibold text-gray90">
                {row
                  ? formatPEN((row as any).totalServicioMotorizado ?? 0)
                  : "—"}
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-gray30 bg-gray10 p-3 cursor-pointer select-none">
            <Checkbox
              checked={checked}
              onChange={(e) => onToggleChecked(e.target.checked)}
              disabled={busy}
            />
            <div className="text-[12px] text-gray80">
              Confirmo que deseo validar el cuadre del día <b>{fecha}</b>.
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white">
          <Buttonx
            label="Cancelar"
            variant="tertiary"
            onClick={onClose}
            disabled={busy}
          />

          <Buttonx
            label={busy ? "Validando…" : "Sí, validar"}
            variant="secondary"
            icon="mdi:clipboard-check-outline"
            onClick={onConfirm}
            disabled={!checked || busy}
          />
        </div>
      </div>
    </div>
  );
};

/* ===================== Componente ===================== */

type Props = {
  token: string;
  desde?: string;
  hasta?: string;
  triggerValidate?: number;

  //  para que el header deshabilite/habilite y reciba los items seleccionados
  onSelectionChange?: (items: CuadreResumenItem[]) => void;
};

const CuadreSaldoTable: React.FC<Props> = ({
  token,
  desde,
  hasta,
  triggerValidate,
  onSelectionChange,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);

  const [items, setItems] = useState<CuadreResumenItem[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  //  SOLO se seleccionables: NO validados
  const selectableKeys = useMemo(() => {
    return items
      .filter((it: any) => !it?.validado)
      .map((it: any) => normalizeToYMD(it.fecha))
      .filter(Boolean);
  }, [items]);

  // Lista de objetos seleccionados
  const selectedItemsList = useMemo(() => {
    return items.filter((it: any) => {
      const ymd = normalizeToYMD(it.fecha);
      return ymd && selected[ymd];
    });
  }, [items, selected]);

  useEffect(() => {
    onSelectionChange?.(selectedItemsList);
  }, [selectedItemsList, onSelectionChange]);

  const allChecked = useMemo(() => {
    if (!selectableKeys.length) return false;
    return selectableKeys.every((k) => selected[k]);
  }, [selectableKeys, selected]);

  const toggleAll = () => {
    if (!selectableKeys.length) return;
    const nextVal = !allChecked;
    const s: Record<string, boolean> = {};
    selectableKeys.forEach((k) => {
      s[k] = nextVal;
    });
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

  // Modal validación por fila
  const [validateOpen, setValidateOpen] = useState(false);
  const [validateYmd, setValidateYmd] = useState<string>("");
  const [validateRow, setValidateRow] = useState<CuadreResumenItem | null>(null);
  const [validateChecked, setValidateChecked] = useState(false);
  const [validateBusy, setValidateBusy] = useState(false);

  const closeValidateModal = () => {
    if (validateBusy) return;
    setValidateOpen(false);
    setValidateYmd("");
    setValidateRow(null);
    setValidateChecked(false);
  };

  const openValidateModal = (row: CuadreResumenItem) => {
    const ymd = normalizeToYMD((row as any).fecha);
    if (!ymd) {
      alert("Fecha inválida");
      return;
    }
    setValidateRow(row);
    setValidateYmd(ymd);
    setValidateChecked(false);
    setValidateOpen(true);
  };

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

  useEffect(() => {
    setPage(1);
  }, [desde, hasta]);

  useEffect(() => {
    void loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize, desde, hasta]);

  const openDetalle = async (fechaLike: any) => {
    const ymd = normalizeToYMD(fechaLike);
    if (!ymd) return alert("Fecha inválida");

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

  const doValidarYMD = async (ymd: string) => {
    await putCuadreValidacion(token, ymd, { validado: true });
    // Recargar la tabla para mostrar loading/skeleton y actualizar datos reales
    await loadResumen();
  };

  const onConfirmValidarFromModal = async () => {
    if (!validateYmd) return;
    if (!validateChecked) return;

    try {
      setValidateBusy(true);
      await doValidarYMD(validateYmd);
      closeValidateModal();
    } catch (e: any) {
      alert(e?.message ?? "Error al validar");
    } finally {
      setValidateBusy(false);
    }
  };

  const onValidarSeleccionados = async () => {
    const list = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (!list.length) {
      alert("Selecciona al menos un registro para validar.");
      return;
    }

    try {
      setLoading(true); // Forzar loading visual inmediato
      await Promise.all(
        list.map((ymd) => putCuadreValidacion(token, ymd, { validado: true }))
      );
      // Recargar todo
      await loadResumen();
    } catch (e: any) {
      alert(e?.message ?? "Error al validar seleccionados");
      setLoading(false); // Si falló antes de loadResumen, quitamos loading
    }
  };

  const prevTrig = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (triggerValidate === undefined) return;
    if (prevTrig.current === undefined) {
      prevTrig.current = triggerValidate;
      return;
    }
    if (triggerValidate !== prevTrig.current) {
      prevTrig.current = triggerValidate;
      void onValidarSeleccionados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerValidate]);

  const totalRecaudadoEfectivo = useMemo(() => {
    if (!detail?.pedidos) return 0;

    return detail.pedidos.reduce(
      (acc: number, p: any) => acc + montoRecaudadoEfectivo(p),
      0
    );
  }, [detail]);


  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
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
        pages.unshift("...");
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  return (
    <div className="w-full min-w-0">
      <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30 min-w-0 relative z-0">
        <div className="relative overflow-x-auto lg:overflow-x-visible bg-white">
          <table className="w-full min-w-[820px] lg:min-w-0 table-auto text-[12px] bg-white border-b border-gray30 rounded-t-md">
            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium">
                <th className="px-4 py-3 w-[44px] text-left">
                  <Checkbox
                    checked={allChecked}
                    onChange={toggleAll}
                    disabled={!selectableKeys.length || loading}
                    title={
                      !selectableKeys.length
                        ? "No hay registros por validar"
                        : "Seleccionar todo"
                    }
                  />
                </th>

                <th className="px-4 py-3 text-left whitespace-nowrap">
                  Fec. Entrega
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">
                  Monto por Servicio
                </th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Estado</th>

                <th
                  className="
                    px-4 py-3 text-center whitespace-nowrap w-[140px]
                    sticky right-0 z-20
                    bg-[#E5E7EB] border-l border-gray30
                    lg:static lg:right-auto lg:z-auto
                  "
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {err && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-red-600">
                    {err}
                  </td>
                </tr>
              )}

              {!err && items.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray70 italic"
                  >
                    No hay datos para el filtro seleccionado.
                  </td>
                </tr>
              )}

              {!loading && items.map((row: any) => {
                const ymd = normalizeToYMD(row.fecha);
                const isValidated = !!row.validado;
                const estado: Estado = isValidated ? "Validado" : "Por Validar";


                return (
                  <tr
                    key={ymd || String(row.fecha)}
                    className="group hover:bg-gray10 transition-colors"
                  >
                    <td className="h-12 px-4 py-3">
                      <Checkbox
                        checked={!!selected[ymd]}
                        onChange={() => {
                          if (!isValidated && ymd) toggleOne(ymd);
                        }}
                        disabled={!ymd || isValidated || loading}
                        title={
                          isValidated
                            ? "Ya está validado"
                            : "Seleccionar registro"
                        }
                      />
                    </td>

                    <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                      {ymdToDMY(ymd)}
                    </td>

                    <td className="h-12 px-4 py-3 text-gray70 whitespace-nowrap">
                      {formatPEN(row.totalServicioMotorizado)}
                    </td>

                    <td className="h-12 px-4 py-3">
                      <EstadoPill estado={estado} />
                    </td>

                    <td
                      className="
                        h-12 px-4 py-3 w-[140px]
                        sticky right-0 z-10
                        bg-white group-hover:bg-gray10
                        border-l border-gray30
                        lg:static lg:right-auto lg:z-auto
                        lg:bg-transparent
                      "
                    >
                      <div className="flex items-center justify-center gap-3">
                        <TableActionx
                          variant="view"
                          title="Ver detalle"
                          onClick={() => openDetalle(row.fecha)}
                          size="sm"
                        />

                        {!isValidated && (
                          <TableActionx
                            variant="custom"
                            title="Validar"
                            icon="mdi:clipboard-check-outline"
                            disabled={loading || !ymd}
                            colorClassName="bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-200 hover:ring-emerald-400 focus-visible:ring-emerald-500"
                            onClick={() => openValidateModal(row)}
                            size="sm"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray70">
                    Cargando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || loading}
            className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            type="button"
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
                disabled={loading}
                className={[
                  "w-8 h-8 flex items-center justify-center rounded",
                  page === p
                    ? "bg-gray90 text-white"
                    : "bg-gray10 text-gray70 hover:bg-gray20",
                ].join(" ")}
                type="button"
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || loading}
            className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            type="button"
          >
            &gt;
          </button>
        </div>
      </div>

      <ConfirmValidateModal
        open={validateOpen}
        ymd={validateYmd}
        row={validateRow}
        checked={validateChecked}
        busy={validateBusy}
        onToggleChecked={setValidateChecked}
        onClose={closeValidateModal}
        onConfirm={onConfirmValidarFromModal}
      />

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

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Recaudado: </span>
                <strong>{formatPEN(totalRecaudadoEfectivo)}</strong>
              </div>
              <div>
                <span className="text-gray-500">Total Servicio: </span>
                <strong>{formatPEN(detail.totalServicioMotorizado)}</strong>
              </div>
            </div>

            <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
                  <thead className="bg-[#E5E7EB]">
                    <tr className="text-gray70 font-roboto font-medium">
                      <th className="px-4 py-3 text-left">Hora</th>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Método de Pago / Estado</th>
                      <th className="px-4 py-3 text-left">Distrito</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3 text-right">Servicio</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray20">
                    {detail.pedidos.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray10 transition-colors"
                      >
                        <td className="h-12 px-4 py-3 text-gray70">
                          {toHoraPE(p.fechaEntrega)}
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70">
                          {p.codigo}
                        </td>
                        <td className="h-12 px-4 py-3 text-gray70">
                          {p.cliente}
                        </td>

                        <td className="h-12 px-4 py-3 text-gray70">
                          {metodoPagoLabel(p.metodoPago)}
                        </td>

                        <td className="h-12 px-4 py-3 text-gray70">
                          {p.distrito}
                        </td>
                        <td className="h-12 px-4 py-3 text-right text-gray70">
                          {formatPEN(montoVisualPedido(p))}
                        </td>

                        <td className="h-12 px-4 py-3 text-right text-gray70">
                          {p.servicioCourier != null
                            ? formatPEN(p.servicioCourier)
                            : "-"}
                        </td>
                      </tr>
                    ))}

                    {detail.pedidos.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray70 italic"
                        >
                          Sin pedidos para este día.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CuadreSaldoTable;
