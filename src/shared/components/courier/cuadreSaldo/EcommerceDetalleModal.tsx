import React from "react";
import type { PedidoDiaItem } from "@/services/courier/cuadre_saldo/cuadreSaldoE.types";

type Props = {
  open: boolean;
  fecha: string;
  ecommerceNombre: string;
  items: PedidoDiaItem[];
  loading: boolean;
  onClose: () => void;
  onAbonarDia: () => void;
  totalServicio: number;
};
/* ================= helpers ================= */
const formatPEN = (v: number) =>
  `S/. ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toDMY = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const EcommerceDetalleModal: React.FC<Props> = ({
  open,
  fecha,
  ecommerceNombre,
  items,
  loading,
  onClose,
  onAbonarDia,
  totalServicio,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-[960px] max-w-[96vw] rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm">
            <div className="font-semibold">Pedidos del día • {toDMY(fecha)}</div>
            <div className="text-gray-500">
              Ecommerce: <b>{ecommerceNombre}</b>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Pedidos del día: <b>{items.length}</b> · Servicio total del día:{" "}
              <b>{formatPEN(totalServicio)}</b>
            </div>
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:opacity-90"
              }`}
              disabled={loading}
              onClick={onAbonarDia}
              title="Abonar todo el día (Por Validar)"
            >
              Abonar día completo
            </button>
          </div>

          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm">
                Cargando...
              </div>
            )}

            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Método de pago</th>
                  <th className="px-4 py-2">Monto</th>
                  <th className="px-4 py-2">Servicio (total)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Sin pedidos
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{it.cliente}</td>
                      <td className="px-4 py-2">{it.metodoPago ?? "-"}</td>
                      <td className="px-4 py-2">{formatPEN(it.monto)}</td>
                      <td className="px-4 py-2">
                        {formatPEN(it.servicioCourier + it.servicioRepartidor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcommerceDetalleModal;
