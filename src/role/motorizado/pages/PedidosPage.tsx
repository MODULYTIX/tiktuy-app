// src/pages/motorizado/PedidosPage.tsx
import { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

import { AuthContext } from '@/auth/context/AuthContext';
import TablePedidoRepartidor from '@/shared/components/repartidor/TablePedidoRepartidor';

import type { RepartidorVista, PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

type VistaUI = 'asignados' | 'pendientes' | 'terminados';

// Mapeo para el componente (TablePedidoRepartidor usa 'hoy' en lugar de 'asignados')
const toRepartidorVista = (v: VistaUI): RepartidorVista => (v === 'asignados' ? 'hoy' : v);

export default function PedidosPage() {
  // Evitamos desestructurar porque el contexto puede ser undefined
  const auth = useContext(AuthContext);
  const token = auth?.token ?? '';

  const [vista, setVista] = useState<VistaUI>(() => {
    const saved = localStorage.getItem('repartidor_vista_pedidos') as VistaUI | null;
    return saved ?? 'asignados';
  });

  useEffect(() => {
    localStorage.setItem('repartidor_vista_pedidos', vista);
  }, [vista]);

  // Callbacks opcionales para futuros modales
  const handleVerDetalle = (id: number) => {
    console.log('[Repartidor] Ver detalle pedido', id);
  };

  // La tabla espera (pedido: PedidoListItem) => void
  const handleCambiarEstado = (pedido: PedidoListItem) => {
    console.log('[Repartidor] Cambiar estado pedido', pedido.id);
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mis Pedidos</h1>
          <p className="text-gray-500">
            Revisa tus pedidos asignados, gestiona pendientes y finalizados.
          </p>
        </div>

        {/* Tabs */}
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
            <span>Asignados (Hoy)</span>
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

      {/* Tabla */}
      <div className="my-8">
        <TablePedidoRepartidor
          view={toRepartidorVista(vista)}
          token={token}
          onVerDetalle={handleVerDetalle}
          onCambiarEstado={handleCambiarEstado}
        />
      </div>
    </section>
  );
}
