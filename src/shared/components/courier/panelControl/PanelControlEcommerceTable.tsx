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
  _raw: EcommerceCourier;
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

  const estado: EstadoTexto =
    typeof u.contrasena === "string" && u.contrasena.length === 0
      ? "pendiente"
      : "activo";

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

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxButtons - 1);
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (start > 1) {
        pages.unshift("...");
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [totalPages, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const emptyRowsCount = rowsPerPage - currentData.length;

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
                <td className="px-4 py-3">{entry.nombre_comercial}</td>
                <td className="px-4 py-3">{entry.ruc}</td>
                <td className="px-4 py-3">{entry.ciudad}</td>
                <td className="px-4 py-3 flex items-center gap-2">
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
                <td className="px-4 py-3">
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
                <td className="px-4 py-3">{entry.fecha_asociacion}</td>
                <td className="px-4 py-3">
                  <FaEye
                    onClick={() => handleVerDetalle(entry)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                    title="Ver detalle"
                  />
                </td>
              </tr>
            ))}

            {emptyRowsCount > 0 &&
              Array.from({ length: emptyRowsCount }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="hover:bg-transparent">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <td key={i} className="px-4 py-3">&nbsp;</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
        >
          &lt;
        </button>

        {pagerItems.map((p, i) =>
          typeof p === "string" ? (
            <span key={`dots-${i}`} className="px-2 text-gray70">
              {p}
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-current={page === p ? "page" : undefined}
              className={[
                "w-8 h-8 flex items-center justify-center rounded",
                page === p
                  ? "bg-gray90 text-white"
                  : "bg-gray10 text-gray70 hover:bg-gray20",
              ].join(" ")}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
