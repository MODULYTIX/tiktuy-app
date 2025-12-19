import { useAuth } from "@/auth/context/useAuth";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  asociarCourier,
  crearRelacionCourier,
  desasociarCourier,
  fetchSedesConEstado,
} from "@/services/ecommerce/ecommerceCourier.api";
import { Icon } from "@iconify/react";
import {
  ModalAsociarseCourier,
  type ModalMode,
} from "@/shared/components/ecommerce/asociarse/ModalAsociarseCourier";
import type {
  SedeConEstado,
  CourierAsociado,
} from "@/services/ecommerce/ecommerceCourier.types";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";
import Badgex from "@/shared/common/Badgex";
import TableActionx from "@/shared/common/TableActionx"; // Importamos el componente de acción

/** Adaptador para el modal (espera un CourierAsociado) */
function sedeToCourierAsociado(s: SedeConEstado): CourierAsociado {
  // Inyectamos sede_id / sede_uuid para que el modal pueda crear relación por sede
  const base: CourierAsociado = {
    id: s.courier_id ?? 0,
    nombre_comercial: s.courier_nombre ?? "",
    telefono: s.telefono ?? "",
    ciudad: s.ciudad ?? "",
    departamento: s.departamento ?? "",
    direccion: s.direccion ?? "",
    nombre_usuario: "",
    estado_asociacion:
      s.estado_asociacion === "Activo" ? "Activo" : "No Asociado",
    id_relacion: s.id_relacion ?? null,
  };

  // Devolvemos con campos extra (no tipados en CourierAsociado) para que el modal los lea
  return {
    ...base,
    ...(s.sede_id ? { sede_id: s.sede_id } : {}),
    ...(s.sede_uuid ? { sede_uuid: s.sede_uuid } : {}),
  } as CourierAsociado & { sede_id?: number; sede_uuid?: string };
}

/** Snackbar simple */
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

