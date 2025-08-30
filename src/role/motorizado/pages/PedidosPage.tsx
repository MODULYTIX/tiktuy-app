import { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

import { AuthContext } from '@/auth/context/AuthContext';

import type {
  RepartidorVista,
  PedidoListItem,
} from '@/services/repartidor/pedidos/pedidos.types';
import TablePedidoRepartidor from '@/shared/components/repartidor/TablePedidoRepartidor';
import ModalRepartidorMotorizado from '@/shared/components/repartidor/Pedido/ModalPedidoRepartidor';

// importa la API correcta
import { patchEstadoInicial } from '@/services/repartidor/pedidos/pedidos.api';

type VistaUI = 'asignados' | 'pendientes' | 'terminados';
const toRepartidorVista = (v: VistaUI): RepartidorVista =>
  v === 'asignados' ? 'hoy' : v;

export default function PedidosPage() {
  const auth = useContext(AuthContext);
  const token = auth?.token ?? '';

  const [vista, setVista] = useState<VistaUI>(() => {
    const saved = localStorage.getItem(
      'repartidor_vista_pedidos'
    ) as VistaUI | null;
    return saved ?? 'asignados';
  });
  useEffect(() => {
    localStorage.setItem('repartidor_vista_pedidos', vista);
  }, [vista]);

  // === estado del modal ===
  const [openModalCambio, setOpenModalCambio] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<PedidoListItem | null>(null);

  const handleVerDetalle = (id: number) => {
    console.log('[Repartidor] Ver detalle pedido', id);
  };

  // Abre el modal con el pedido clickeado
  const handleCambiarEstado = (pedido: PedidoListItem) => {
    console.log('[Repartidor] Cambiar estado pedido', pedido.id);
    setPedidoSeleccionado(pedido);
    setOpenModalCambio(true);
  };

  // Guardar resultado -> conecta con backend
  async function handleConfirmResultado(payload: {
    pedidoId: number;
    resultado: 'RECEPCION_HOY' | 'NO_RESPONDE' | 'REPROGRAMADO' | 'ANULO';
    fecha_nueva?: string;
    observacion?: string | null;
  }) {
    try {
      console.log('[Repartidor] Guardar resultado', payload);

      // 🔄 Mapeo a lo que espera el backend
      const mapResultado: Record<
        'RECEPCION_HOY' | 'NO_RESPONDE' | 'REPROGRAMADO' | 'ANULO',
        'RECEPCION_HOY' | 'NO_RESPONDE' | 'REPROGRAMADO' | 'ANULO'
      > = {
        RECEPCION_HOY: 'RECEPCION_HOY',
        NO_RESPONDE: 'NO_RESPONDE',
        REPROGRAMADO: 'REPROGRAMADO',
        ANULO: 'ANULO',
      };

      await patchEstadoInicial(token, payload.pedidoId, {
        resultado: mapResultado[payload.resultado],
        fecha_nueva: payload.fecha_nueva,
        observacion: payload.observacion ?? undefined,
      });
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert((err as Error).message);
    } finally {
      setOpenModalCambio(false);
    }
  }

  return (
    <section className="mt-4 md:mt-8">
      {/* ===== MOBILE HEADER (< md) ===== */}
      <div className="block md:hidden text-center px-3">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">
          Gestión de Pedidos
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Administra y visualiza el estado de tus pedidos en cada etapa del
          proceso
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 max-w-xs mx-auto">
          <button
            onClick={() => setVista('asignados')}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              vista === 'asignados'
                ? 'bg-[#0F172A] text-white'
                : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
            }`}>
            <Icon icon="solar:bill-list-broken" width={18} height={18} />
            Asignados
          </button>

          <button
            onClick={() => setVista('pendientes')}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              vista === 'pendientes'
                ? 'bg-[#0F172A] text-white'
                : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
            }`}>
            <Icon icon="mdi:clock-outline" width={18} height={18} />
            Pendientes
          </button>

          <button
            onClick={() => setVista('terminados')}
            className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              vista === 'terminados'
                ? 'bg-[#0F172A] text-white'
                : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
            }`}>
            <Icon icon="mdi:clipboard-check-outline" width={18} height={18} />
            Terminado
          </button>
        </div>
      </div>

      {/* ===== DESKTOP HEADER (≥ md) ===== */}
      <div className="hidden md:flex md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mis Pedidos</h1>
          <p className="text-gray-500">
            Revisa tus pedidos asignados, gestiona pendientes y finalizados.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setVista('asignados')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'asignados'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}>
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
            }`}>
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
            }`}>
            <Icon icon="mdi:clipboard-check-outline" width={20} height={20} />
            <span>Terminados</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="my-6 md:my-8 ">
        <TablePedidoRepartidor
          view={toRepartidorVista(vista)}
          token={token}
          onVerDetalle={handleVerDetalle}
          onCambiarEstado={handleCambiarEstado}
        />
      </div>

      {/* === RENDER DEL MODAL === */}
      <ModalRepartidorMotorizado
        isOpen={openModalCambio}
        onClose={() => setOpenModalCambio(false)}
        pedido={pedidoSeleccionado}
        onConfirm={handleConfirmResultado}
      />
    </section>
  );
}
