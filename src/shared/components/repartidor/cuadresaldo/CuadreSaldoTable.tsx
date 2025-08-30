import React from "react";

type Estado = "Validado" | "Por Validar";

type Fila = {
  id: string;
  fechaEntrega: string; // dd/MM/yyyy
  montoServicio: number;
  estado: Estado;
};

const DATA: Fila[] = [
  { id: "1", fechaEntrega: "28/07/2025", montoServicio: 200, estado: "Validado" },
  { id: "2", fechaEntrega: "28/07/2025", montoServicio: 1000, estado: "Por Validar" },
  { id: "3", fechaEntrega: "31/07/2025", montoServicio: 40, estado: "Por Validar" },
  { id: "4", fechaEntrega: "31/07/2025", montoServicio: 80, estado: "Por Validar" },
  { id: "5", fechaEntrega: "31/07/2025", montoServicio: 80, estado: "Por Validar" },
];

const formatPEN = (v: number) =>
  `S/. ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EstadoPill: React.FC<{ estado: Estado }> = ({ estado }) => {
  const isOk = estado === "Validado";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        isOk ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-900",
      ].join(" ")}
    >
      {estado}
    </span>
  );
};

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 5 12 5c4.64 0 8.577 2.51 9.964 6.678.07.214.07.43 0 .644C20.577 16.49 16.64 19 12 19c-4.64 0-8.577-2.51-9.964-6.678z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Checkbox = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
    {...props}
  />
);

const Paginacion = () => (
  <div className="flex items-center justify-end gap-2 p-4">
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">{"<"}</button>
    <button className="rounded-md border px-3 py-1 text-sm bg-gray-900 text-white">1</button>
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">2</button>
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">3</button>
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">4</button>
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">5</button>
    <span className="px-2">…</span>
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">15</button>
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">{">"}</button>
  </div>
);

const CuadreSaldoTable: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="w-12 p-4">
              <Checkbox />
            </th>
            <th className="p-4 font-semibold">Fec. Entrega</th>
            <th className="p-4 font-semibold">Monto por Servicio</th>
            <th className="p-4 font-semibold">Estado</th>
            <th className="p-4 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {DATA.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="p-4">
                <Checkbox />
              </td>
              <td className="p-4">{row.fechaEntrega}</td>
              <td className="p-4">{formatPEN(row.montoServicio)}</td>
              <td className="p-4">
                <EstadoPill estado={row.estado} />
              </td>
              <td className="p-4">
                <div className="flex justify-end">
                  <button
                    title="Ver detalle"
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 hover:bg-gray-50"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginacion />
    </div>
  );
};

export default CuadreSaldoTable;
