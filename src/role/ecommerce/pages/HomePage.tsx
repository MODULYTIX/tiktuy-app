import { useAuth } from '@/auth/context/useAuth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { asociarCourier, crearRelacionCourier, desasociarCourier, fetchEcommerceCourier } from '@/services/ecommerce/ecommerceCourier.api';
import { Icon } from '@iconify/react';
import { ModalAsociarseCourier, type ModalMode } from '@/shared/components/ecommerce/asociarse/ModalAsociarseCourier';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Select } from '@/shared/components/Select';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';

// ---------- Normalizador ----------
type ApiCourierRaw = {
  id?: number;
  nombre_comercial?: string;
  telefono?: string;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  estado_asociacion?: string;
  activo?: boolean;
  id_relacion?: number | null;
  relacion_id?: number | null;
  ecommerce_courier_id?: number | null;
  courier?: {
    id?: number;
    nombre_comercial?: string;
    nombre?: string;
    telefono?: string;
    ciudad?: string;
    departamento?: string;
    direccion?: string;
  };
};

function normalizeToCourierAsociado(arr: ReadonlyArray<unknown>): CourierAsociado[] {
  return (arr ?? []).map((item): CourierAsociado => {
    const r = (item ?? {}) as ApiCourierRaw;
    const nested = r.courier ?? {};
    const estado: 'Activo' | 'No Asociado' = (() => {
      if (typeof r.estado_asociacion === 'string') {
        const s = r.estado_asociacion.toLowerCase();
        if (s.includes('activo')) return 'Activo';
        if (s.includes('no asociado') || s.includes('inactivo')) return 'No Asociado';
      }
      if (typeof r.activo === 'boolean')
        return r.activo ? 'Activo' : 'No Asociado';
      return 'No Asociado';
    })();

    const id_relacion = r.id_relacion ?? r.relacion_id ?? r.ecommerce_courier_id ?? null;

    return {
      id: r.id ?? nested.id ?? 0,
      nombre_comercial: r.nombre_comercial ?? nested.nombre_comercial ?? nested.nombre ?? '',
      telefono: r.telefono ?? nested.telefono ?? '',
      ciudad: r.ciudad ?? nested.ciudad ?? '',
      departamento: r.departamento ?? nested.departamento ?? '',
      direccion: r.direccion ?? nested.direccion ?? '',
      nombre_usuario: '',
      estado_asociacion: estado,
      id_relacion,
    };
  });
}

