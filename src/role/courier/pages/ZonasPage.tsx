// src/role/courier/pages/ZonasPage.tsx
import { useState } from "react";
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
        <ZonaFilterCourier />
      </div>

      <div>
        <TableZonaMine
          key={refreshKey}
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
