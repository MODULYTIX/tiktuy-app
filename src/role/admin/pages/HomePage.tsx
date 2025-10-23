import { useEffect, useMemo, useState, useCallback } from 'react';
import Tittlex from '@/shared/common/Tittlex';
import FilterPanelAdmin from '@/shared/components/admin/panel/FilterPanelAdmin';
import TablePanelAdmin from '@/shared/components/admin/panel/TablePanelAdmin';
import { useAuth } from '@/auth/context/useAuth';
import type { SolicitudCourier } from '@/role/user/service/solicitud-courier.types';
import { cambiarEstadoCourier, fetchSolicitudesCourier } from '@/role/user/service/solitud-courier.api';


type Filtros = { ciudad: string; courier: string; estado: string };

export default function AdminHomePage() {
  const { token } = useAuth();

  const [rows, setRows] = useState<SolicitudCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({ ciudad: '', courier: '', estado: '' });

  // cargar
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchSolicitudesCourier(token);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // handlers filtros
  const handleChangeFiltro = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((s) => ({ ...s, [name]: value }));
  };
  const limpiarFiltros = () => setFiltros({ ciudad: '', courier: '', estado: '' });

  // listas únicas
  const ciudades = useMemo(
    () => Array.from(new Set(rows.map((r) => r.ciudad).filter(Boolean))),
    [rows]
  );
  const couriersUnicos = useMemo(
    () => Array.from(new Set(rows.map((r) => r.courier).filter(Boolean))),
    [rows]
  );
  const estados = useMemo(() => ['Asociado', 'No asociado'], []);

  // aplicar filtros
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filtros.ciudad || r.ciudad === filtros.ciudad) &&
          (!filtros.courier || r.courier === filtros.courier) &&
          (!filtros.estado || r.estado === filtros.estado)
      ),
    [rows, filtros]
  );

  // acciones
  const onAssociate = async (uuid: string) => {
    if (!token) return;
    await cambiarEstadoCourier(token, uuid, 'asociar');
    await load();
  };
  const onDesassociate = async (uuid: string) => {
    if (!token) return;
    await cambiarEstadoCourier(token, uuid, 'desasociar');
    await load();
  };

  return (
    <div className="mt-8">
      <Tittlex
        title="Panel de Control"
        description="Monitoreo de asociación con couriers por ciudades"
      />
      <div className="flex flex-col gap-4">
        <FilterPanelAdmin
          filtros={filtros}
          ciudades={ciudades}
          couriersUnicos={couriersUnicos}
          estados={estados}
          handleChangeFiltro={handleChangeFiltro}
          limpiarFiltros={limpiarFiltros}
        />
        <TablePanelAdmin
          loading={loading}
          data={filtered}
          onAssociate={onAssociate}
          onDesassociate={onDesassociate}
        />
      </div>
    </div>
  );
}
