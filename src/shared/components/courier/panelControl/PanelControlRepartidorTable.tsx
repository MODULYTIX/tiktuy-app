// src/shared/components/courier/panelControl/PanelControlRepartidorTable.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaEye } from "react-icons/fa";
import { Icon } from "@iconify/react";
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
  correo?: string;
  licencia?: string;
  tipo_vehiculo?: string;
  placa?: string;
  estado: EstadoTexto;
  fecha_asociacion: string;
  _raw: Motorizado;
}

const PAGE_SIZE = 5;

// ---------- Utils ----------
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

// ---------- Normalizador ----------
function toRow(item: Motorizado): MotorizadoRow {
  const u = item.usuario ?? null;
  const v = item.tipo_vehiculo ?? null;

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
    correo: (u as any)?.correo ?? (u as any)?.email ?? "",
    licencia: (item as any)?.licencia ?? "",
    tipo_vehiculo: v?.descripcion ?? "",
    placa: (item as any)?.placa ?? "",
    estado,
    fecha_asociacion: formatDateLikeDDMMYYYY(fecha),
    _raw: item,
  };
}

// ---------- Snackbar simple ----------
function useSnackbar(timeoutMs = 3000) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<number | null>(null);

  const show = (msg: string) => {
    setMessage(msg);
    setOpen(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), timeoutMs);
  };

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return { open, message, show } as const;
}

