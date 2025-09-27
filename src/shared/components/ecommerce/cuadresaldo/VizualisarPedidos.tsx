import type { PedidoDiaItem } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

type Props = {
  open: boolean;
  onClose(): void;
  fecha?: string; // YYYY-MM-DD
  rows: PedidoDiaItem[];
  loading?: boolean;
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);

export default function VizualisarPedidos({ open, onClose, fecha, rows, loading }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            Pedidos del día {fecha && new Date(fecha + "T00:00:00").toLocaleDateString("es-PE")}
          </h3>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100">✕</button>
        </div>

        <div className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Método de pago</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Servicio (total)</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">Cargando...</td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">Sin pedidos</td>
                </tr>
              )}

              {rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.cliente}</td>
                  <td className="p-3">{p.metodo_pago ?? "-"}</td>
                  <td className="p-3">{money(p.monto)}</td>
                  <td className="p-3">{money(p.servicioTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="rounded-md border px-4 py-2 hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
