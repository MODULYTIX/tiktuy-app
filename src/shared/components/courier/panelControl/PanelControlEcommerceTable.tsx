import { useEffect, useMemo, useState, useRef } from "react";
import { FaEye } from "react-icons/fa";
import { Icon } from "@iconify/react";
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

const PAGE_SIZE = 5;

/* ----------------------------- helpers ----------------------------- */
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
  const e: any = (item as any).ecommerce ?? item;
  const u: any = e?.usuario ?? {};

  const estado: EstadoTexto =
    typeof u?.contrasena === "string" && u.contrasena.length === 0
      ? "pendiente"
      : "activo";

  const fecha =
    (item as any).createdAt ||
    (item as any).created_at ||
    e?.createdAt ||
    e?.created_at ||
    u?.createdAt ||
    u?.created_at ||
    null;

  return {
    id: e?.id ?? (item as any).id,
    nombre_comercial: e?.nombre_comercial ?? "-",
    ruc: e?.ruc ?? "-",
    ciudad: e?.ciudad ?? "-",
    telefono: u?.telefono ?? "-",
    estado,
    fecha_asociacion: formatDateLikeDDMMYYYY(fecha),
    _raw: item,
  };
}

/* ----------------------------- snackbar ---------------------------- */
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

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  return { open, message, show } as const;
}

/* ------------------------ Modal Detalle Ecommerce ------------------------ */
function DetalleEcommerceModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: EcommerceCourier | null;
}) {
  if (!open || !data) return null;

  const e: any = (data as any).ecommerce ?? data;
  const u: any = e?.usuario ?? {};

  const nombres = u?.nombres ?? "-";
  const apellidos = u?.apellidos ?? "-";
  const dni = u?.DNI ?? u?.dni ?? "-";
  const correo = u?.correo ?? u?.email ?? "-";

  const telefonoRaw: string = (u?.telefono ?? "").toString();
  const phoneLocal = telefonoRaw.replace(/^\+?\s*51\s*/i, ""); // muestra solo los 9 dígitos
  const nombreComercial = e?.nombre_comercial ?? "-";
  const ruc = e?.ruc ?? "-";
  const ciudad = e?.ciudad ?? "-";
  const direccion = e?.direccion ?? "-";
  const rubro = e?.rubro ?? "-";

  const estado: EstadoTexto =
    typeof u?.contrasena === "string" && u.contrasena.length === 0
      ? "pendiente"
      : "activo";

  const inputClass =
    "h-10 px-3 rounded-md border bg-white text-gray90 text-[12px] placeholder:text-gray50 border-gray30 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 bg-opacity-30"
      onClick={onClose}
    >
      {/* Drawer derecho como el resto de modales */}
      <div
        className="w-[40%] max-w-[500px] h-full bg-white overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primaryDark">
              <Icon icon="mdi:store-outline" width={22} height={22} />
              <h2 className="text-[20px] font-bold uppercase">
                DETALLE DEL ECOMMERCE
              </h2>
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-gray80">Estado :</span>
              <span
                className={[
                  "inline-flex items-center h-7 px-3 rounded-[10px] text-[12px] font-medium",
                  estado === "activo"
                    ? "bg-gray90 text-white"
                    : "bg-gray30 text-gray80",
                ].join(" ")}
              >
                {estado === "activo" ? "Activo" : "Pendiente"}
              </span>
            </div>
          </div>

          <p className="text-[12px] text-gray60 mt-2 leading-relaxed">
            Consulta toda la información registrada de este comercio
            electrónico, incluyendo sus datos generales, ubicación, contacto
            comercial y rubro de actividad.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 grid gap-5">
          {/* fila 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Nombre</label>
              <input value={nombres} disabled className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Apellido</label>
              <input value={apellidos} disabled className={inputClass} />
            </div>
          </div>

          {/* fila 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">DNI / CI</label>
              <input value={dni} disabled className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Correo</label>
              <input value={correo} disabled className={inputClass} />
            </div>
          </div>

          {/* fila 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Teléfono</label>
              <div
                className={[
                  "flex items-center h-10 rounded-md overflow-hidden border bg-white",
                  "border-gray30",
                ].join(" ")}
              >
                <span className="w-[56px] shrink-0 grid place-items-center text-gray70 text-[12px] border-r border-gray30">
                  + 51
                </span>
                <input
                  value={phoneLocal}
                  disabled
                  className="flex-1 h-full px-3 bg-transparent text-gray90 text-[12px] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">
                Nombre Comercial
              </label>
              <input value={nombreComercial} disabled className={inputClass} />
            </div>
          </div>

          {/* fila 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">RUC</label>
              <input value={ruc} disabled className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Ciudad</label>
              <input value={ciudad} disabled className={inputClass} />
            </div>
          </div>

          {/* fila 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Dirección</label>
              <input value={direccion} disabled className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Rubro</label>
              <input value={rubro} disabled className={inputClass} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Tabla ----------------------------- */
export default function PanelControlTable() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EcommerceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const snackbar = useSnackbar(3000);

  // Detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<EcommerceCourier | null>(null);

  useEffect(() => {
    let mounted = true;
    (async function load() {
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

      if ((res as any).ok) {
        const mapped = ((res as any).data as EcommerceCourier[]).map(toRow);
        setRows(mapped);
      } else {
        setErr((res as any).error || "Error al listar ecommerces.");
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
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

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      snackbar.show("Número copiado");
    } catch {
      snackbar.show("No se pudo copiar");
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-white rounded-md overflow-hidden shadow-default border border-gray30">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">Nombre Comercial</th>
                  <th className="px-4 py-3 text-left">RUC</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">F. Asociación</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray20">
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <tr
                      key={`sk-${idx}`}
                      className="[&>td]:px-4 [&>td]:py-3 animate-pulse"
                    >
                      {Array.from({ length: 7 }).map((__, i) => (
                        <td key={`sk-${idx}-${i}`}>
                          <div className="h-4 bg-gray20 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : err ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-4 text-center text-red-600 italic"
                    >
                      {err}
                    </td>
                  </tr>
                ) : currentData.length > 0 ? (
                  <>
                    {currentData.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray10 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {entry.nombre_comercial}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {entry.ruc}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {entry.ciudad}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
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

                        {/* ESTADO */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-7 px-3 rounded-[10px] text-[12px] font-medium shadow-sm ${
                              entry.estado === "activo"
                                ? "bg-gray90 text-white"
                                : "bg-gray30 text-gray80"
                            }`}
                          >
                            {entry.estado}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {entry.fecha_asociacion}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <FaEye
                              onClick={() => {
                                setDetailData(entry._raw);
                                setDetailOpen(true);
                              }}
                              className="text-blue-700 hover:text-blue-800 cursor-pointer"
                              title="Ver detalle"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-4 text-center text-gray70 italic"
                    >
                      No se encontraron resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
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

      {/* Modal Detalle */}
      <DetalleEcommerceModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={detailData}
      />
    </div>
  );
}
