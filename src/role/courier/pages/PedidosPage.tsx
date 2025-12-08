// src/pages/courier/PedidosPage.tsx
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import TablePedidoCourier from '@/shared/components/courier/pedido/TablePedidoCourier';
import { useAuth } from '@/auth/context';
import AsignarRepartidor from '@/shared/components/courier/pedido/AsignarRepartidor';
import ReasignarRepartidorModal from '@/shared/components/courier/pedido/ReasignarRepartidorModal';
import type { PedidoListItem } from '@/services/courier/pedidos/pedidos.types';
import Tittlex from '@/shared/common/Tittlex';

type Vista = 'asignados' | 'pendientes' | 'terminados';

export default function PedidosPage() {
  const { token } = useAuth();

  // pestaña activa (persistida)
  const [vista, setVista] = useState<Vista>(() => {
    const saved = localStorage.getItem('courier_vista_pedidos') as Vista | null;
    return saved ?? 'asignados';
  });

  // forzar recarga de la tabla después de asignar / reasignar
  const [reloadKey, setReloadKey] = useState(0);

  // modal asignación (en lote)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // modal REASIGNAR (individual)
  const [modalReasignarOpen, setModalReasignarOpen] = useState(false);
  const [pedidoAReasignar, setPedidoAReasignar] = useState<PedidoListItem | null>(null);

  useEffect(() => {
    localStorage.setItem('courier_vista_pedidos', vista);
  }, [vista]);

  // ---- Asignar (en lote) ----
  const handleAbrirAsignar = (ids: number[]) => {
    setSelectedIds(ids);
    setModalOpen(true);
  };
  const handleCerrarAsignar = () => {
    setModalOpen(false);
    setSelectedIds([]);
  };
  const handleAssigned = () => setReloadKey((k) => k + 1);

  // ---- Reasignar (individual) ----
  const handleAbrirReasignar = (pedido: PedidoListItem) => {
    setPedidoAReasignar(pedido);
    setModalReasignarOpen(true);
  };
  const handleCerrarReasignar = () => {
    setModalReasignarOpen(false);
    setPedidoAReasignar(null);
  };
  const handleReassigned = () => setReloadKey((k) => k + 1);

  return (
    <section className="mt-8 flex flex-col gap-[1.25rem]">
      {/* Header con tabs */}
      <div className="flex justify-between items-end pb-5 border-b border-gray30">
        <Tittlex
          title="Gestión de Pedidos"
          description="Administra y visualiza el estado de tus pedidos en cada etapa del proceso"
        />

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setVista('asignados')}
            className={[
              'flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium',
              vista === 'asignados' ? 'bg-primaryDark text-white' : 'bg-gray20 text-primaryDark hover:shadow-default',
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
              vista === 'pendientes' ? 'bg-primaryDark text-white' : 'bg-gray20 text-primaryDark hover:shadow-default',
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
              vista === 'terminados' ? 'bg-primaryDark text-white' : 'bg-gray20 text-primaryDark hover:shadow-default',
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
          onAsignar={handleAbrirAsignar}
          // 👇 IMPORTANTÍSIMO: pásale este callback para abrir el modal y NO usar window.prompt
          onReasignar={handleAbrirReasignar}
        />
      </div>

      {/* Modal Asignar Repartidor (lote) */}
      <AsignarRepartidor
        open={modalOpen}
        onClose={handleCerrarAsignar}
        token={token ?? ''}
        selectedIds={selectedIds}
        onAssigned={handleAssigned}
      />

      {/* Modal Reasignar Repartidor (uno) */}
      {pedidoAReasignar && (
        <ReasignarRepartidorModal
          open={modalReasignarOpen}
          token={token ?? ''}
          pedido={pedidoAReasignar}
          motorizados={[]}              // opcional; si tu modal los carga solo, deja []
          onClose={handleCerrarReasignar}
          onSuccess={handleReassigned}
        />
      )}
    </section>
  );
}
