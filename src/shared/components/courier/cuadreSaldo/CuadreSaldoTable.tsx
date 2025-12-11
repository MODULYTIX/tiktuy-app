// src/shared/components/courier/cuadreSaldo/CuadreSaldoTable.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  listPedidos,
  updateServicio,
  updateServicioCourier,
  abonarPedidos,
} from "@/services/courier/cuadre_saldo/cuadreSaldo.api";
import type {
  ListPedidosParams,
  PedidoListItem,
} from "@/services/courier/cuadre_saldo/cuadreSaldo.types";

import Tittlex from "@/shared/common/Tittlex";
import { InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";

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

/* ============== Modal Confirmar Abono ============== */
type ConfirmAbonoModalProps = {
  open: boolean;
  totalServicio: number;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  resumenLeft?: string; // etiqueta opcional (ej. "Motorizado: 12")
  resumenRight?: string; // texto opcional derecho (ej. ciudad/fecha)
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
          {/* Resumen */}
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

          {/* Checkbox */}
          <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>
              Confirmo que verifiqué los pedidos y realicé la transferencia
            </span>
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

  const sugeridoRep = useMemo(
    () => pedido?.servicioSugerido ?? 0,
    [pedido?.servicioSugerido]
  );
  const baseCour = useMemo(
    () => pedido?.servicioCourierEfectivo ?? null,
    [pedido?.servicioCourierEfectivo]
  );

  useEffect(() => {
    if (open && pedido) {
      setMontoRep(
        String(pedido.servicioRepartidor ?? pedido.servicioSugerido ?? 0)
      );
      setMotivo(pedido.motivo ?? "");
      setMontoCour(
        String(pedido.servicioCourier ?? pedido.servicioCourierEfectivo ?? 0)
      );
    }
  }, [open, pedido]);

  if (!open || !pedido) return null;

  const onGuardar = async () => {
    const valRep = Number(montoRep);
    const valCour = Number(montoCour);
    if (Number.isNaN(valRep) || valRep < 0)
      return alert("Servicio del motorizado inválido.");
    if (Number.isNaN(valCour) || valCour < 0)
      return alert("Servicio courier inválido.");

    try {
      const chg: EditModalChange = { id: pedido.id };

      const repPrev = pedido.servicioRepartidor ?? pedido.servicioSugerido ?? 0;
      const courPrev =
        pedido.servicioCourier ?? pedido.servicioCourierEfectivo ?? 0;
      const motivoPrev = pedido.motivo ?? "";

      if (valRep !== repPrev || (motivo || "") !== motivoPrev) {
        const resp = await updateServicio(token, pedido.id, {
          servicio: valRep,
          motivo: motivo || undefined,
        });
        chg.servicioRepartidor = resp.servicio;
        chg.motivo = resp.motivo ?? null;
      }

      if (valCour !== courPrev) {
        const resp2 = await updateServicioCourier(token, pedido.id, {
          servicio: valCour,
        });
        chg.servicioCourier = resp2.servicioCourier;
      }

      onSaved(chg);
      onClose();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el servicio.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <Tittlex
            title={`Editar servicio • Pedido #${pedido.id}`}
            description="Ajusta los montos del motorizado y del courier"
            variant="modal"
            icon="mdi:clipboard-edit-outline"
            className="flex-1"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Montos */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Servicio Motorizado */}
            <div className="space-y-1.5">
              <InputxNumber
                label="Servicio motorizado (repartidor)"
                decimals={2}
                placeholder="0.00"
                inputMode="decimal"
                value={montoRep}
                onChange={(e) => setMontoRep(e.target.value)}
              />
              <p className="text-[11px] text-gray-500">
                Sugerido: {formatPEN(sugeridoRep)}
              </p>
            </div>

            {/* Servicio Courier */}
            <div className="space-y-1.5">
              <InputxNumber
                label="Servicio courier"
                decimals={2}
                placeholder="0.00"
                inputMode="decimal"
                value={montoCour}
                onChange={(e) => setMontoCour(e.target.value)}
              />
              {baseCour != null && (
                <p className="text-[11px] text-gray-500">
                  Base: {formatPEN(Number(baseCour))}
                </p>
              )}
            </div>
          </div>

          {/* Motivo */}
          <InputxTextarea
            label="Motivo (opcional)"
            placeholder="Describe brevemente el motivo del ajuste"
            rows={3}
            minRows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 bg-gray-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============== tabla principal ============== */
type Props = {
  token: string;
  motorizadoId?: number;
  desde?: string;
  hasta?: string;
  pageSize?: number;
};

const CuadreSaldoTable: React.FC<Props> = ({
  token,
  motorizadoId,
  desde,
  hasta,
  pageSize = 10,
}) => {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PedidoListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selección múltiple
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // edición
  const [editing, setEditing] = useState<PedidoListItem | undefined>(undefined);
  const [openEdit, setOpenEdit] = useState(false);

  // confirm modal
  const [openConfirm, setOpenConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListPedidosParams = {
        motorizadoId,
        desde,
        hasta,
        page,
        pageSize,
      };
      const resp = await listPedidos(token, params);
      setRows(resp.items);
      setSelectedIds([]); // al recargar, limpiar selección
    } catch (e) {
      console.error(e);
      setError("Error al obtener pedidos finalizados");
    } finally {
      setLoading(false);
    }
  }, [token, motorizadoId, desde, hasta, page, pageSize]);

  // reiniciar página cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [motorizadoId, desde, hasta, pageSize]);

  // cargar datos
  useEffect(() => {
    void load();
  }, [load]);

  const onSavedServicio = useCallback((chg: EditModalChange) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== chg.id) return r;
        const next: PedidoListItem = { ...r };

        if (chg.servicioRepartidor !== undefined) {
          next.servicioRepartidor = chg.servicioRepartidor;
          next.servicioEfectivo =
            chg.servicioRepartidor ?? r.servicioSugerido ?? 0;
        }
        if (chg.motivo !== undefined) {
          next.motivo = chg.motivo ?? null;
        }
        if (chg.servicioCourier !== undefined) {
          next.servicioCourier = chg.servicioCourier;
          if ("servicioCourierEfectivo" in next) {
            (next as any).servicioCourierEfectivo =
              chg.servicioCourier ?? (next as any).servicioCourierEfectivo ?? 0;
          }
        }
        return next;
      })
    );
  }, []);

  // ==== selección: sólo filas NO abonadas ====
  const selectableIds = useMemo(
    () => rows.filter((r) => !r.abonado).map((r) => r.id),
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

  const totalServicioSeleccionado = useMemo(
    () =>
      rows
        .filter((r) => selectedIds.includes(r.id))
        .reduce((acc, r) => acc + Number(r.servicioEfectivo ?? 0), 0),
    [rows, selectedIds]
  );

  // ==== abono (por fila)
  const toggleAbono = useCallback(
    async (row: PedidoListItem) => {
      try {
        const next = !row.abonado;
        await abonarPedidos(token, { pedidoIds: [row.id], abonado: next });
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, abonado: next } : r))
        );
        if (next) setSelectedIds((prev) => prev.filter((id) => id !== row.id));
      } catch (e) {
        console.error(e);
        alert("No se pudo actualizar el abono.");
      }
    },
    [token]
  );

  // ==== abono múltiple -> abre modal
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
      });
      // reflejar en UI
      setRows((prev) =>
        prev.map((r) =>
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
  }, [token, selectedIds]);

  return (
    <div className="mt-5 flex flex-col gap-4">
      {/* Toolbar superior sin fondo de tarjeta */}
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <span className="text-[12px] text-red-600">{error}</span>
        ) : (
          <span className="text-[12px] text-gray-600">
            Seleccionados: <b>{selectedIds.length}</b> · Servicio:{" "}
            <b>{formatPEN(totalServicioSeleccionado)}</b>
          </span>
        )}

        <button
          onClick={abrirModalAbono}
          disabled={selectedIds.length === 0 || loading}
          className={[
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-medium",
            selectedIds.length === 0 || loading
              ? "cursor-not-allowed bg-blue-200 text-white"
              : "bg-blue-600 text-white hover:opacity-90",
          ].join(" ")}
          title={
            selectedIds.length === 0
              ? "Selecciona al menos un pedido"
              : "Abonar seleccionados"
          }
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 8v8M8 12h8" />
          </svg>
          Abonar seleccionados
        </button>
      </div>

      {/* Tabla con el mismo formato del Ecommerce */}
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
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
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
                  <th className="px-4 py-3 text-left">Método de pago</th>
                  <th className="px-4 py-3 text-left">Monto</th>
                  <th className="px-4 py-3 text-left">Servicio motorizado</th>
                  <th className="px-4 py-3 text-left">Abono</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {rows.length === 0 && !loading && (
                  <tr className="hover:bg-transparent">
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center italic text-gray70"
                    >
                      No hay datos para el filtro seleccionado.
                    </td>
                  </tr>
                )}

                {rows.map((r) => {
                  const checked = selectedIds.includes(r.id);
                  const disableCheck = r.abonado;
                  return (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-gray10"
                    >
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

                      <td className="px-4 py-3 text-gray70">
                        {toDMY(r.fechaEntrega)}
                      </td>
                      <td className="px-4 py-3 text-gray70">{r.cliente}</td>
                      <td className="px-4 py-3 text-gray70">
                        {r.metodoPago ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-gray70">
                        {formatPEN(r.monto)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray80">
                            {formatPEN(r.servicioEfectivo)}
                          </span>
                          {r.servicioRepartidor != null && (
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
                          {/* Editar sólo si NO está abonado */}
                          {!r.abonado && (
                            <button
                              onClick={() => {
                                setEditing(r);
                                setOpenEdit(true);
                              }}
                              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] hover:bg-gray10"
                              title="Editar servicio (repartidor / courier)"
                            >
                              Editar
                            </button>
                          )}
                          {/* Abonar sólo este (con modal) */}
                          {!r.abonado && (
                            <button
                              onClick={() => {
                                setSelectedIds([r.id]);
                                setOpenConfirm(true);
                              }}
                              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] hover:bg-gray10"
                              title="Abonar este pedido"
                            >
                              Abonar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* modal editar */}
      <EditServicioModal
        token={token}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        pedido={editing}
        onSaved={onSavedServicio}
      />

      {/* modal confirmar abono */}
      <ConfirmAbonoModal
        open={openConfirm}
        totalServicio={totalServicioSeleccionado}
        count={selectedIds.length}
        resumenLeft="Pedidos seleccionados"
        resumenRight={todayDMY()}
        onCancel={() => setOpenConfirm(false)}
        onConfirm={confirmarAbono}
      />
    </div>
  );
};

export default CuadreSaldoTable;
