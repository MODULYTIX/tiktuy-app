import { useAuth } from '@/auth/context/useAuth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {  fetchEcommerceCourier,  crearRelacionCourier,  asociarCourier,  desasociarCourier} from '@/services/ecommerce/ecommerceCourier.api';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';
import { Icon } from '@iconify/react';
import { ModalAsociarseCourier, type ModalMode } from '@/shared/components/ecommerce/asociarse/ModalAsociarseCourier';
import { Skeleton } from '@/shared/components/ui/Skeleton';

/** Respuesta cruda flexible del backend (sin `any`) */
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

/** Normaliza al shape `CourierAsociado` con tipos seguros */
function normalizeToCourierAsociado(arr: ReadonlyArray<unknown>): CourierAsociado[] {
  return (arr ?? []).map((item): CourierAsociado => {
    const r = (item ?? {}) as ApiCourierRaw;
    const nested = r.courier ?? {};
    const estado =
      r.estado_asociacion ??
      (typeof r.activo === 'boolean' ? (r.activo ? 'activo' : 'inactivo') : undefined) ??
      'No Asociado';

    return {
      id: r.id ?? nested.id ?? 0,
      nombre_comercial:
        r.nombre_comercial ?? nested.nombre_comercial ?? nested.nombre ?? '',
      telefono: r.telefono ?? nested.telefono ?? '',
      ciudad: r.ciudad ?? nested.ciudad ?? '',
      departamento: r.departamento ?? nested.departamento ?? '',
      direccion: r.direccion ?? nested.direccion ?? '',
      estado_asociacion: estado,
      id_relacion: r.id_relacion ?? r.relacion_id ?? r.ecommerce_courier_id ?? null,
    };
  });
}

/** Filas de skeleton para tabla (mantiene el layout mientras carga) */
function TableSkeletonRows({ rows = 6 }: { rows?: number }) {
  const cols = 7; // Departamento, Ciudad, Dirección, Courier, Teléfono, Estado, Acciones
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

export default function EcommerceHomePage() {
  const { token } = useAuth();
  const [data, setData] = useState<CourierAsociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [filtros, setFiltros] = useState({ ciudad: '', courier: '', estado: '' });

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<CourierAsociado | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');

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

  /** Abrir modal en modos específicos */
  // const openView = (entry: CourierAsociado) => {
  //   setSelected(entry);
  //   setModalMode('view');
  //   setOpenModal(true);
  // };
  // const openAssociate = (entry: CourierAsociado) => {
  //   setSelected(entry);
  //   setModalMode('associate');
  //   setOpenModal(true);
  // };
  // const openDesassociate = (entry: CourierAsociado) => {
  //   setSelected(entry);
  //   setModalMode('desassociate');
  //   setOpenModal(true);
  // };

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
          (!filtros.estado || e.estado_asociacion === filtros.estado),
      ),
    [data, filtros],
  );

  const ciudades = useMemo(
    () => [...new Set(data.map((d) => d.ciudad).filter(Boolean))],
    [data],
  );
  const couriersUnicos = useMemo(
    () => [...new Set(data.map((d) => d.nombre_comercial).filter(Boolean))],
    [data],
  );
  const estados = useMemo(() => ['Activo', 'No Asociado'], []);

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-bold mb-1">Panel de Control</h1>
      <p className="mb-4 text-gray-600">Monitoreo de Asociación con couriers por ciudades</p>

      {/* Filtros */}
      <section className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end mb-6">
        <div className="flex flex-col text-sm">
          <label htmlFor="f-ciudad" className="text-gray-700 font-medium mb-1 text-center">Ciudad</label>
          <select
            id="f-ciudad"
            name="ciudad"
            value={filtros.ciudad}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm"
          >
            <option value="">Todas</option>
            {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col text-sm">
          <label htmlFor="f-courier" className="text-gray-700 font-medium mb-1 text-center">Courier</label>
          <select
            id="f-courier"
            name="courier"
            value={filtros.courier}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {couriersUnicos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col text-sm">
          <label htmlFor="f-estado" className="text-gray-700 font-medium mb-1 text-center">Estado</label>
          <select
            id="f-estado"
            name="estado"
            value={filtros.estado}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {estados.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <button
          onClick={limpiarFiltros}
          className="ml-auto text-sm text-gray-700 border rounded px-4 py-2 hover:bg-gray-50 flex items-center gap-2 transition"
          type="button"
          aria-label="Limpiar filtros"
        >
          <Icon icon="mdi:close" />
          Limpiar Filtros
        </button>
      </section>

      {errorMsg && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Tabla: el contenedor y encabezado SIEMPRE están; el tbody muestra skeleton mientras carga */}
      <section aria-busy={loading}>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded shadow-sm text-sm">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                {['Departamento','Ciudad','Dirección','Courier','Teléfono','Estado','Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody className="text-gray-700">
              {loading ? (
                <TableSkeletonRows rows={6} />
              ) : dataFiltrada.length > 0 ? (
                dataFiltrada.map((entry) => {
                  const asociado = entry.estado_asociacion === 'activo';
                  return (
                    <tr key={`${entry.id}-${entry.id_relacion ?? 'na'}`} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{entry.departamento}</td>
                      <td className="px-4 py-2">{entry.ciudad}</td>
                      <td className="px-4 py-2">{entry.direccion}</td>
                      <td className="px-4 py-2">{entry.nombre_comercial}</td>
                      <td className="px-4 py-2">{entry.telefono}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          asociado ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {entry.estado_asociacion}
                        </span>
                      </td>
                      <td className="px-4 py-2 flex items-center gap-3">
                        {/* Ver: modal informativo */}
                        <button
                          onClick={() => {
                            setSelected(entry);
                            setModalMode('view');
                            setOpenModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          type="button"
                          title="Ver detalle"
                          aria-label="Ver detalle"
                        >
                          <Icon icon="mdi:eye-outline" className="text-blue-700" />
                        </button>

                        {/* Si NO está asociado -> check abre modal de asociar */}
                        {!asociado && (
                          <button
                            onClick={() => {
                              setSelected(entry);
                              setModalMode('associate');
                              setOpenModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            type="button"
                            title="Asociar"
                            aria-label="Asociar"
                          >
                            <Icon icon="mdi:check-circle-outline" className="text-green-600" />
                          </button>
                        )}

                        {/* Si SÍ está asociado -> bloqueo rojo abre modal de desasociar */}
                        {asociado && (
                          <button
                            onClick={() => {
                              setSelected(entry);
                              setModalMode('desassociate');
                              setOpenModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            type="button"
                            title="Desasociar"
                            aria-label="Desasociar"
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
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No se encontraron resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal controlado por modo */}
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
    </div>
  );
}
