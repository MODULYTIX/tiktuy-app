import { useContext, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

import { AuthContext } from '@/auth/context/AuthContext';

import type { RepartidorVista, PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

import ModalRepartidorMotorizado from '@/shared/components/repartidor/Pedido/ModalPedidoRepartidor';
import ModalEntregaRepartidor from '@/shared/components/repartidor/Pedido/ModalPedidoPendienteRepartidor';

// APIs
import { patchEstadoInicial, patchResultado } from '@/services/repartidor/pedidos/pedidos.api';

import TablePedidosHoy from '@/shared/components/repartidor/Pedido/TablePedidosHoy';
import TablePedidosPendientes from '@/shared/components/repartidor/Pedido/TablePedidosPendientes';
import TablePedidosTerminados from '@/shared/components/repartidor/Pedido/TablePedidosTerminados';

type VistaUI = 'asignados' | 'pendientes' | 'terminados';
const toRepartidorVista = (v: VistaUI): RepartidorVista => (v === 'asignados' ? 'hoy' : v);

export default function PedidosPage() {
  const auth = useContext(AuthContext);
  const token = auth?.token ?? '';

  const [vista, setVista] = useState<VistaUI>(() => {
    const saved = localStorage.getItem('repartidor_vista_pedidos') as VistaUI | null;
    return saved ?? 'asignados';
  });
  useEffect(() => {
    localStorage.setItem('repartidor_vista_pedidos', vista);
  }, [vista]);

  // ===== modal "cambiar estado inicial" (asignados/hoy)
  const [openModalCambio, setOpenModalCambio] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoListItem | null>(null);

  // ===== modal "finalizar entrega" (pendientes)
  const [openModalEntrega, setOpenModalEntrega] = useState(false);
  const [pedidoEntrega, setPedidoEntrega] = useState<PedidoListItem | null>(null);

  const handleVerDetalle = (id: number) => {
    console.log('[Repartidor] Ver detalle pedido', id);
  };

  // según la vista activa, decide qué modal abrir
  const handleCambiarEstado = (pedido: PedidoListItem) => {
    if (vista === 'pendientes') {
      setPedidoEntrega(pedido);
      setOpenModalEntrega(true);
    } else {
      setPedidoSeleccionado(pedido);
      setOpenModalCambio(true);
    }
  };

  // Guardar resultado inicial (asignados/hoy)
  async function handleConfirmResultado(payload: {
    pedidoId: number;
    resultado: 'RECEPCION_HOY' | 'NO_RESPONDE' | 'REPROGRAMADO' | 'ANULO';
    fecha_nueva?: string;
    observacion?: string | null;
  }) {
    try {
      await patchEstadoInicial(token, payload.pedidoId, {
        resultado: payload.resultado,
        fecha_nueva: payload.fecha_nueva,
        observacion: payload.observacion ?? undefined,
      });
      // cerrar modal si todo ok
      setOpenModalCambio(false);
      setPedidoSeleccionado(null);
    } catch (err) {
      console.error('Error al actualizar estado inicial:', err);
      alert((err as Error).message);
      // NO cierro el modal para que el usuario pueda reintentar
    }
  }

  // Guardar resultado final (pendientes)
  async function handleConfirmEntrega(
    data:
      | { pedidoId: number; resultado: 'RECHAZADO'; observacion?: string }
      | {
          pedidoId: number;
          resultado: 'ENTREGADO';
          metodo: 'EFECTIVO' | 'BILLETERA' | 'DIRECTO_ECOMMERCE';
          observacion?: string;
          evidenciaFile?: File;
        }
  ) {
    try {
      if (data.resultado === 'RECHAZADO') {
        await patchResultado(token, data.pedidoId, {
          resultado: 'RECHAZADO',
          observacion: data.observacion,
        });
      } else {
        const obs = [
          data.observacion?.trim(),
          data.metodo ? `[Pago: ${data.metodo}]` : undefined,
        ]
          .filter(Boolean)
          .join(' | ');

        await patchResultado(token, data.pedidoId, {
          resultado: 'ENTREGADO',
          observacion: obs || undefined,
          evidenciaFile: data.evidenciaFile,
        });
      }

      // cerrar modal si todo ok
      setOpenModalEntrega(false);
      setPedidoEntrega(null);
    } catch (err: any) {
      // Agregado: detección específica del 404 del endpoint inexistente
      const isResp = typeof err === 'object' && err !== null && 'message' in err;
      console.error('Error al guardar resultado final:', err);

      // Si tu helper `handle` lanzó con mensaje genérico, mostramos algo más claro:
      if (isResp && String(err.message).includes('Error al actualizar el resultado del pedido')) {
        alert(
          'No se encontró el endpoint /repartidor-pedidos/:id/resultado (404).\n' +
          'Debes implementarlo en el backend o ajustar la llamada del frontend.'
        );
      } else {
        alert(String(err?.message || 'Error al actualizar el resultado del pedido'));
      }

      // Importante: NO cierres el modal para permitir reintentar
    }
  }

  const view = toRepartidorVista(vista);

  return (
    <section className="mt-4 md:mt-8">
      {/* ===== MOBILE HEADER (< md) ===== */}
      <div className="block md:hidden text-center px-3">
        <h1 className="text-3xl font-bold text-[#1E3A8A]">Gestión de Pedidos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Administra y visualiza el estado de tus pedidos en cada etapa del proceso
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 max-w-xs mx-auto">
          <button
            onClick={() => setVista('asignados')}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              vista === 'asignados' ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
            }`}
          >
            <Icon icon="solar:bill-list-broken" width={18} height={18} />
            Asignados
          </button>

          <button
            onClick={() => setVista('pendientes')}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              vista === 'pendientes' ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
            }`}
          >
            <Icon icon="mdi:clock-outline" width={18} height={18} />
            Pendientes
          </button>

          <button
            onClick={() => setVista('terminados')}
            className={` inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              vista === 'terminados' ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
            }`}
          >
            <Icon icon="mdi:clipboard-check-outline" width={18} height={18} />
            Terminado
          </button>
        </div>
      </div>

      {/* ===== DESKTOP HEADER (≥ md) ===== */}
      <div className="hidden md:flex md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mis Pedidos</h1>
          <p className="text-gray-500">Revisa tus pedidos asignados, gestiona pendientes y finalizados.</p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setVista('asignados')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'asignados' ? 'bg-primaryDark text-white' : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <Icon icon="solar:bill-list-broken" width={20} height={20} />
            <span>Asignados (Hoy)</span>
          </button>

          <span className="block h-8 w-[1px] bg-gray-300" />

          <button
            onClick={() => setVista('pendientes')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'pendientes' ? 'bg-primaryDark text-white' : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <Icon icon="mdi:clock-outline" width={20} height={20} />
            <span>Pendientes</span>
          </button>

          <span className="block h-8 w-[1px] bg-gray-300" />

          <button
            onClick={() => setVista('terminados')}
            className={`flex items-center px-4 py-2 rounded-sm gap-2 text-sm font-medium ${
              vista === 'terminados' ? 'bg-primaryDark text-white' : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}
          >
            <Icon icon="mdi:clipboard-check-outline" width={20} height={20} />
            <span>Terminados</span>
          </button>
        </div>
      </div>

      {/* Tablas separadas */}
      <div className="my-6 md:my-8 ">
        {view === 'hoy' && (
          <TablePedidosHoy token={token} onVerDetalle={handleVerDetalle} onCambiarEstado={handleCambiarEstado} />
        )}
        {view === 'pendientes' && (
          <TablePedidosPendientes token={token} onVerDetalle={handleVerDetalle} onCambiarEstado={handleCambiarEstado} />
        )}
        {view === 'terminados' && (
          <TablePedidosTerminados token={token} onVerDetalle={handleVerDetalle} onCambiarEstado={handleCambiarEstado} />
        )}
      </div>

      {/* === MODAL ESTADO INICIAL (asignados/hoy) === */}
      <ModalRepartidorMotorizado
        isOpen={openModalCambio}
        onClose={() => {
          setOpenModalCambio(false);
          setPedidoSeleccionado(null);
        }}
        pedido={pedidoSeleccionado}
        onConfirm={handleConfirmResultado}
      />

      {/* === MODAL FINALIZAR ENTREGA (pendientes) === */}
      <ModalEntregaRepartidor
        isOpen={openModalEntrega}
        onClose={() => {
          setOpenModalEntrega(false);
          setPedidoEntrega(null);
        }}
        pedido={pedidoEntrega}
        onConfirm={handleConfirmEntrega}
      />
    </section>
  );
}
