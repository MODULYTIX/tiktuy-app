import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import {
  listarEcommercesAsociados,
  getAuthToken,
} from "@/services/courier/panel_control/panel_control.api";
import type { EcommerceCourier } from "@/services/courier/panel_control/panel_control.types";

type EstadoTexto = "activo" | "pendiente";

interface EcommerceRow {
  id: number;
  nombre_comercial: string;
  ruc: string;
  ciudad: string;
  telefono: string;
  estado: EstadoTexto;
  fecha_asociacion: string;
  _raw: EcommerceCourier; // por si quieres ver detalle
}

const rowsPerPage = 5;

function formatDateLikeDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toRow(item: EcommerceCourier): EcommerceRow {
  const e = item.ecommerce;
  const u = e.usuario;

  // Estado: si el usuario tiene contraseña vacía => pendiente; caso contrario activo
  const estado: EstadoTexto =
    typeof u.contrasena === "string" && u.contrasena.length === 0
      ? "pendiente"
      : "activo";

  // Preferimos createdAt/created_at del vínculo, luego del ecommerce y por último del usuario
  const fecha =
    item.createdAt ||
    item.created_at ||
    e.createdAt ||
    e.created_at ||
    u.createdAt ||
    u.created_at ||
    null;

  return {
    id: e.id ?? item.id,
    nombre_comercial: e.nombre_comercial ?? "-",
    ruc: e.ruc ?? "-",
    ciudad: e.ciudad ?? "-",
    telefono: u.telefono ?? "-",
    estado,
    fecha_asociacion: formatDateLikeDDMMYYYY(fecha),
    _raw: item,
  };
}

export default function PanelControlTable() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EcommerceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const token = getAuthToken();
      if (!token) {
        setErr("No se encontró el token de autenticación.");
        setLoading(false);
        return;
      }

      const res = await listarEcommercesAsociados(token);
      if (!mounted) return;

      if (res.ok) {
        const mapped = (res.data as EcommerceCourier[]).map(toRow);
        setRows(mapped);
      } else {
        setErr(res.error || "Error al listar ecommerces.");
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / rowsPerPage)),
    [rows.length]
  );

  const currentData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [page, rows]);

  const handleVerDetalle = (row: EcommerceRow) => {
    alert(JSON.stringify(row._raw, null, 2));
  };

  if (loading) {
    return (
      <div className="mt-4 p-4 text-sm text-gray-600 bg-white rounded shadow-sm">
        Cargando ecommerces asociados…
      </div>
    );
  }

  if (err) {
    return (
      <div className="mt-4 p-4 text-sm text-red-600 bg-white rounded shadow-sm">
        {err}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow-sm text-sm">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Nombre Comercial</th>
              <th className="px-4 py-3 text-left">RUC</th>
              <th className="px-4 py-3 text-left">Ciudad</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">F. Asociación</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {currentData.map((entry) => (
              <tr key={entry.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{entry.nombre_comercial}</td>
                <td className="px-4 py-2">{entry.ruc}</td>
                <td className="px-4 py-2">{entry.ciudad}</td>
                <td className="px-4 py-2 flex items-center gap-2">
                  {entry.telefono}
                  {entry.telefono && entry.telefono !== "-" && (
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(entry.telefono)
                      }
                      className="text-xs text-gray-400 hover:text-gray-600"
                      title="Copiar teléfono"
                    >
                      📋
                    </button>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      entry.estado === "activo"
                        ? "bg-green-600 text-white"
                        : "bg-yellow-500 text-black"
                    }`}
                  >
                    {entry.estado}
                  </span>
                </td>
                <td className="px-4 py-2">{entry.fecha_asociacion}</td>
                <td className="px-4 py-2">
                  <FaEye
                    onClick={() => handleVerDetalle(entry)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                    title="Ver detalle"
                  />
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No hay ecommerces asociados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex justify-end items-center gap-2 mt-4 text-sm">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              className={`w-8 h-8 flex items-center justify-center border rounded ${
                page === i + 1 ? "bg-orange-500 text-white" : "text-gray-700"
              }`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
