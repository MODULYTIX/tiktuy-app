// src/pages/courier/PedidosPage.tsx
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import TablePedidoCourier from '@/shared/components/courier/pedido/TablePedidoCourier';
import { useAuth } from '@/auth/context';
import AsignarRepartidor from '@/shared/components/courier/pedido/AsignarRepartidor';

type Vista = 'asignados' | 'pendientes' | 'terminados';

export default function PedidosPage() {
  const { token } = useAuth();

  // pestaña activa (persistida)
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
    <section className="mt-8 flex flex-col gap-[1.25rem]">
      {/* Header con tabs (modelo base) */}
      <div className="flex justify-between items-end pb-5 border-b border-gray30">
        <div className="flex flex-col gap-1">
          <h1 className="text-[1.75rem] font-bold text-primary">Gestión de Pedidos</h1>
          <p className="text-gray60">
            Administra y visualiza el estado de tus pedidos en cada etapa del proceso
          </p>
        </div>

        {/* Tabs: Asignados / Pendientes / Terminados */}
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setVista('asignados')}
            className={[
              'flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium',
              vista === 'asignados'
                ? 'bg-primaryDark text-white'
                : 'bg-gray20 text-primaryDark hover:shadow-default',
            ].join(' ')}
          >
            <Icon icon="solar:bill-list-broken" width={18} height={18} />
            <span>Asignados</span>
          </button>

          <span className="w-[1px] h-10 bg-gray40" />

          <button
            onClick={() => setVista('pendientes')}
            className={[
              'flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium',
              vista === 'pendientes'
                ? 'bg-primaryDark text-white'
                : 'bg-gray20 text-primaryDark hover:shadow-default',
            ].join(' ')}
          >
            <Icon icon="mdi:clock-outline" width={18} height={18} />
            <span>Pendientes</span>
          </button>

          <span className="w-[1px] h-10 bg-gray40" />

          <button
            onClick={() => setVista('terminados')}
            className={[
              'flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium',
              vista === 'terminados'
                ? 'bg-primaryDark text-white'
                : 'bg-gray20 text-primaryDark hover:shadow-default',
            ].join(' ')}
          >
            <Icon icon="mdi:clipboard-check-outline" width={18} height={18} />
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