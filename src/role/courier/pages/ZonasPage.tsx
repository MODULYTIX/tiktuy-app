import { useState, useCallback } from "react";
import { Icon } from "@iconify/react";

import TableZonaMine from "@/shared/components/courier/zona/TableZonaMine";
import ZonaFilterCourier from "@/shared/components/courier/zona/ZonaFilterCourier";
import NewZonaTarifariaDrawer from "@/shared/components/courier/zona/NewZonaTarifariaDrawer";
import EditZonaTarifariaDrawer from "@/shared/components/courier/zona/EditZonaTarifariaDrawer";
import type { ZonaTarifaria } from "@/services/courier/zonaTarifaria/zonaTarifaria.types";

export default function ZonasPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState<ZonaTarifaria | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado del filtro (controlado aquí)
  const [distrito, setDistrito] = useState<string>("");
  const [zona, setZona] = useState<string>("");

  // Opciones dinámicas derivadas de los datos reales
  const [distritosOptions, setDistritosOptions] = useState<string[]>([]);
  const [zonasOptions, setZonasOptions] = useState<string[]>([]);

  const handleLoadedMeta = useCallback(
    (meta: { distritos: string[]; zonas: string[] }) => {
      setDistritosOptions(meta.distritos);
      setZonasOptions(meta.zonas);
      // Mantener selección actual si sigue existiendo en las nuevas opciones;
      // si no existe, limpiamos ese filtro para evitar estados inválidos.
      setDistrito((prev) => (meta.distritos.includes(prev) ? prev : ""));
      setZona((prev) => (meta.zonas.includes(prev) ? prev : ""));
    },
    []
  );

  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Zonas de Atención</h1>
          <p className="text-gray-500">Listado y creación por tu usuario (mías).</p>
        </div>

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
          distrito={distrito}
          zona={zona}
          distritosOptions={distritosOptions}
          zonasOptions={zonasOptions}
          onChange={({ distrito: d, zona: z }) => {
            setDistrito(d);
            setZona(z);
          }}
          onClear={() => {
            setDistrito("");
            setZona("");
          }}
        />
      </div>

      <div>
        <TableZonaMine
          key={refreshKey} // se mantiene tu patrón
          filters={{ distrito, zona }}
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
        defaultEstadoId={1}
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