// ---------- Skeleton ----------
function TableSkeletonRows({ rows = 6 }: { rows?: number }) {
  const cols = 7;
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`sk-${rIdx}`} className="border-t">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <td key={`sk-${rIdx}-${cIdx}`} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[180px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------- Página ----------
export default function EcommerceHomePage() {
  const { token } = useAuth();
  const [data, setData] = useState<CourierAsociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [filtros, setFiltros] = useState({
    ciudad: '',
    courier: '',
    estado: '',
  });


  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<CourierAsociado | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setErrorMsg('');
      setLoading(true);
      const res = await fetchEcommerceCourier(token);
      setData(normalizeToCourierAsociado(res));
    } catch {
      setErrorMsg('Ocurrió un error al cargar los couriers.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChangeFiltro = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFiltros((p) => ({ ...p, [e.target.name]: e.target.value }));

  const limpiarFiltros = () => setFiltros({ ciudad: '', courier: '', estado: '' });

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
          (!filtros.ciudad || e.ciudad === filtros.ciudad) &&
          (!filtros.courier || e.nombre_comercial === filtros.courier) &&
          (!filtros.estado || e.estado_asociacion === filtros.estado)
      ),
    [data, filtros]
  );

  const ciudades = useMemo(() => [...new Set(data.map((d) => d.ciudad).filter(Boolean))], [data]);
  const couriersUnicos = useMemo(
    () => [...new Set(data.map((d) => d.nombre_comercial).filter(Boolean))],
    [data]
  );
  const estados = useMemo(() => ['Activo', 'No Asociado'], []);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(dataFiltrada.length / PAGE_SIZE));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
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
        pages.unshift('...');
        pages.unshift(1);
      }
      if (end < totalPages) {
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [totalPages, page]);

  return (
    <section className="mt-8 flex flex-col gap-[1.25rem]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primaryDark">Panel de Control</h1>
        <p className="text-gray60">
          Monitoreo de Asociación con couriers por ciudades
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default flex flex-wrap gap-4 items-end border-b-4 border-gray90">
        {/* Filtro Ciudad */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-ciudad" className="text-sm font-medium text-gray70">
            Ciudad
          </label>
          <div className="relative w-full">
            <Select
              id="f-ciudad"
              name="ciudad"
              value={filtros.ciudad}
              onChange={handleChangeFiltro}
              options={[{ value: '', label: 'Todas' }, ...ciudades.map((c) => ({ value: c, label: c }))]}
              placeholder="Seleccionar Ciudad"
            />
          </div>
        </div>

        {/* Filtro Courier */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-courier" className="text-sm font-medium text-gray70">
            Courier
          </label>
          <div className="relative w-full">
            <Select
              id="f-courier"
              name="courier"
              value={filtros.courier}
              onChange={handleChangeFiltro}
              options={[{ value: '', label: 'Todos' }, ...couriersUnicos.map((c) => ({ value: c, label: c }))]}
              placeholder="Seleccionar Courier"
            />
          </div>
        </div>

        {/* Filtro Estado */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label htmlFor="f-estado" className="text-sm font-medium text-gray70">
            Estado
          </label>
          <div className="relative w-full">
            <Select
              id="f-estado"
              name="estado"
              value={filtros.estado}
              onChange={handleChangeFiltro}
              options={[{ value: '', label: 'Todos' }, ...estados.map((e) => ({ value: e, label: e }))]}
              placeholder="Seleccionar Estado"
            />
          </div>
        </div>

        {/* Botón Limpiar Filtros */}
        <button
          onClick={limpiarFiltros}
          className="flex items-center gap-2 bg-gray10 border border-gray60 px-3 py-2 rounded text-gray60 text-sm hover:bg-gray-100"
        >
          <Icon icon="mynaui:delete" width="24" height="24" color="gray60" />
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        <section className="flex-1 overflow-auto">
          <div className="overflow-x-auto bg-white rounded shadow-default">
            <table className="w-full text-sm bg-white table-fixed">
              <thead className="bg-[#E5E7EB] text-gray70 font-medium">
                <tr>
                  {['Departamento', 'Ciudad', 'Dirección', 'Courier', 'Teléfono', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-sm text-gray70 font-roboto font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="text-gray80">
                {loading ? (
                  <TableSkeletonRows rows={6} />
                ) : dataFiltrada.length > 0 ? (
                  dataFiltrada.map((entry) => {
                    const asociado = entry.estado_asociacion === 'Activo';
                    return (
                      <tr key={`${entry.id}-${entry.id_relacion ?? 'na'}`} className="border-t hover:bg-gray10">
                        <td className="px-4 py-3">{entry.departamento}</td>
                        <td className="px-4 py-3">{entry.ciudad}</td>
                        <td className="px-4 py-3">{entry.direccion}</td>
                        <td className="px-4 py-3">{entry.nombre_comercial}</td>
                        <td className="px-4 py-3">{entry.telefono}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${asociado ? 'bg-black text-white' : 'bg-gray20 text-gray80'}`}
                          >
                            {entry.estado_asociacion}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-3">
                          {/* Ver */}
                          <button
                            onClick={() => {
                              setSelected(entry);
                              setModalMode('view');
                              setOpenModal(true);
                            }}
                            className="p-1 hover:bg-gray10 rounded"
                            type="button"
                          >
                            <Icon icon="mdi:eye-outline" className="text-blue-700" />
                          </button>
                          {/* Asociar */}
                          {!asociado && (
                            <button
                              onClick={() => {
                                setSelected(entry);
                                setModalMode('associate');
                                setOpenModal(true);
                              }}
                              className="p-1 hover:bg-gray10 rounded"
                              type="button"
                            >
                              <Icon icon="mdi:check-circle-outline" className="text-green-600" />
                            </button>
                          )}
                          {/* Desasociar */}
                          {asociado && (
                            <button
                              onClick={() => {
                                setSelected(entry);
                                setModalMode('desassociate');
                                setOpenModal(true);
                              }}
                              className="p-1 hover:bg-gray10 rounded"
                              type="button"
                            >
                              <Icon icon="mdi:lock-alert-outline" className="text-red-600" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray60">
                      No se encontraron resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          <div className="flex items-center justify-end gap-2 border-b-[4px] border-gray90 py-3 px-3 mt-6">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center bg-gray10 text-gray70 rounded hover:bg-gray20 disabled:opacity-50 disabled:hover:bg-gray10"
            >
              &lt;
            </button>

            {pagerItems.map((p, i) =>
              typeof p === 'string' ? (
                <span key={`dots-${i}`} className="px-2 text-gray70">
                  {p}
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={page === p ? 'page' : undefined}
                  className={[
                    'w-8 h-8 flex items-center justify-center rounded',
                    page === p
                      ? 'bg-gray90 text-white'
                      : 'bg-gray10 text-gray70 hover:bg-gray20'
                  ].join(' ')}
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