export default function EcommerceHomePage() {
  const { token } = useAuth();
  const [data, setData] = useState<SedeConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setErrorMsg] = useState("");

  const [filtros, setFiltros] = useState({
    ciudad: "",
    courier: "",
    estado: "",
  });

  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<CourierAsociado | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("view");

  const snackbar = useSnackbar(3000);

  // Paginación
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setErrorMsg("");
      setLoading(true);
      const res = await fetchSedesConEstado(token);
      setData(res);
    } catch {
      setErrorMsg("Ocurrió un error al cargar las sedes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChangeFiltro = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }));

  const limpiarFiltros = () =>
    setFiltros({ ciudad: "", courier: "", estado: "" });

  const closeModal = () => {
    setOpenModal(false);
    setSelected(null);
  };
  const afterMutate = async () => {
    await loadData();
    closeModal();
  };

  const dataFiltrada = useMemo(
    () =>
      data.filter(
        (e) =>
          (!filtros.ciudad || (e.ciudad ?? "") === filtros.ciudad) &&
          (!filtros.courier || (e.courier_nombre ?? "") === filtros.courier) &&
          (!filtros.estado || e.estado_asociacion === filtros.estado)
      ),
    [data, filtros]
  );

  const ciudades = useMemo(
    () =>
      [...new Set(data.map((d) => d.ciudad ?? "").filter(Boolean))] as string[],
    [data]
  );
  const couriersUnicos = useMemo(
    () =>
      [
        ...new Set(data.map((d) => d.courier_nombre ?? "").filter(Boolean)),
      ] as string[],
    [data]
  );
  const estados = useMemo(
    () => ["Activo", "No Asociado", "Inactivo", "Eliminado"],
    []
  );

  // Total de páginas y slice visible
  const totalPages = Math.max(1, Math.ceil(dataFiltrada.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const visibleData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return dataFiltrada.slice(start, start + PAGE_SIZE);
  }, [dataFiltrada, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

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
      if (start > 1) pages.unshift("...", 1);
      if (end < totalPages) pages.push("...", totalPages);
    }
    return pages;
  }, [totalPages, page]);

  const emptyRowsCount = PAGE_SIZE - visibleData.length;

  // Copiar teléfono
  const copyPhone = async (phone?: string | null) => {
    const val = phone?.trim();
    if (!val) return snackbar.show("No hay número");
    try {
      await navigator.clipboard.writeText(val);
      snackbar.show("Número copiado");
    } catch {
      snackbar.show("No se pudo copiar");
    }
  };

  return (
    <section className="mt-8 flex flex-col gap-5">
      <Tittlex
        title="Panel de Control"
        description="Monitoreo de asociación por SEDES"
      />

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end border-b-4 border-gray90">
        <Selectx
          id="f-ciudad"
          name="ciudad"
          label="Ciudad"
          value={filtros.ciudad}
          onChange={handleChangeFiltro}
          placeholder="Seleccionar Ciudad"
          className="w-full"
        >
          {ciudades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selectx>

        <Selectx
          id="f-courier"
          name="courier"
          label="Courier"
          value={filtros.courier}
          onChange={handleChangeFiltro}
          placeholder="Seleccionar Courier"
          className="w-full"
        >
          {couriersUnicos.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selectx>

        <Selectx
          id="f-estado"
          name="estado"
          label="Estado"
          value={filtros.estado}
          onChange={handleChangeFiltro}
          placeholder="Seleccionar Estado"
          className="w-full"
        >
          {estados.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Selectx>

        <Buttonx
          onClick={limpiarFiltros}
          icon="mynaui:delete"
          label="Limpiar Filtros"
          variant="outlined"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
              <colgroup>
                {["18%", "24%", "26%", "14%", "10%", "8%"].map((w) => (
                  <col key={w} style={{ width: w }} />
                ))}
              </colgroup>

              <thead className="bg-[#E5E7EB]">
                <tr className="text-gray70 font-roboto font-medium">
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Courier</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-center">Estado</th>
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
                      {Array.from({ length: 6 }).map((__, i) => (
                        <td key={`sk-${idx}-${i}`}>
                          <div className="h-4 bg-gray20 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : visibleData.length > 0 ? (
                  <>
                    {visibleData.map((sede) => {
                      const asociado = sede.estado_asociacion === "Activo";
                      const modalEntry = sedeToCourierAsociado(sede);
                      return (
                        <tr
                          key={`${sede.sede_uuid}-${sede.id_relacion ?? "na"}`}
                          className="hover:bg-gray10 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray70 font-[400]">
                            {sede.ciudad ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-gray70 font-[400]">
                            {sede.courier_nombre ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-gray70 font-[400]">
                            {sede.direccion ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-gray70 font-[400]">
                            <div className="flex items-center gap-2">
                              <span>{sede.telefono ?? "-"}</span>
                              <button
                                type="button"
                                onClick={() => copyPhone(sede.telefono)}
                                className="p-1 rounded hover:bg-gray10"
                                title="Copiar teléfono"
                              >
                                <Icon
                                  icon="mdi:content-copy"
                                  width="16"
                                  height="16"
                                />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badgex
                              className={asociado ? "" : "bg-gray30 text-gray80"}
                            >
                              {asociado ? "Asociado" : "No Asociado"}
                            </Badgex>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-3">
                              <TableActionx
                                variant="view"
                                title="Ver"
                                onClick={() => {
                                  setSelected(modalEntry);
                                  setModalMode("view");
                                  setOpenModal(true);
                                }}
                                size="sm"
                              />
                              {!asociado && (
                                <TableActionx
                                  variant="custom"
                                  icon="mdi:check-circle-outline"
                                  colorClassName="bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200 hover:ring-green-400 focus-visible:ring-green-500"
                                  title="Asociar"
                                  onClick={() => {
                                    setSelected(modalEntry);
                                    setModalMode("associate");
                                    setOpenModal(true);
                                  }}
                                  size="sm"
                                />
                              )}
                              {asociado && (
                                <TableActionx
                                  variant="custom"
                                  icon="mdi:lock-alert-outline"
                                  colorClassName="bg-red-100 text-red-700 ring-1 ring-red-300 hover:bg-red-200 hover:ring-red-400 focus-visible:ring-red-500"
                                  title="Desasociar"
                                  onClick={() => {
                                    setSelected(modalEntry);
                                    setModalMode("desassociate");
                                    setOpenModal(true);
                                  }}
                                  size="sm"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Filas vacías para altura consistente */}
                    {emptyRowsCount > 0 &&
                      Array.from({ length: emptyRowsCount }).map((_, idx) => (
                        <tr
                          key={`empty-${idx}`}
                          className="hover:bg-transparent"
                        >
                          {Array.from({ length: 6 }).map((__, i) => (
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
                      colSpan={6}
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

      {/* Modal */} 
      {openModal && selected && token && (
        <ModalAsociarseCourier
          open={openModal}
          mode={modalMode}
          token={token}
          entry={selected}
          onClose={closeModal}
          onAssociated={afterMutate}
          onDesassociated={afterMutate}
          crearRelacionCourier={crearRelacionCourier}
          asociarCourier={asociarCourier}
          desasociarCourier={desasociarCourier}
        />
      )}
    </section>
  );
}
