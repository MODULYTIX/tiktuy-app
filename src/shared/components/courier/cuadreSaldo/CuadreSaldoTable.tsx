// src/shared/components/courier/cuadreSaldo/CuadreSaldoTable.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  listPedidos,
  updateServicio,
  updateServicioCourier,
  abonarPedidos,
  getDetalleServiciosDia,
} from "@/services/courier/cuadre_saldo/cuadreSaldo.api";
import type {
  ListPedidosParams,
  PedidoListItem,
  DetalleServicioPedidoItem,
} from "@/services/courier/cuadre_saldo/cuadreSaldo.types";

import Tittlex from "@/shared/common/Tittlex";
import { InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import TableActionx from "@/shared/common/TableActionx";
import DetalleServiciosDiaModal from "@/shared/components/courier/cuadreSaldo/DetalleServiciosDiaModal";
import Buttonx from "@/shared/common/Buttonx";
import Badgex from "@/shared/common/Badgex";

/* ============== helpers ============== */
const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toDMY = (iso?: string | Date | null) => {
  if (!iso) return "-";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const todayDMY = () => toDMY(new Date());

/** extrae YYYY-MM-DD desde fechaEntrega */
const toYMDFromFechaEntrega = (iso?: string | Date | null) => {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (!Number.isFinite(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** normaliza método de pago para comparaciones */
const normMetodoPago = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

/** solo contar efectivo */
const isEfectivo = (metodoPago: unknown) => normMetodoPago(metodoPago) === "EFECTIVO";

/* ============== Modal Confirmar Abono ============== */
type ConfirmAbonoModalProps = {
  open: boolean;
  totalServicio: number;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  resumenLeft?: string;
  resumenRight?: string;
};

const ConfirmAbonoModal: React.FC<ConfirmAbonoModalProps> = ({
  open,
  totalServicio,
  count,
  onCancel,
  onConfirm,
  resumenLeft = "Pedidos seleccionados",
  resumenRight = todayDMY(),
}) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-[440px] max-w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <Tittlex
            title="Confirmar abono"
            description="Revisa el resumen antes de marcar como abonado"
            variant="modal"
            icon="mdi:cash-check"
            className="flex-1"
          />
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 pt-4 pb-3">
          <div className="rounded-xl border border-gray30 bg-gray10/60 px-4 py-3">
            <div className="mb-2 text-center text-sm font-semibold text-gray-700">
              Resumen
            </div>
            <div className="flex items-start justify-between gap-3 text-sm">
              <div className="text-gray-700">
                <div className="text-[13px] font-medium">{resumenLeft}</div>
                <div className="text-xs text-gray-500">{resumenRight}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-gray-900">
                  {formatPEN(totalServicio)}
                </div>
                <div className="mt-0.5 text-[12px] text-gray-500">
                  {count} {count === 1 ? "pedido" : "pedidos"}
                </div>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>Confirmo que verifiqué los pedidos y realicé la transferencia</span>
          </label>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 bg-gray-50 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!checked}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium",
              checked
                ? "bg-emerald-600 text-white hover:opacity-90"
                : "cursor-not-allowed bg-gray-200 text-gray-500",
            ].join(" ")}
          >
            ✓ Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============== modal editar (repartidor + courier) ============== */
type EditModalChange = {
  id: number;
  servicioRepartidor?: number | null;
  motivo?: string | null;
  servicioCourier?: number | null;
};

type EditModalProps = {
  token: string;
  open: boolean;
  onClose: () => void;
  pedido?: PedidoListItem;
  onSaved: (chg: EditModalChange) => void;
};

const EditServicioModal: React.FC<EditModalProps> = ({
  token,
  open,
  onClose,
  pedido,
  onSaved,
}) => {
  const [montoRep, setMontoRep] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [montoCour, setMontoCour] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const sugeridoRep = useMemo(() => pedido?.servicioSugerido ?? 0, [pedido?.servicioSugerido]);
  const baseCour = useMemo(() => (pedido as any)?.servicioCourierEfectivo ?? null, [pedido]);

  useEffect(() => {
    if (!open || !pedido) return;
    setErrMsg(null);
    setSaving(false);

    setMontoRep(String((pedido as any).servicioRepartidor ?? pedido.servicioSugerido ?? 0));
    setMotivo((pedido as any).motivo ?? "");
    setMontoCour(
      String((pedido as any).servicioCourier ?? (pedido as any).servicioCourierEfectivo ?? 0)
    );
  }, [open, pedido]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  if (!open || !pedido) return null;

  const repPrev = (pedido as any).servicioRepartidor ?? pedido.servicioSugerido ?? 0;
  const courPrev =
    (pedido as any).servicioCourier ?? (pedido as any).servicioCourierEfectivo ?? 0;
  const motivoPrev = (pedido as any).motivo ?? "";

  const repVal = Number(montoRep);
  const courVal = Number(montoCour);

  const repInvalid = Number.isNaN(repVal) || repVal < 0;
  const courInvalid = Number.isNaN(courVal) || courVal < 0;

  const changed =
    repVal !== Number(repPrev) ||
    courVal !== Number(courPrev) ||
    (motivo || "") !== (motivoPrev || "");

  const canSave = !saving && !repInvalid && !courInvalid && changed;

  const onGuardar = async () => {
    if (!canSave) return;

    setSaving(true);
    setErrMsg(null);

    try {
      const chg: EditModalChange = { id: pedido.id };

      if (repVal !== repPrev || (motivo || "") !== motivoPrev) {
        const resp = await updateServicio(token, pedido.id, {
          servicio: repVal,
          motivo: (motivo || "").trim() || undefined,
        });
        chg.servicioRepartidor = (resp as any).servicio;
        chg.motivo = (resp as any).motivo ?? null;
      }

      if (courVal !== courPrev) {
        const resp2 = await updateServicioCourier(token, pedido.id, {
          servicio: courVal,
        });
        chg.servicioCourier = (resp2 as any).servicioCourier;
      }

      onSaved(chg);
      onClose();
    } catch (e: any) {
      setErrMsg(e?.message || "No se pudo actualizar el servicio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-servicio-title"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="w-full max-w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray30 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <span className="text-lg leading-none">📝</span>
              </span>

              <div className="min-w-0">
                <h2
                  id="edit-servicio-title"
                  className="text-[18px] font-extrabold tracking-tight text-gray-900"
                >
                  Editar servicio • Pedido #{pedido.id}
                </h2>
                <p className="mt-0.5 text-[13px] text-gray-600">
                  Ajusta los montos del motorizado y del courier. Registra un motivo si hubo excepción.
                </p>
              </div>
            </div>

            {/* X normal */}
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => {
                if (!saving) onClose();
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Motorizado */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Servicio motorizado</div>
                <Badgex size="xs" shape="soft" className="bg-slate-100 text-slate-700" title="Sugerido">
                  Sug.: {formatPEN(sugeridoRep)}
                </Badgex>
              </div>

              <div className="mt-3">
                <InputxNumber
                  label="Monto"
                  decimals={2}
                  placeholder="0.00"
                  inputMode="decimal"
                  value={montoRep}
                  onChange={(e) => setMontoRep(e.target.value)}
                  disabled={saving}
                />
              </div>

              {repInvalid && (
                <p className="mt-2 text-[12px] text-red-600">Ingresa un monto válido (≥ 0).</p>
              )}

              <div className="mt-2 text-[12px] text-gray-500">
                Anterior:{" "}
                <span className="font-medium text-gray-700">{formatPEN(Number(repPrev))}</span>
              </div>
            </div>

            {/* Courier */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Servicio courier</div>

                {baseCour != null ? (
                  <Badgex
                    size="xs"
                    shape="soft"
                    className="bg-slate-100 text-slate-700"
                    title="Base courier"
                  >
                    Base: {formatPEN(Number(baseCour))}
                  </Badgex>
                ) : (
                  <Badgex
                    size="xs"
                    shape="soft"
                    className="bg-amber-50 text-amber-700 border border-amber-200"
                    title="Sin base"
                  >
                    Sin base
                  </Badgex>
                )}
              </div>

              <div className="mt-3">
                <InputxNumber
                  label="Monto"
                  decimals={2}
                  placeholder="0.00"
                  inputMode="decimal"
                  value={montoCour}
                  onChange={(e) => setMontoCour(e.target.value)}
                  disabled={saving}
                />
              </div>

              {courInvalid && (
                <p className="mt-2 text-[12px] text-red-600">Ingresa un monto válido (≥ 0).</p>
              )}

              <div className="mt-2 text-[12px] text-gray-500">
                Anterior:{" "}
                <span className="font-medium text-gray-700">{formatPEN(Number(courPrev))}</span>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">Motivo (opcional)</div>
              <Badgex size="xs" shape="soft" className="bg-gray-100 text-gray-700">
                Auditoría
              </Badgex>
            </div>

            <InputxTextarea
              label=""
              placeholder="Describe brevemente el motivo del ajuste"
              rows={3}
              minRows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={saving}
            />
          </div>

          {errMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errMsg}
            </div>
          )}
        </div>

        {/* Footer (✅ botones con Buttonx) */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray30 bg-gray-50 px-6 py-4">
          <Buttonx
            type="button"
            onClick={onClose}
            variant="outlined"
            label="Cancelar"
            disabled={saving}
          />

          <Buttonx
            type="button"
            onClick={onGuardar}
            variant="secondary"
            disabled={!canSave}
            icon={saving ? "mdi:reload" : "mdi:content-save-outline"}
            label={saving ? "Guardando…" : "Guardar"}
          />
        </div>
      </div>
    </div>
  );
};

/* ============== tabla principal ============== */
type Props = {
  token: string;
  motorizadoId?: number;
  sedeId?: number;
  desde?: string;
  hasta?: string;
  pageSize?: number;

  onSelectionChange?: (info: {
    selectedCount: number;
    totalServicio: number;
    loading: boolean;
    canAbonar: boolean;
  }) => void;

  exposeActions?: (actions: { openAbonarSeleccionados: () => void }) => void;

  sedeNombre?: string;
  motorizadoNombre?: string;
};

const CuadreSaldoTable: React.FC<Props> = ({
  token,
  motorizadoId,
  sedeId,
  desde,
  hasta,
  pageSize = 10,
  onSelectionChange,
  exposeActions,
  sedeNombre,
  motorizadoNombre,
}) => {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<PedidoListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editing, setEditing] = useState<PedidoListItem | undefined>(undefined);
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  // MODAL OJITO (detalle)
  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleFecha, setDetalleFecha] = useState<string>("");
  const [detallePedidoId, setDetallePedidoId] = useState<number | null>(null);
  const [detalleItems, setDetalleItems] = useState<DetalleServicioPedidoItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListPedidosParams = {
        motorizadoId,
        sedeId,
        desde,
        hasta,
        page,
        pageSize,
      };

      const resp = await listPedidos(token, params);

      setRows(resp.items);
      setTotal(resp.total ?? resp.items.length);
    } catch (e) {
      console.error(e);
      setError("Error al obtener pedidos finalizados");
    } finally {
      setLoading(false);
    }
  }, [token, motorizadoId, sedeId, desde, hasta, page, pageSize]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [motorizadoId, sedeId, desde, hasta, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSavedServicio = useCallback((chg: EditModalChange) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== chg.id) return r;
        const next: any = { ...r };

        if (chg.servicioRepartidor !== undefined) {
          next.servicioRepartidor = chg.servicioRepartidor;
          next.servicioEfectivo = chg.servicioRepartidor ?? r.servicioSugerido ?? 0;
        }
        if (chg.motivo !== undefined) {
          next.motivo = chg.motivo ?? null;
        }
        if (chg.servicioCourier !== undefined) {
          next.servicioCourier = chg.servicioCourier;
          if ("servicioCourierEfectivo" in next) {
            next.servicioCourierEfectivo =
              chg.servicioCourier ?? next.servicioCourierEfectivo ?? 0;
          }
        }
        return next;
      })
    );
  }, []);

  const selectableIds = useMemo(
    () => rows.filter((r: any) => !r.abonado).map((r) => r.id),
    [rows]
  );
  const isAllSelected =
    selectedIds.length > 0 && selectedIds.length === selectableIds.length;

  const toggleAll = useCallback(() => {
    setSelectedIds(isAllSelected ? [] : selectableIds);
  }, [isAllSelected, selectableIds]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.id)),
    [rows, selectedIds]
  );

  // Total servicio motorizado
  const totalServicioMotorizado = useMemo(
    () =>
      selectedRows.reduce(
        (acc: number, r: any) => acc + Number(r.servicioEfectivo ?? 0),
        0
      ),
    [selectedRows]
  );

  // Total cobrado: SOLO EFECTIVO
  const totalCobrado = useMemo(
    () =>
      selectedRows.reduce((acc: number, r: any) => {
        if (!isEfectivo(r.metodoPago)) return acc;
        return acc + Number(r.monto ?? 0);
      }, 0),
    [selectedRows]
  );

  // Total courier: (total cobrado efectivo) - (servicio motorizado)
  const totalCourier = useMemo(() => {
    return totalCobrado - totalServicioMotorizado;
  }, [totalCobrado, totalServicioMotorizado]);

  const toggleAbono = useCallback(
    async (row: any) => {
      try {
        const next = !row.abonado;
        await abonarPedidos(token, { pedidoIds: [row.id], abonado: next, sedeId });
        setRows((prev) =>
          prev.map((r: any) => (r.id === row.id ? { ...r, abonado: next } : r))
        );
        if (next) setSelectedIds((prev) => prev.filter((id) => id !== row.id));
      } catch (e) {
        console.error(e);
        alert("No se pudo actualizar el abono.");
      }
    },
    [token, sedeId]
  );

  const abrirModalAbono = useCallback(() => {
    if (selectedIds.length === 0) return;
    setOpenConfirm(true);
  }, [selectedIds.length]);

  const confirmarAbono = useCallback(async () => {
    try {
      setLoading(true);
      await abonarPedidos(token, {
        pedidoIds: selectedIds,
        abonado: true,
        sedeId,
      });
      setRows((prev) =>
        prev.map((r: any) =>
          selectedIds.includes(r.id) ? { ...r, abonado: true } : r
        )
      );
      setSelectedIds([]);
      setOpenConfirm(false);
    } catch (e) {
      console.error(e);
      alert("No se pudo procesar el abono.");
    } finally {
      setLoading(false);
    }
  }, [token, selectedIds, sedeId]);

  useEffect(() => {
    if (!exposeActions) return;
    exposeActions({
      openAbonarSeleccionados: abrirModalAbono,
    });
  }, [exposeActions, abrirModalAbono]);

  // Mantengo el contrato: totalServicio = total servicio motorizado
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange({
      selectedCount: selectedIds.length,
      totalServicio: totalServicioMotorizado,
      loading,
      canAbonar: selectedIds.length > 0 && !loading,
    });
  }, [onSelectionChange, selectedIds.length, totalServicioMotorizado, loading]);

  // OJITO: abre detalle SOLO del pedido clickeado
  const onViewDetallePedido = useCallback(
    async (row: PedidoListItem) => {
      const fechaYMD = toYMDFromFechaEntrega(row.fechaEntrega);
      if (!fechaYMD) {
        alert("El pedido no tiene fecha de entrega válida.");
        return;
      }

      setDetallePedidoId(row.id);
      setDetalleFecha(fechaYMD);
      setOpenDetalle(true);
      setDetalleLoading(true);
      setDetalleItems([]);

      try {
        const resp = await getDetalleServiciosDia(token, {
          fecha: fechaYMD,
          sedeId,
          motorizadoId,
        });

        setDetalleItems((resp as any).items ?? []);
      } catch (e) {
        console.error(e);
        alert("No se pudo obtener el detalle del día.");
        setOpenDetalle(false);
      } finally {
        setDetalleLoading(false);
      }
    },
    [token, sedeId, motorizadoId]
  );

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="relative mt-0 overflow-hidden rounded-md border border-gray30 bg-white shadow-default">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
            Cargando...
          </div>
        )}

        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed rounded-t-md border-b border-gray30 bg-white text-[12px]">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="font-roboto font-medium text-gray70">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleAll}
                      aria-label="Seleccionar todo"
                      className="h-4 w-4 accent-blue-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Fec. Entrega</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Distrito</th>
                  <th className="px-4 py-3 text-left">Método de pago</th>
                  <th className="px-4 py-3 text-left">Monto</th>
                  <th className="px-4 py-3 text-left">Servicio motorizado</th>
                  <th className="px-4 py-3 text-left">Servicio courier</th>
                  <th className="px-4 py-3 text-center">Abono</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {rows.length === 0 ? (
                  <tr className="hover:bg-transparent">
                    <td colSpan={10} className="px-4 py-8 text-center italic text-gray70">
                      Sin resultados para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  rows.map((r: any) => {
                    const checked = selectedIds.includes(r.id);
                    const disableCheck = r.abonado;

                    return (
                      <tr key={r.id} className="transition-colors hover:bg-gray10">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            disabled={disableCheck}
                            checked={checked}
                            onChange={() => toggleOne(r.id)}
                            aria-label={`Seleccionar pedido ${r.id}`}
                            className="h-4 w-4 accent-blue-600"
                          />
                        </td>

                        <td className="px-4 py-3 text-gray70">{toDMY(r.fechaEntrega)}</td>
                        <td className="px-4 py-3 text-gray70">{r.cliente}</td>
                        <td className="px-4 py-3 text-gray70">{r.distrito ?? "-"}</td>
                        <td className="px-4 py-3 text-gray70">{r.metodoPago ?? "-"}</td>
                        <td className="px-4 py-3 text-gray70">{formatPEN(r.monto)}</td>

                        {/* Servicio motorizado */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray80">
                              {formatPEN(Number(r.servicioEfectivo ?? 0))}
                            </span>
                            {r.servicioRepartidor != null && (
                              <span className="rounded-full bg-gray20 px-2 py-0.5 text-[11px] text-gray80">
                                editado
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Servicio courier */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray80">
                              {formatPEN(
                                Number(r.servicioCourierEfectivo ?? r.servicioCourier ?? 0)
                              )}
                            </span>
                            {r.servicioCourier != null && (
                              <span className="rounded-full bg-gray20 px-2 py-0.5 text-[11px] text-gray80">
                                editado
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleAbono(r)}
                            className={[
                              "rounded-full px-3 py-1 text-[11px] font-semibold",
                              r.abonado
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-200 text-gray-900",
                            ].join(" ")}
                            title={r.abonado ? "Quitar abono" : "Marcar abonado"}
                          >
                            {r.abonado ? "Abonado" : "Sin abonar"}
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <TableActionx
                              variant="view"
                              title="Ver detalle del servicio (solo este pedido)"
                              onClick={() => onViewDetallePedido(r)}
                              size="sm"
                            />

                            {!r.abonado && (
                              <TableActionx
                                variant="edit"
                                title="Editar servicio (repartidor / courier)"
                                onClick={() => {
                                  setEditing(r);
                                  setOpenEdit(true);
                                }}
                                size="sm"
                              />
                            )}

                            {!r.abonado && (
                              <TableActionx
                                variant="custom"
                                title="Abonar este pedido"
                                icon="mdi:cash-plus"
                                colorClassName="bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-200 hover:ring-emerald-400 focus-visible:ring-emerald-500"
                                onClick={() => {
                                  setSelectedIds([r.id]);
                                  setOpenConfirm(true);
                                }}
                                size="sm"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* PAGINADOR */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 rounded-b-md border-t border-gray30 bg-white px-3 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded bg-gray10 text-gray70 hover:bg-gray20 disabled:opacity-40"
          >
            &lt;
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded",
                  p === page ? "bg-gray90 text-white" : "bg-gray10 text-gray70 hover:bg-gray20",
                ].join(" ")}
              >
                {p}
              </button>
            ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded bg-gray10 text-gray70 hover:bg-gray20 disabled:opacity-40"
          >
            &gt;
          </button>
        </div>
      )}

      {/* resumen abajo */}
      <div className="flex items-center justify-between">
        {error ? (
          <span className="text-[12px] text-red-600">{error}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
            <span>
              Seleccionados: <b>{selectedIds.length}</b>
            </span>

            <span>
              · Servicio motorizado: <b>{formatPEN(totalServicioMotorizado)}</b>
            </span>

            <span>
              · Total cobrado: <b>{formatPEN(totalCobrado)}</b>
            </span>

            <span>
              · Total courier: <b>{formatPEN(totalCourier)}</b>
            </span>
          </div>
        )}
      </div>

      <EditServicioModal
        token={token}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        pedido={editing}
        onSaved={onSavedServicio}
      />

      <ConfirmAbonoModal
        open={openConfirm}
        totalServicio={totalServicioMotorizado}
        count={selectedIds.length}
        resumenLeft="Pedidos seleccionados"
        resumenRight={todayDMY()}
        onCancel={() => setOpenConfirm(false)}
        onConfirm={confirmarAbono}
      />

      {/* Modal de detalle (OJITO) */}
      <DetalleServiciosDiaModal
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        fecha={detalleFecha}
        sedeNombre={sedeNombre}
        motorizadoNombre={motorizadoNombre}
        items={detalleItems as any}
        loading={detalleLoading}
        pedidoId={detallePedidoId}
      />
    </div>
  );
};

export default CuadreSaldoTable;
