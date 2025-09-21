import type { ResumenDia } from "@/services/ecommerce/cuadreSaldo/cuadreSaldoC.types";

type Props = {
  rows: ResumenDia[];
  loading?: boolean;
  selected: string[];                                   // YYYY-MM-DD[]
  onToggle(date: string): void;                         // check/uncheck una fecha
  onView(date: string, estado: ResumenDia["estado"]): void; // click en ojito (con estado)
};

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);

export default function CuadreSaldoTable({
  rows,
  loading,
  selected,
  onToggle,
  onView,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="text-left">
            <th className="w-10 p-3"></th>
            <th className="p-3">Fec. Entrega</th>
            <th className="p-3">Monto</th>
            <th className="p-3">Servicio (total)</th>
            <th className="p-3">Neto</th>
            <th className="p-3">Estado</th>
            <th className="p-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-500">
                Cargando...
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-500">
                No hay datos.
              </td>
            </tr>
          )}

          {rows.map((r) => {
            const checked = selected.includes(r.fecha);
            const pill =
              r.estado === "Validado"
                ? "bg-gray-900 text-white"
                : r.estado === "Sin Validar"
                ? "bg-gray-100 text-gray-700 border border-gray-200"
                : "bg-blue-100 text-blue-900 border border-blue-200";

            return (
              <tr key={r.fecha} className="border-t">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(r.fecha)}
                    disabled={r.estado === "Validado"}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="p-3">
                  {new Date(r.fecha + "T00:00:00").toLocaleDateString("es-PE")}
                </td>
                <td className="p-3">{money(r.cobrado)}</td>
                <td className="p-3">{money(r.servicio)}</td>
                <td className="p-3">{money(r.neto)}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${pill}`}>{r.estado}</span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onView(r.fecha, r.estado)} // ← enviamos fecha + estado
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-gray-50"
                    title="Ver pedidos del día"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                    Ver
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
