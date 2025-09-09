// src/shared/components/courier/cuadreSaldo/CuadreSaldoTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listPedidos,
  updateServicio,
  abonarPedidos,
} from "@/services/courier/cuadre_saldo/cuadreSaldo.api";
import type {
  ListPedidosParams,
  PedidoListItem,
} from "@/services/courier/cuadre_saldo/cuadreSaldo.types";

/* ============== helpers ============== */
const formatPEN = (v: number) =>
  `S/. ${v.toLocaleString("es-PE", {
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

/* ============== modal editar ============== */
type EditModalProps = {
  token: string;
  open: boolean;
  onClose: () => void;
  pedido?: PedidoListItem;
  onSaved: (p: {
    id: number;
    servicio: number | null;
    motivo?: string | null;
  }) => void;
};

const EditServicioModal: React.FC<EditModalProps> = ({
  token,
  open,
  onClose,
  pedido,
  onSaved,
}) => {
  const [monto, setMonto] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");

  const sugerido = useMemo(
    () => pedido?.servicioSugerido ?? 0,
    [pedido?.servicioSugerido]
  );

  useEffect(() => {
    if (open && pedido) {
      setMonto(
        String(pedido.servicioRepartidor ?? pedido.servicioSugerido ?? 0)
      );
      setMotivo(pedido.motivo ?? "");
    }
  }, [open, pedido]);

  if (!open || !pedido) return null;

  const onGuardar = async () => {
    const valor = Number(monto);
    if (Number.isNaN(valor) || valor < 0) return;

    try {
      const resp = await updateServicio(token, pedido.id, {
        servicio: valor,
        motivo: motivo || undefined,
      });
      onSaved({
        id: pedido.id,
        servicio: resp.servicio,
        motivo: resp.motivo ?? null,
      });
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
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <label className="block text-sm font-medium text-gray-700">
            Servicio a pagar
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </label>
          <div className="text-xs text-gray-500">
            Sugerido: {formatPEN(sugerido)}
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Motivo (opcional)
            <textarea
              className="mt-1 h-28 w-full resize-none rounded-xl border px-3 py-2 outline-none"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
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

/* ============== tabla ============== */
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

  const [editing, setEditing] = useState<PedidoListItem | undefined>(undefined);
  const [openEdit, setOpenEdit] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = async () => {
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
      setTotal(resp.total);
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

  const onSavedServicio = (chg: {
    id: number;
    servicio: number | null;
    motivo?: string | null;
  }) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === chg.id
          ? {
              ...r,
              servicioRepartidor: chg.servicio,
              servicioEfectivo: chg.servicio ?? r.servicioSugerido ?? 0,
              motivo: chg.motivo ?? null,
            }
          : r
      )
    );
  };

  const toggleAbono = async (row: PedidoListItem) => {
    try {
      const next = !row.abonado;
      await abonarPedidos(token, { pedidoIds: [row.id], abonado: next });
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, abonado: next } : r))
      );
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el abono.");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <div className="border-b px-4 py-3 text-sm text-gray-600">
        {error ? <span className="text-red-600">{error}</span> : "\u00A0"}
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
                <td colSpan={7} className="p-4 text-gray-500">
                  No hay datos para el filtro seleccionado.
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
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
                    <button
                      onClick={() => {
                        setEditing(r);
                        setOpenEdit(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                      title="Editar servicio"
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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

      {/* modal */}
      <EditServicioModal
        token={token}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        pedido={editing}
        onSaved={onSavedServicio}
      />
    </div>
  );
};

export default CuadreSaldoTable;
