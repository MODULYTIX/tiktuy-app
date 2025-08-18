// src/shared/components/courier/panelControl/PanelControlRepartidorTable.tsx
import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import {
  listarMotorizadosAsociados,
  getAuthToken,
} from "@/services/courier/panel_control/panel_control.api";
import type { Motorizado } from "@/services/courier/panel_control/panel_control.types";

type EstadoTexto = "activo" | "pendiente";

interface MotorizadoRow {
  id: number;
  nombres: string;
  apellidos: string;
  dni_ci: string;
  telefono: string;
  tipo_vehiculo: string;
  licencia: string;
  placa: string;
  estado: EstadoTexto;
  fecha_asociacion: string;
  _raw: Motorizado;
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

function pickDate(
  a?: string,
  b?: string,
  c?: string,
  d?: string
): string | null {
  return a ?? b ?? c ?? d ?? null;
}

function toRow(item: Motorizado): MotorizadoRow {
  const u = item.usuario ?? null;
  const tv = item.tipo_vehiculo ?? null;

  const estado: EstadoTexto =
    (u?.contrasena ?? "") === "" ? "pendiente" : "activo";

  const fecha = pickDate(
    item.createdAt,
    item.created_at,
    u?.createdAt,
    u?.created_at
  );

  return {
    id: item.id,
    nombres: u?.nombres ?? "-",
    apellidos: u?.apellidos ?? "-",
    dni_ci: u?.DNI_CI ?? "-",
    telefono: u?.telefono ?? "-",
    tipo_vehiculo: tv?.descripcion ?? "-",
    licencia: item.licencia ?? "-",
    placa: item.placa ?? "-",
    estado,
    fecha_asociacion: formatDateLikeDDMMYYYY(fecha),
    _raw: item,
  };
}

export default function PanelControlRepartidorTable() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<MotorizadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const token = getAuthToken();
    if (!token) {
      setErr("No se encontró el token de autenticación.");
      setLoading(false);
      return;
    }

    const res = await listarMotorizadosAsociados(token);
    if (res.ok) {
      setRows((res.data as Motorizado[]).map(toRow));
    } else {
      setErr(res.error || "Error al listar motorizados.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / rowsPerPage)),
    [rows.length]
  );

  const currentData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [page, rows]);

  const handleVerDetalle = (row: MotorizadoRow) => {
    alert(JSON.stringify(row._raw, null, 2));
  };

  if (loading) {
    return (
      <div className="mt-4 p-4 text-sm text-gray-600 bg-white rounded shadow-sm">
        Cargando motorizados asociados…
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
      {/* Barra superior: solo contador */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          Total: <span className="font-medium">{rows.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow-sm text-sm">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Nombres</th>
              <th className="px-4 py-3 text-left">Apellidos</th>
              <th className="px-4 py-3 text-left">DNI</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Tipo vehículo</th>
              <th className="px-4 py-3 text-left">Licencia</th>
              <th className="px-4 py-3 text-left">Placa</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">F. Asociación</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {currentData.map((entry) => (
              <tr key={entry.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{entry.nombres}</td>
                <td className="px-4 py-2">{entry.apellidos}</td>
                <td className="px-4 py-2">{entry.dni_ci}</td>
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
                <td className="px-4 py-2">{entry.tipo_vehiculo}</td>
                <td className="px-4 py-2">{entry.licencia}</td>
                <td className="px-4 py-2">{entry.placa}</td>
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
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  No hay motorizados asociados todavía.
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
