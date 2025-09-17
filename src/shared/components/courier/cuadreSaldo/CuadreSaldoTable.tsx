// src/shared/components/courier/cuadreSaldo/CuadreSaldoTable.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  resumenLeft?: string;   // etiqueta opcional (ej. "Motorizado: 12")
  resumenRight?: string;  // texto opcional derecho (ej. ciudad/fecha)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[420px] max-w-[92vw] rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 px-6 pt-6">
          {/* Shield icon */}
          <div className="rounded-full bg-emerald-50 p-3">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"
                fill="#22c55e"
                opacity="0.12"
              />
              <path
                d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"
                stroke="#22c55e"
                strokeWidth="1.5"
              />
              <path
                d="M8.5 12.5l2.2 2.2 4.8-4.8"
                stroke="#22c55e"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="text-center text-lg font-semibold">CONFIRMAR ABONO</h3>
          <p className="mb-2 -mt-1 text-center text-xs text-gray-500">
            Valida el abonado y registra el ingreso en el sistema
          </p>
        </div>

        {/* Resumen */}
        <div className="mx-5 rounded-xl border px-4 py-3">
          <div className="mb-2 text-center text-sm font-semibold text-gray-700">
            Resumen
          </div>
          <div className="flex items-start justify-between text-sm">
            <div className="text-gray-700">
              <div className="text-[13px]">{resumenLeft}</div>
              <div className="text-xs text-gray-500">{resumenRight}</div>
            </div>
            <div className="text-right">
              <div className="text-base font-semibold">
                {formatPEN(totalServicio)}
              </div>
              <div className="mt-0.5 text-[12px] text-gray-500">
                {count} {count === 1 ? "pedido" : "pedidos"}
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <label className="mx-5 mt-3 flex cursor-pointer items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Confirmo que verifiqué e hice la transferencia
        </label>

        {/* Acciones */}
        <div className="mt-4 flex items-center justify-end gap-2 rounded-b-2xl border-t px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
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
                : "bg-gray-200 text-gray-500 cursor-not-allowed",
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
      setMontoRep(String(pedido.servicioRepartidor ?? pedido.servicioSugerido ?? 0));
      setMotivo(pedido.motivo ?? "");
      setMontoCour(String(pedido.servicioCourier ?? pedido.servicioCourierEfectivo ?? 0));
    }
  }, [open, pedido]);

  if (!open || !pedido) return null;

  const onGuardar = async () => {
    const valRep = Number(montoRep);
    const valCour = Number(montoCour);
    if (Number.isNaN(valRep) || valRep < 0) return alert("Servicio del motorizado inválido.");
    if (Number.isNaN(valCour) || valCour < 0) return alert("Servicio courier inválido.");

    try {
      const chg: EditModalChange = { id: pedido.id };

      const repPrev = pedido.servicioRepartidor ?? pedido.servicioSugerido ?? 0;
      const courPrev = pedido.servicioCourier ?? pedido.servicioCourierEfectivo ?? 0;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">
            Editar servicio • Pedido #{pedido.id}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          {/* Servicio Motorizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Servicio motorizado (repartidor)
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
                value={montoRep}
                onChange={(e) => setMontoRep(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </label>
            <div className="mt-1 text-xs text-gray-500">
              Sugerido: {formatPEN(sugeridoRep)}
            </div>
          </div>

          {/* Servicio Courier */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Servicio courier
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
                value={montoCour}
                onChange={(e) => setMontoCour(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </label>
            {baseCour != null && (
              <div className="mt-1 text-xs text-gray-500">
                Base: {formatPEN(Number(baseCour))}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Motivo (opcional)
              <textarea
                className="mt-1 h-28 w-full resize-none rounded-xl border px-3 py-2 outline-none"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // selección múltiple
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // edición
  const [editing, setEditing] = useState<PedidoListItem | undefined>(undefined);
  const [openEdit, setOpenEdit] = useState(false);

  // confirm modal
  const [openConfirm, setOpenConfirm] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListPedidosParams = { motorizadoId, desde, hasta, page, pageSize };
      const resp = await listPedidos(token, params);
      setRows(resp.items);
      setTotal(resp.total);
      setSelectedIds([]); // al recargar, limpiar selección
    } catch (e) {
      console.error(e);
      setError("Error al obtener pedidos finalizados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [motorizadoId, desde, hasta, pageSize]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, motorizadoId, desde, hasta, pageSize]);

  const onSavedServicio = (chg: EditModalChange) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== chg.id) return r;
        const next: PedidoListItem = { ...r };

        if (chg.servicioRepartidor !== undefined) {
          next.servicioRepartidor = chg.servicioRepartidor;
          next.servicioEfectivo = (chg.servicioRepartidor ?? r.servicioSugerido ?? 0);
        }
        if (chg.motivo !== undefined) {
          next.motivo = chg.motivo ?? null;
        }
        if (chg.servicioCourier !== undefined) {
          next.servicioCourier = chg.servicioCourier;
          if ("servicioCourierEfectivo" in next) {
            (next as any).servicioCourierEfectivo =
              chg.servicioCourier ?? next.servicioCourierEfectivo ?? 0;
          }
        }
        return next;
      })
    );
  };

  // ==== selección: sólo filas NO abonadas ====
  const selectableIds = useMemo(
    () => rows.filter((r) => !r.abonado).map((r) => r.id),
    [rows]
  );
  const isAllSelected =
    selectedIds.length > 0 && selectedIds.length === selectableIds.length;

  const toggleAll = () => setSelectedIds(isAllSelected ? [] : selectableIds);

  const toggleOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const totalServicioSeleccionado = useMemo(
    () =>
      rows
        .filter((r) => selectedIds.includes(r.id))
        .reduce((acc, r) => acc + Number(r.servicioEfectivo ?? 0), 0),
    [rows, selectedIds]
  );

  // ==== abono (por fila)
  const toggleAbono = async (row: PedidoListItem) => {
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
  };

  // ==== abono múltiple -> abre modal
  const abrirModalAbono = () => {
    if (selectedIds.length === 0) return;
    setOpenConfirm(true);
  };

  const confirmarAbono = async () => {
    try {
      setLoading(true);
      const resp = await abonarPedidos(token, {
        pedidoIds: selectedIds,
        abonado: true,
      });
      // reflejar en UI
      setRows((prev) =>
        prev.map((r) => (selectedIds.includes(r.id) ? { ...r, abonado: true } : r))
      );
      setSelectedIds([]);
      setOpenConfirm(false);
    } catch (e) {
      console.error(e);
      alert("No se pudo procesar el abono.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      {/* Toolbar superior con botón de abono múltiple */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        {error ? (
          <span className="text-sm text-red-600">{error}</span>
        ) : (
          <span className="text-sm text-gray-600">
            Seleccionados: <b>{selectedIds.length}</b> · Servicio:{" "}
            <b>{formatPEN(totalServicioSeleccionado)}</b>
          </span>
        )}

        <button
          onClick={abrirModalAbono}
          disabled={selectedIds.length === 0 || loading}
          className={[
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
            selectedIds.length === 0 || loading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:opacity-90",
          ].join(" ")}
          title={
            selectedIds.length === 0
              ? "Selecciona al menos un pedido"
              : "Abonar seleccionados"
          }
        >
          Abonar seleccionados
        </button>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
            Cargando...
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todo"
                />
              </th>
              <th className="p-4 font-semibold">Fec. Entrega</th>
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Método de Pago</th>
              <th className="p-4 font-semibold">Monto</th>
              <th className="p-4 font-semibold">Servicio Motorizado</th>
              <th className="p-4 font-semibold">Abono</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>

        <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="p-4 text-gray-500">
                  No hay datos para el filtro seleccionado.
                </td>
              </tr>
            )}

            {rows.map((r) => {
              const checked = selectedIds.includes(r.id);
              const disableCheck = r.abonado;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      disabled={disableCheck}
                      checked={checked}
                      onChange={() => toggleOne(r.id)}
                      aria-label={`Seleccionar pedido ${r.id}`}
                    />
                  </td>

                  <td className="p-4">{toDMY(r.fechaEntrega)}</td>
                  <td className="p-4">{r.cliente}</td>
                  <td className="p-4">{r.metodoPago ?? "-"}</td>
                  <td className="p-4">{formatPEN(r.monto)}</td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatPEN(r.servicioEfectivo)}
                      </span>
                      {r.servicioRepartidor != null && (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                          editado
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => toggleAbono(r)}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        r.abonado
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-900",
                      ].join(" ")}
                      title={r.abonado ? "Quitar abono" : "Marcar abonado"}
                    >
                      {r.abonado ? "Abonado" : "Sin abonar"}
                    </button>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-end">
                      {/* Editar sólo si NO está abonado */}
                      {!r.abonado && (
                        <button
                          onClick={() => {
                            setEditing(r);
                            setOpenEdit(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
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
                          className="ml-2 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
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

      {/* paginación simple */}
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="text-xs text-gray-600">
          Página {page} de {totalPages} • {total} registro(s)
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {"<"}
          </button>
          <button
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            {">"}
          </button>
        </div>
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
        resumenLeft={`Pedidos seleccionados`}
        resumenRight={todayDMY()}
        onCancel={() => setOpenConfirm(false)}
        onConfirm={confirmarAbono}
      />
    </div>
  );
};

export default CuadreSaldoTable;
