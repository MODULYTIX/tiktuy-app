import TableZonaCourier from '@/shared/components/courier/zona/TableZonaCourier';
import ZonaFilterCourier from '@/shared/components/courier/zona/ZonaFilterCourier';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function ZonasPage() {
  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            Zonas de Atención
          </h1>
          <p className="text-gray-500">Tarifas y pagos por zona.</p>
        </div>
        <div className="flex items-end">
          <button className="flex gap-2 items-center bg-primaryDark text-white px-3 py-2 rounded-sm">
            <Icon icon="iconoir:new-tab" width="24" height="24" />
            <span>Nuevo Distrito de Atención</span>
          </button>
        </div>
      </div>
      <div className="my-8">
        <ZonaFilterCourier />
      </div>
      <div>
        <TableZonaCourier />
      </div>
    </section>
  );
}
