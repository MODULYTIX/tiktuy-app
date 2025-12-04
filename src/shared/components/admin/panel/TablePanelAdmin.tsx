// src/shared/components/admin/panel/TablePanelAdmin.tsx
import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { SolicitudCourier, SolicitudCourierCompleto } from "@/role/user/service/solicitud-courier.types";
import ModalDetalleSolicitud from "./ModalDetalleSolicitudAdmin";
import ModalConfirmAsociar from "./ModalConfirmAsociarAdmin";
import ModalConfirmDesasociar from "./ModalConfirmDesasociarAdmin";

type Props = {
  data: SolicitudCourier[];
  dataCompleta: SolicitudCourierCompleto[];
  loading?: boolean;
  errorMsg?: string | null;
  itemsPerPage?: number;
  onAssociate?: (
    uuid: string
  ) => void | Promise<void | { passwordSetupUrl?: string }>;
  onDesassociate?: (uuid: string) => void | Promise<void>;
};

export default function TablePanelAdmin({
  data,
  dataCompleta,
  loading = false,
  errorMsg = null,
  itemsPerPage = 6,
  onAssociate,
  onDesassociate,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const [viewItem, setViewItem] = useState<SolicitudCourierCompleto | null>(null);
  const [assocUuid, setAssocUuid] = useState<string | null>(null);
  const [desassocUuid, setDesassocUuid] = useState<string | null>(null);

  const [assocResultUrl, setAssocResultUrl] = useState<string | null>(null);
  const [assocLoading, setAssocLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.length ?? 0) / itemsPerPage)),
    [data?.length, itemsPerPage]
  );

  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return (data ?? []).slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  useMemo(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]); // eslint-disable-line

  const copy = async (text?: string | null) => {
    try {
      if (text) await navigator.clipboard.writeText(text);
    } catch { }
  };

  async function handleAssociate(uuid: string) {
    setAssocLoading(true);
    setAssocResultUrl(null);
    try {
      const resp = await onAssociate?.(uuid);
      const url = (resp as any)?.passwordSetupUrl as string | undefined;
      if (url) setAssocResultUrl(url);
    } finally {
      setAssocLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default p-6 text-sm text-gray70">
        Cargando solicitudes…
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default p-6 text-sm text-red-600">
        {errorMsg}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default p-6 text-sm text-gray70">
        No hay solicitudes registradas.
      </div>
    );
  }

  // === NUEVO FORMATO DE TABLA (según tu guía)
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white border-b-4 border-gray90">
          <table className="min-w-full table-fixed text-[12px] bg-white border-b border-gray30 rounded-t-md">
            <colgroup>
              {["16%", "16%", "22%", "16%", "12%", "10%", "8%"].map((w) => (
                <col key={w} style={{ width: w }} />
              ))}
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray70 font-roboto font-medium">
                <th className="px-4 py-3 text-left">Departamento</th>
                <th className="px-4 py-3 text-left">Ciudad</th>
                <th className="px-4 py-3 text-left">Dirección</th>
                <th className="px-4 py-3 text-left">Courier</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray20">
              {currentRows.map((r) => {
                const isAsociado = !!r.tiene_password;
                return (
                  <tr
                    key={r.uuid}
                    className="hover:bg-gray10 transition-colors text-gray70 font-[400]"
                  >
                    <td className="px-4 py-3">{r.departamento ?? "-"}</td>
                    <td className="px-4 py-3">{r.ciudad ?? "-"}</td>
                    <td className="px-4 py-3">{r.direccion ?? "-"}</td>
                    <td className="px-4 py-3">{r.nombre_comercial ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{r.telefono || "—"}</span>
                        {r.telefono && (
                          <button
                            type="button"
                            onClick={() => copy(r.telefono)}
                            className="p-1 rounded hover:bg-gray10"
                            title="Copiar teléfono"
                          >
                            <Icon
                              icon="mdi:content-copy"
                              width="16"
                              height="16"
                            />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-[6px] rounded-full text-[12px] font-medium shadow-sm ${isAsociado
                          ? "bg-black text-white"
                          : "bg-gray30 text-gray80"
                          }`}
                      >
                        {isAsociado ? "Asociado" : "No Asociado"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {/* Ver detalle */}
                        <button
                          onClick={() => {
                            const full = dataCompleta.find((x) => x.uuid === r.uuid);
                            if (!full) return;          
                            setViewItem(full);
                          }}

                          className="p-1 hover:bg-gray10 rounded"
                          type="button"
                        >
                          <Icon
                            icon="mdi:eye-outline"
                            className="text-blue-700"
                          />
                        </button>

                        {/* Asociar / Desasociar */}
                        {isAsociado ? (
                          <button
                            onClick={() => setDesassocUuid(r.uuid)}
                            className="p-1 hover:bg-gray10 rounded"
                            type="button"
                          >
                            <Icon
                              icon="mdi:lock-alert-outline"
                              className="text-red-600"
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAssocUuid(r.uuid);
                              setAssocResultUrl(null);
                            }}
                            className="p-1 hover:bg-gray10 rounded"
                            type="button"
                          >
                            <Icon
                              icon="mdi:check-circle-outline"
                              className="text-green-600"
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINADOR (según tu formato estándar) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-2">
            <button
              onClick={() =>
                setCurrentPage((p) => (p > 1 ? p - 1 : p))
              }
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === p
                  ? "bg-gray90 text-white"
                  : "bg-gray10 text-gray70 hover:bg-gray20"
                  }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p < totalPages ? p + 1 : p
                )
              }
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &gt;
            </button>
          </div>
        )}
      </section>

      {/* === Modales === */}
      {viewItem && (
        <ModalDetalleSolicitud
          open={!!viewItem}
          data={viewItem}
          onClose={() => setViewItem(null)}
        />
      )}

      {assocUuid && (
        <ModalConfirmAsociar
          open={!!assocUuid}
          loading={assocLoading}
          passwordSetupUrl={assocResultUrl}
          onCopy={() => copy(assocResultUrl)}
          onConfirm={async () => {
            await handleAssociate(assocUuid);
          }}
          onClose={() => {
            setAssocUuid(null);
            setAssocResultUrl(null);
            setAssocLoading(false);
          }}
        />
      )}

      {desassocUuid && (
        <ModalConfirmDesasociar
          open={!!desassocUuid}
          onConfirm={async () => {
            await onDesassociate?.(desassocUuid);
            setDesassocUuid(null);
          }}
          onClose={() => setDesassocUuid(null)}
        />
      )}
    </div>
  );
}