export default function PanelControlRepartidorTable() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<MotorizadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const snackbar = useSnackbar(3000);

  // Drawer state
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selected, setSelected] = useState<MotorizadoRow | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    const token = getAuthToken();
    if (!token) {
      setErr("No se encontró el token de autenticación.");
      setLoading(false);
      return;
    }

    const res = await listarMotorizadosAsociados(token);
    if ((res as any).ok) {
      setRows(((res as any).data as Motorizado[]).map(toRow));
    } else {
      setErr((res as any).error || "Error al listar motorizados.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
    [rows.length]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const currentData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);

  const pagerItems = useMemo(() => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

      for (let i = start; i <= end; i++) pages.push(i);
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

  // Copiar teléfono al portapapeles
  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      snackbar.show("Número copiado");
    } catch {
      snackbar.show("No se pudo copiar");
    }
  };

  // Abrir/cerrar drawer
  const openDetails = (row: MotorizadoRow) => {
    setSelected(row);
    setOpenDrawer(true);
  };
  const closeDetails = () => {
    setOpenDrawer(false);
    setTimeout(() => setSelected(null), 200);
  };

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetails();
    };
    if (openDrawer) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDrawer]);

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
      {/* Tabla wrapper con borde + sombra, estilo base */}
      <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[18%]" /> {/* Nombre */}
                <col className="w-[20%]" /> {/* Apellidos */}
                <col className="w-[14%]" /> {/* DNI */}
                <col className="w-[18%]" /> {/* Teléfono */}
                <col className="w-[14%]" /> {/* Estado */}
                <col className="w-[14%]" /> {/* F. Asociación */}
                <col className="w-[12%]" /> {/* Acciones */}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Apellidos</th>
                  <th className="px-4 py-3 text-left">DNI</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">F. Asociación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {currentData.length > 0 ? (
                  <>
                    {currentData.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray10 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray70">{entry.nombres}</td>
                        <td className="px-4 py-3 text-gray70">{entry.apellidos}</td>
                        <td className="px-4 py-3 text-gray70">{entry.dni_ci}</td>
                        <td className="px-4 py-3 text-gray70">
                          <div className="flex items-center gap-2">
                            <span>{entry.telefono}</span>
                            {entry.telefono && entry.telefono !== "-" && (
                              <button
                                onClick={() => copyPhone(entry.telefono)}
                                className="p-1 rounded hover:bg-gray10"
                                title="Copiar teléfono"
                                type="button"
                              >
                                <Icon
                                  icon="mdi:content-copy"
                                  width={16}
                                  height={16}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-4 py-[6px] rounded-md text-[12px] font-medium shadow-sm ${
                              entry.estado === "activo"
                                ? "bg-gray90 text-white"
                                : "bg-gray30 text-gray80"
                            }`}
                          >
                            {entry.estado === "activo" ? "Activo" : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray70">
                          {entry.fecha_asociacion}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <FaEye
                              onClick={() => openDetails(entry)}
                              className="text-blue-700 hover:text-blue-800 cursor-pointer"
                              title="Ver detalle"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Filas vacías para altura constante */}
                    {Array.from({
                      length: PAGE_SIZE - currentData.length,
                    }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent">
                        {Array.from({ length: 7 }).map((__, i) => (
                          <td key={i} className="px-4 py-3">
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray70 italic"
                    >
                      No hay motorizados asociados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador (pegado a la tabla) */}
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
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
        </section>
      </div>

      {/* Snackbar flotante */}
      <div
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-50 transition-all duration-300 ${
          snackbar.open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="rounded-full px-4 py-2 bg-gray90 text-white shadow-lg text-[12px]">
          {snackbar.message}
        </div>
      </div>

      {/* Drawer lateral derecho */}
      {openDrawer && selected && (
        <div
          className="fixed inset-0 z-[60] bg-black/30"
          onClick={closeDetails} // cerrar al click afuera
          aria-modal="true"
          role="dialog"
        >
          {/* Panel */}
          <aside
            className="absolute right-0 top-0 h-full w-[520px] max-w-[92vw] bg-white shadow-2xl border-l border-gray30 overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // impedir cierre al click dentro
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-3 border-b border-gray20">
              <div className="flex items-center gap-2 text-primaryDark">
                <Icon
                  icon="mdi:clipboard-account-outline"
                  width={22}
                  height={22}
                />
                <h2 className="text-[20px] font-bold">
                  DETALLE DEL REPARTIDOR
                </h2>
              </div>
              <p className="text-[12px] text-gray60 mt-2 leading-relaxed">
                Consulta todos los datos registrados del repartidor, incluyendo
                información personal, vehículo asignado y datos de contacto.
                Verifica y mantén actualizada esta información para garantizar
                una operación eficiente en las entregas.
              </p>
            </div>

            {/* Body: grid 2 columnas con base 12px */}
            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-[12px]">
              {/* Nombre */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  Nombre
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.nombres || ""}
                />
              </div>

              {/* Apellido */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  Apellido
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.apellidos || ""}
                />
              </div>

              {/* Licencia */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  Licencia
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.licencia || "-"}
                />
              </div>

              {/* DNI */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  DNI
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.dni_ci || ""}
                />
              </div>

              {/* Teléfono con prefijo */}
              <div className="flex flex-col gap-2 md:col-span-1">
                <label className="text-[12px] text-gray80 font-medium">
                  Teléfono
                </label>
                <div className="flex items-center h-10 rounded-md border border-gray30 bg-gray10 overflow-hidden">
                  <span className="px-3 text-gray70 text-[12px] border-r border-gray30">
                    + 51
                  </span>
                  <input
                    className="flex-1 h-full px-3 bg-transparent text-gray80 text-[12px]"
                    disabled
                    value={String(selected.telefono || "").replace(
                      /^\+?51\s?/,
                      ""
                    )}
                  />
                </div>
              </div>

              {/* Correo */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  Correo
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.correo || ""}
                />
              </div>

              {/* Tipo de Vehiculo */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  Tipo de Vehiculo
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.tipo_vehiculo || ""}
                />
              </div>

              {/* Placa */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-gray80 font-medium">
                  Placa
                </label>
                <input
                  className="h-10 px-3 rounded-md border border-gray30 bg-gray10 text-gray80 text-[12px]"
                  disabled
                  value={selected.placa || ""}
                />
              </div>
            </div>

            <div className="h-4" />
          </aside>
        </div>
      )}
    </div>
  );
}
