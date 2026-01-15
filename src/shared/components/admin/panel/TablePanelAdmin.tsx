// src/shared/components/admin/panel/TablePanelAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type {
  SolicitudCourier,
  SolicitudCourierCompleto,
} from "@/role/user/service/solicitud-courier.types";
import ModalDetalleSolicitud from "./ModalDetalleSolicitudAdmin";
import ModalConfirmAsociar from "./ModalConfirmAsociarAdmin";
import ModalConfirmDesasociar from "./ModalConfirmDesasociarAdmin";
import TableActionx from "@/shared/common/TableActionx";
import Badgex from "@/shared/common/Badgex";

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
  const PAGE_SIZE = itemsPerPage;
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState<SolicitudCourierCompleto | null>(
    null
  );
  const [assocUuid, setAssocUuid] = useState<string | null>(null);
  const [desassocUuid, setDesassocUuid] = useState<string | null>(null);

  const [assocResultUrl, setAssocResultUrl] = useState<string | null>(null);
  const [assocLoading, setAssocLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE)),
    [data?.length, PAGE_SIZE]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (data ?? []).slice(start, start + PAGE_SIZE);
  }, [data, page, PAGE_SIZE]);

  const emptyRowsCount = PAGE_SIZE - visibleData.length;

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

  const copy = async (text?: string | null) => {
    const val = text?.trim();
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
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

  if (errorMsg) {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default p-6 text-sm text-red-600">
        {errorMsg}
      </div>
    );
  }

  if (!loading && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default p-6 text-sm text-gray70">
        No hay solicitudes registradas.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <section className="flex-1 overflow-auto">
        <div className="overflow-x-auto bg-white border-b border-gray20">
          {/* ⬇️ OJO: quitamos border-b del table para que la línea gris se dibuje en el footer (border-t) */}
          <table className="min-w-full table-fixed text-[12px] bg-white rounded-t-md">
            <colgroup>
              {["16%", "16%", "22%", "16%", "12%", "10%", "8%"].map((w, i) => (
                <col key={i} style={{ width: w }} />
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
              ) : (
                <>
                  {visibleData.map((r) => {
                    const isAsociado = !!r.tiene_password;

                    return (
                      <tr
                        key={r.uuid}
                        className="hover:bg-gray10 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {r.departamento ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {r.ciudad ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {r.direccion ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
                          {r.nombre_comercial ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray70 font-[400]">
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
                          <Badgex
                            className={isAsociado ? "" : "bg-gray30 text-gray80"}
                          >
                            {isAsociado ? "Asociado" : "No Asociado"}
                          </Badgex>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-3">
                            <TableActionx
                              variant="view"
                              title="Ver detalle"
                              onClick={() => {
                                const full = dataCompleta.find(
                                  (x) => x.uuid === r.uuid
                                );
                                if (!full) return;
                                setViewItem(full);
                              }}
                              size="sm"
                            />

                            {isAsociado ? (
                              <TableActionx
                                variant="custom"
                                title="Desasociar"
                                icon="mdi:lock-alert-outline"
                                onClick={() => setDesassocUuid(r.uuid)}
                                colorClassName="bg-red-100 text-red-700 ring-1 ring-red-300 hover:bg-red-200 hover:ring-red-400 focus-visible:ring-red-500"
                                size="sm"
                              />
                            ) : (
                              <TableActionx
                                variant="custom"
                                title="Asociar"
                                icon="mdi:check-circle-outline"
                                onClick={() => {
                                  setAssocUuid(r.uuid);
                                  setAssocResultUrl(null);
                                }}
                                colorClassName="bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200 hover:ring-green-400 focus-visible:ring-green-500"
                                size="sm"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {emptyRowsCount > 0 &&
                    Array.from({ length: emptyRowsCount }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="hover:bg-transparent">
                        {Array.from({ length: 7 }).map((__, i) => (
                          <td key={i} className="px-4 py-3">
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ FOOTER SIEMPRE (así SIEMPRE se ve el borde gris + el borde grueso y también el paginador) */}
        <div className="w-full flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3">
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
