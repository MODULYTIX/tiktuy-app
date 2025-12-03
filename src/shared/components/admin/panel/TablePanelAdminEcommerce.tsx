import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import Paginator from '@/shared/components/Paginator';
import type { SolicitudEcommerce } from '@/role/user/service/solicitud-ecommerce.types';

// Si ya tienes un modal de detalle genérico, mantenlo. Si no, puedes quitarlo sin romper nada.

//  usa los modales que enviaste (nuevas rutas bajo /modals)
import ModalConfirmAsociar from '@/shared/components/admin/panel/ecommerce/ModalConfirmAsociar';
import ModalConfirmDesasociar from '@/shared/components/admin/panel/ecommerce/ModalConfirmDesasociar';
import ModalDetalleSolicitudAdminEcommerce from './ModalDetalleSolicitudAdminEcommer';

type Props = {
  data: SolicitudEcommerce[];
  loading?: boolean;
  errorMsg?: string | null;
  itemsPerPage?: number;
  onAssociate?: (uuid: string) => void | Promise<void | { passwordSetupUrl?: string }>;
  onDesassociate?: (uuid: string) => void | Promise<void>;
};

function EstadoPill({ tienePassword }: { tienePassword?: boolean }) {
  const isAsociado = !!tienePassword;
  const value = isAsociado ? 'Asociado' : 'No asociado';
  const cls = isAsociado
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-red-100 text-red-700 border border-red-200';
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{value}</span>;
}

export default function TablePanelAdminEcommerce({
  data,
  loading = false,
  errorMsg = null,
  itemsPerPage = 6,
  onAssociate,
  onDesassociate,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  // Estado UI para modales
  const [viewItem, setViewItem] = useState<SolicitudEcommerce | null>(null);
  const [assocUuid, setAssocUuid] = useState<string | null>(null);
  const [desassocUuid, setDesassocUuid] = useState<string | null>(null);

  // Para mostrar el link devuelto al asociar
  const [assocResultUrl, setAssocResultUrl] = useState<string | null>(null);
  const [assocLoading, setAssocLoading] = useState(false);

  // Paginación
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

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 text-sm text-gray-600">
        Cargando solicitudes…
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 text-sm text-red-700">
        {errorMsg}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 text-sm text-gray-600">
        No hay solicitudes registradas.
      </div>
    );
  }

  const copy = async (text?: string | null) => {
    try {
      if (text) await navigator.clipboard.writeText(text);
    } catch { /* empty */ }
  };

  // Acciones
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

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            {/* Sin departamento en Ecommerce */}
            <th className="px-4 py-3">Ciudad</th>
            <th className="px-4 py-3">Dirección</th>
            <th className="px-4 py-3">Rubro</th>
            <th className="px-4 py-3">Ecommerce</th>
            <th className="px-4 py-3">Teléfono</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {currentRows.map((r) => {
            const isAsociado = !!r.tiene_password; // ⬅️ misma regla
            return (
              <tr key={r.uuid} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{r.ciudad}</td>
                <td className="px-4 py-3">{r.direccion}</td>
                <td className="px-4 py-3">{r.rubro}</td>
                <td className="px-4 py-3">{r.ecommerce}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{r.telefono || '—'}</span>
                    {r.telefono && (
                      <button
                        type="button"
                        onClick={() => copy(r.telefono)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Copiar teléfono"
                      >
                        <Icon icon="mdi:content-copy" width="16" height="16" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <EstadoPill tienePassword={r.tiene_password} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-3">
                    {/* 👁️ Ver detalle (si tienes un modal genérico) */}
                    <button
                      type="button"
                      onClick={() => setViewItem(r)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Ver detalle"
                    >
                      <Icon icon="mdi:eye-outline" width={18} />
                    </button>

                    {isAsociado ? (
                      // ✅ Ya asociado → botón para desasociar
                      <button
                        type="button"
                        onClick={() => setDesassocUuid(r.uuid)}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Desasociar"
                      >
                        <Icon
                          icon="mdi:lock-alert-outline"
                          className="text-red-600"
                          width={18}
                        />
                      </button>
                    ) : (
                      // ❌ No tiene contraseña ⇒ generar link/invitar (asociar)
                      <button
                        type="button"
                        onClick={() => {
                          setAssocUuid(r.uuid);
                          setAssocResultUrl(null);
                        }}
                        className="p-1 hover:bg-blue-50 rounded"
                        title="Generar enlace de invitación"
                      >
                        <Icon
                          icon="mdi:link-variant"
                          className="text-blue-600"
                          width={18}
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

      {totalPages > 1 && (
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (page >= 1 && page <= totalPages) setCurrentPage(page);
          }}
          appearance="grayRounded"
          showArrows
          containerClassName="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3"
        />
      )}

      {/* Drawer detalle (opcional) */}
      {viewItem && (
        <ModalDetalleSolicitudAdminEcommerce
          open={!!viewItem}
          data={viewItem}
          onClose={() => setViewItem(null)}
        />
      )}

      {/* Modal asociar (genera link si aplica) */}
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

      {/* Modal desasociar */}
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
