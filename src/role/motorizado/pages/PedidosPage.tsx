// src/pages/motorizado/PedidosPage.tsx
import { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

import { AuthContext } from '@/auth/context/AuthContext';
import TablePedidoRepartidor from '@/shared/components/repartidor/TablePedidoRepartidor';

type Vista = 'asignados' | 'pendientes' | 'terminados';

export default function PedidosPage() {
  const { token } = useContext(AuthContext);

  const [vista, setVista] = useState<Vista>(() => {
    const saved = localStorage.getItem('repartidor_vista_pedidos') as Vista | null;
    return saved ?? 'asignados';
  });

  useEffect(() => {
    localStorage.setItem('repartidor_vista_pedidos', vista);
  }, [vista]);

  // Callbacks opcionales para futuros modales
  const handleVerDetalle = (id: number) => {
    console.log('[Repartidor] Ver detalle pedido', id);
  };

  const handleCambiarEstado = (id: number) => {
    console.log('[Repartidor] Cambiar estado pedido', id);
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
          view={vista}
          token={token ?? ''}
          onVerDetalle={handleVerDetalle}
          onCambiarEstado={handleCambiarEstado}
        />
      </div>
    </section>
  );
}
