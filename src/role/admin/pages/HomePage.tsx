import { useEffect, useMemo, useState, useCallback } from "react";
import Tittlex from "@/shared/common/Tittlex";
import FilterPanelAdmin from "@/shared/components/admin/panel/FilterPanelAdmin";
import TablePanelAdmin from "@/shared/components/admin/panel/TablePanelAdmin";
import TablePanelAdminEcommerce from "@/shared/components/admin/panel/TablePanelAdminEcommerce";
import { useAuth } from "@/auth/context/useAuth";

// Courier
import type {
  SolicitudCourier,
  SolicitudCourierCompleto,
} from "@/role/user/service/solicitud-courier.types";
import {
  cambiarEstadoCourier,
  fetchSolicitudesCourier,
  fetchSolicitudesCourierCompleto,
} from "@/role/user/service/solitud-courier.api";

// Ecommerce
import type { SolicitudEcommerce } from "@/role/user/service/solicitud-ecommerce.types";
import {
  fetchSolicitudesEcommerce,
  cambiarEstadoEcommerce,
} from "@/role/user/service/solitud-courier.api";
import Buttonx from "@/shared/common/Buttonx";

type Filtros = { ciudad: string; courier: string; estado: string };
type Tab = "courier" | "ecommerce";

export default function AdminHomePage() {
  const { token } = useAuth();

  const [tab, setTab] = useState<Tab>("courier");

  // Data
  const [rowsCourier, setRowsCourier] = useState<SolicitudCourier[]>([]);
  const [rowsCourierCompleto, setRowsCourierCompleto] = useState<
    SolicitudCourierCompleto[]
  >([]); // ✅ ya existía
  const [rowsEcom, setRowsEcom] = useState<SolicitudEcommerce[]>([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    ciudad: "",
    courier: "",
    estado: "",
  });

  // cargar según pestaña
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (tab === "courier") {
        const data = await fetchSolicitudesCourier(token);
        setRowsCourier(data);

        const dataCompleto = await fetchSolicitudesCourierCompleto(token);
        setRowsCourierCompleto(dataCompleto);
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
  const limpiarFiltros = () =>
    setFiltros({ ciudad: "", courier: "", estado: "" });

  // listas únicas (dependen de la pestaña)
  const ciudades = useMemo(() => {
    const base =
      tab === "courier"
        ? rowsCourier.map((r) => r.ciudad)
        : rowsEcom.map((r) => r.ciudad);
    return Array.from(new Set(base.filter(Boolean)));
  }, [rowsCourier, rowsEcom, tab]);

  const couriersUnicos = useMemo(() => {
    const base =
      tab === "courier"
        ? rowsCourier.map((r) => r.courier)
        : rowsEcom.map((r) => r.ecommerce); // en ecom el nombre va en "ecommerce"
    return Array.from(new Set(base.filter(Boolean)));
  }, [rowsCourier, rowsEcom, tab]);

  const estados = useMemo(() => ["Asociado", "No asociado"], []);

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
          (!filtros.estado || (r.estado ?? "") === filtros.estado)
      ),
    [rowsEcom, filtros]
  );

  // acciones
  const onAssociate = async (uuid: string) => {
    if (!token) return;
    if (tab === "courier") {
      const r = await cambiarEstadoCourier(token, uuid, "asociar");
      await load();
      return r
        ? { passwordSetupUrl: r.passwordSetupUrl ?? undefined }
        : undefined;
    } else {
      const r = await cambiarEstadoEcommerce(token, uuid, "asociar");
      await load();
      return r
        ? { passwordSetupUrl: r.passwordSetupUrl ?? undefined }
        : undefined;
    }
  };

  const onDesassociate = async (uuid: string) => {
    if (!token) return;
    if (tab === "courier") {
      await cambiarEstadoCourier(token, uuid, "desasociar");
    } else {
      await cambiarEstadoEcommerce(token, uuid, "desasociar");
    }
    await load();
  };

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <Tittlex
          title="Panel de Control"
          description={
            tab === "courier"
              ? "Monitoreo de asociación con couriers por ciudades"
              : "Monitoreo de solicitudes de ecommerces"
          }
        />

        {/* Botonera */}
        <div className="flex items-center gap-3">
          <Buttonx
            label="Courier"
            icon="mdi:package-variant-closed"
            title="Ver solicitudes de Courier"
            variant={tab === "courier" ? "secondary" : "tertiary"}
            onClick={() => {
              setTab("courier");
              limpiarFiltros();
            }}
          />

          <div className="w-px h-10 bg-gray-200" />

          <Buttonx
            label="Ecommerce"
            icon="mdi:storefront-outline"
            title="Ver solicitudes de Ecommerce"
            variant={tab === "ecommerce" ? "secondary" : "tertiary"}
            onClick={() => {
              setTab("ecommerce");
              limpiarFiltros();
            }}
          />
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

        {tab === "courier" ? (
          <TablePanelAdmin
            loading={loading}
            data={filteredCourier}
            dataCompleta={rowsCourierCompleto}
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
