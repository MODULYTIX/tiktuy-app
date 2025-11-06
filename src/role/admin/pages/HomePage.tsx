import { useEffect, useMemo, useState, useCallback } from 'react';
import Tittlex from '@/shared/common/Tittlex';
import FilterPanelAdmin from '@/shared/components/admin/panel/FilterPanelAdmin';
import TablePanelAdmin from '@/shared/components/admin/panel/TablePanelAdmin';
import TablePanelAdminEcommerce from '@/shared/components/admin/panel/TablePanelAdminEcommerce';
import { useAuth } from '@/auth/context/useAuth';

// Courier
import type { SolicitudCourier } from '@/role/user/service/solicitud-courier.types';
import {
  cambiarEstadoCourier,
  fetchSolicitudesCourier,
} from '@/role/user/service/solitud-courier.api';

// Ecommerce
import type { SolicitudEcommerce } from '@/role/user/service/solicitud-ecommerce.types';
import {
  fetchSolicitudesEcommerce,
  cambiarEstadoEcommerce,
} from '@/role/user/service/solitud-courier.api';

type Filtros = { ciudad: string; courier: string; estado: string };
type Tab = 'courier' | 'ecommerce';

export default function AdminHomePage() {
  const { token } = useAuth();

  const [tab, setTab] = useState<Tab>('courier');

  // Data
  const [rowsCourier, setRowsCourier] = useState<SolicitudCourier[]>([]);
  const [rowsEcom, setRowsEcom] = useState<SolicitudEcommerce[]>([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({ ciudad: '', courier: '', estado: '' });

  // cargar según pestaña
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (tab === 'courier') {
        const data = await fetchSolicitudesCourier(token);
        setRowsCourier(data);
      } else {
        const data = await fetchSolicitudesEcommerce(token);
        setRowsEcom(data);
      }
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => {
    load();
  }, [load]);

  // handlers filtros
  const handleChangeFiltro = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((s) => ({ ...s, [name]: value }));
  };
  const limpiarFiltros = () => setFiltros({ ciudad: '', courier: '', estado: '' });

  // listas únicas (dependen de la pestaña)
  const ciudades = useMemo(() => {
    const base = tab === 'courier' ? rowsCourier.map((r) => r.ciudad) : rowsEcom.map((r) => r.ciudad);
    return Array.from(new Set(base.filter(Boolean)));
  }, [rowsCourier, rowsEcom, tab]);

  const couriersUnicos = useMemo(() => {
    const base =
      tab === 'courier'
        ? rowsCourier.map((r) => r.courier)
        : rowsEcom.map((r) => r.ecommerce); // en ecom el nombre va en "ecommerce"
    return Array.from(new Set(base.filter(Boolean)));
  }, [rowsCourier, rowsEcom, tab]);

  const estados = useMemo(() => ['Asociado', 'No asociado'], []);

  // aplicar filtros
  const filteredCourier = useMemo(
    () =>
      rowsCourier.filter(
        (r) =>
          (!filtros.ciudad || r.ciudad === filtros.ciudad) &&
          (!filtros.courier || r.courier === filtros.courier) &&
          (!filtros.estado || r.estado === filtros.estado)
      ),
    [rowsCourier, filtros]
  );

  const filteredEcom = useMemo(
    () =>
      rowsEcom.filter(
        (r) =>
          (!filtros.ciudad || r.ciudad === filtros.ciudad) &&
          (!filtros.courier || r.ecommerce === filtros.courier) &&
          (!filtros.estado || (r.estado ?? '') === filtros.estado)
      ),
    [rowsEcom, filtros]
  );

  // acciones
  const onAssociate = async (uuid: string) => {
    if (!token) return;
    if (tab === 'courier') {
      const r = await cambiarEstadoCourier(token, uuid, 'asociar');
      await load();
      return r ? { passwordSetupUrl: r.passwordSetupUrl ?? undefined } : undefined;
    } else {
      const r = await cambiarEstadoEcommerce(token, uuid, 'asociar');
      await load();
      return r ? { passwordSetupUrl: r.passwordSetupUrl ?? undefined } : undefined;
    }
  };
  

  const onDesassociate = async (uuid: string) => {
    if (!token) return;
    if (tab === 'courier') {
      await cambiarEstadoCourier(token, uuid, 'desasociar');
    } else {
      await cambiarEstadoEcommerce(token, uuid, 'desasociar');
    }
    await load();
  };

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Tittlex
          title="Panel de Control"
          description={
            tab === 'courier'
              ? 'Monitoreo de asociación con couriers por ciudades'
              : 'Monitoreo de solicitudes de ecommerces'
          }
        />

        {/* Botonera (como la imagen): derecha, dos pestañas */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setTab('ecommerce');
              limpiarFiltros();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-semibold
              ${tab === 'ecommerce'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-gray-100 text-gray-800 border-gray-300'}
            `}
            title="Ver solicitudes de Ecommerce"
          >
            <span className="inline-flex w-5 h-5 items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 7h18v2H3V7zm2 4h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8zm2 2v6h10v-6H7zM7 3h10a2 2 0 0 1 2 2v1H5V5a2 2 0 0 1 2-2z"/>
              </svg>
            </span>
            Ecommerce
          </button>

          <div className="w-px h-6 bg-gray-200" />

          <button
            type="button"
            onClick={() => {
              setTab('courier');
              limpiarFiltros();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-semibold
              ${tab === 'courier'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-gray-100 text-gray-800 border-gray-300'}
            `}
            title="Ver solicitudes de Courier"
          >
            <span className="inline-flex w-5 h-5 items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M21 8l-9-5-9 5 9 5 9-5zm-9 7l-9-5v7l9 5 9-5v-7l-9 5z"/>
              </svg>
            </span>
            Courier
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <FilterPanelAdmin
          filtros={filtros}
          ciudades={ciudades}
          couriersUnicos={couriersUnicos}
          estados={estados}
          handleChangeFiltro={handleChangeFiltro}
          limpiarFiltros={limpiarFiltros}
        />

        {tab === 'courier' ? (
          <TablePanelAdmin
            loading={loading}
            data={filteredCourier}
            onAssociate={onAssociate}
            onDesassociate={onDesassociate}
          />
        ) : (
          <TablePanelAdminEcommerce
            loading={loading}
            data={filteredEcom}
            onAssociate={onAssociate}
            onDesassociate={onDesassociate}
          />
        )}
      </div>
    </div>
  );
}
