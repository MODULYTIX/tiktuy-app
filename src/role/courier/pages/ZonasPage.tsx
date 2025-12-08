import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";

import TableZonaMine from "@/shared/components/courier/zona/TableZonaMine";
import ZonaFilterCourier from "@/shared/components/courier/zona/ZonaFilterCourier";
import NewZonaTarifariaDrawer from "@/shared/components/courier/zona/NewZonaTarifariaDrawer";
import EditZonaTarifariaDrawer from "@/shared/components/courier/zona/EditZonaTarifariaDrawer";
import type { ZonaTarifaria } from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import Tittlex from "@/shared/common/Tittlex";

export default function ZonasPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState<ZonaTarifaria | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado del filtro (ciudad / zona)
  const [ciudad, setCiudad] = useState<string>("");
  const [zona, setZona] = useState<string>("");

  // Opciones dinámicas derivadas de los datos reales
  const [ciudadesOptions, setCiudadesOptions] = useState<string[]>([]);
  const [zonasOptions, setZonasOptions] = useState<string[]>([]);

  // Meta que viene de TableZonaMine (usa 'distritos' pero en UI es ciudad)
  const handleLoadedMeta = useCallback(
    (meta: { distritos: string[]; zonas: string[] }) => {
      setCiudadesOptions(meta.distritos); // distritos == ciudades en UI
      setZonasOptions(meta.zonas);

      // Mantener selección actual si sigue existiendo en las nuevas opciones
      setCiudad((prev) => (meta.distritos.includes(prev) ? prev : ""));
      setZona((prev) => (meta.zonas.includes(prev) ? prev : ""));
    },
    []
  );

  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <Tittlex
          title="Zonas de Atención"
          description="Listado y creación de zonas asociadas a tu usuario (todas las sedes de tu
            courie"
        />

        <div className="flex items-end">
          <button
            className="flex gap-2 items-center bg-primaryDark text-white px-3 py-2 rounded-sm"
            onClick={() => setDrawerOpen(true)}
          >
            <Icon icon="iconoir:new-tab" width="24" height="24" />
            <span>Nuevo Distrito de Atención</span>
          </button>
        </div>
      </div>

      <div className="my-8">
        <ZonaFilterCourier
          ciudad={ciudad}
          zona={zona}
          ciudadesOptions={ciudadesOptions}
          zonasOptions={zonasOptions}
          onChange={({ ciudad: c, zona: z }) => {
            setCiudad(c);
            setZona(z);
          }}
          onClear={() => {
            setCiudad("");
            setZona("");
          }}
        />
      </div>

      <div>
        <TableZonaMine
          key={refreshKey}
          // filtro por la ciudad (en BD es campo distrito)
          filters={{ ciudad, zona }}
          onLoadedMeta={handleLoadedMeta}
          onEdit={(z) => {
            setSelectedZona(z);
            setEditOpen(true);
          }}
        />
      </div>

      {/* Crear */}
      <NewZonaTarifariaDrawer
        open={drawerOpen}
        zonasOpciones={["1", "2", "3", "4", "5", "6"]}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Editar */}
      <EditZonaTarifariaDrawer
        open={editOpen}
        zona={selectedZona}
        zonasOpciones={["1", "2", "3", "4", "5", "6"]}
        onClose={() => {
          setEditOpen(false);
          setSelectedZona(null);
        }}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </section>
  );
}
