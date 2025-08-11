import { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AuthContext } from '@/auth/context/AuthContext';
import TablePedidoCourier from '@/shared/components/courier/pedido/TablePedidoCourier';
import AsignarRepartidor from '@/shared/components/courier/pedido/asignarRepartidor';

type Vista = 'asignados' | 'pendientes' | 'terminados';

export default function PedidosPage() {
  const { token } = useContext(AuthContext);

  // pestaña activa
  const [vista, setVista] = useState<Vista>(() => {
    const saved = localStorage.getItem('courier_vista_pedidos') as Vista | null;
    return saved ?? 'asignados';
  });

  // forzar recarga de la tabla después de asignar
  const [reloadKey, setReloadKey] = useState(0);

  // modal asignación
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    localStorage.setItem('courier_vista_pedidos', vista);
  }, [vista]);

  const handleVerDetalle = (id: number) => {
    // aquí podrías abrir un modal de detalle
    console.log('Ver detalle pedido', id);
  };

  // recibe los IDs seleccionados desde la tabla y abre el modal
  const handleAbrirAsignar = (ids: number[]) => {
    setSelectedIds(ids);
    setModalOpen(true);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setSelectedIds([]);
  };

  const handleAssigned = () => {
    // refresca la tabla tras asignar
    setReloadKey((k) => k + 1);
  };

  return (
    <section className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestión de Pedidos</h1>
          <p className="text-gray-500">
            Administra y visualiza el estado de tus pedidos en cada etapa del proceso
          </p>
        </div>

        {/* Tabs: Asignados / Pendientes / Terminados */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setVista('asignados')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'asignados'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <Icon icon="solar:bill-list-broken" width={20} height={20} />
            <span>Asignados</span>
          </button>

          <span className="block h-8 w-[1px] bg-gray-300" />

          <button
            onClick={() => setVista('pendientes')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'pendientes'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <Icon icon="mdi:clock-outline" width={20} height={20} />
            <span>Pendientes</span>
          </button>

          <span className="block h-8 w-[1px] bg-gray-300" />

          <button
            onClick={() => setVista('terminados')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'terminados'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <Icon icon="mdi:clipboard-check-outline" width={20} height={20} />
            <span>Terminados</span>
          </button>
        </div>
      </div>

      {/* Tabla (se vuelve a montar cuando cambia reloadKey) */}
      <div className="my-2">
        <TablePedidoCourier
          key={reloadKey}
          view={vista}
          token={token ?? ''}
          onVerDetalle={handleVerDetalle}
          onAsignar={handleAbrirAsignar}
        />
      </div>

      {/* Modal Asignar Repartidor */}
      <AsignarRepartidor
        open={modalOpen}
        onClose={handleCerrarModal}
        token={token ?? ''}
        selectedIds={selectedIds}
        onAssigned={handleAssigned}
      />
    </section>
  );
}
