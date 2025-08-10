import TablePedidoCourier from '@/shared/components/courier/pedido/TablePedidoCourier';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function PedidosPage() {
  return (
    <section className="mt-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Gestion de Pedidos
            </h1>
            <p className="text-gray-500">
              Administra y visualiza el estado de tus pedidos en cada etapa del
              proceso
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div>
              <button className="flex items-center px-4 py-2  bg-primaryDark text-white rounded-sm gap-2">
                <Icon icon="ri:ai-generate" width="22" height="22" />
                <span>Generado</span>
              </button>
            </div>
            <span className="block h-8 w-[1px] bg-gray-500"></span>
            <div>
              <button className="flex items-center px-4 py-2  bg-primaryDark text-white rounded-sm gap-2">
                <Icon icon="solar:bill-list-broken" width="22" height="22" />
                <span>Asignado</span>
              </button>
            </div>
            <span className="block h-8 w-[1px] bg-gray-500"></span>
            <div>
              <button className="flex items-center px-4 py-2  bg-primaryDark text-white rounded-sm gap-2">
                <Icon icon="carbon:task-complete" width="24" height="24" />
                <span>Completado</span>
              </button>
            </div>
          </div>
        </div>
        <div className="my-8">
          <TablePedidoCourier />
        </div>
      </div>
    </section>
  );
}
