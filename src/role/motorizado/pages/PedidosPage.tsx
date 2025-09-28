import { useContext, useEffect, useState } from 'react';

import { AuthContext } from '@/auth/context/AuthContext';
import type { RepartidorVista, PedidoListItem } from '@/services/repartidor/pedidos/pedidos.types';

import ModalRepartidorMotorizado from '@/shared/components/repartidor/Pedido/ModalPedidoRepartidor';
import ModalEntregaRepartidor from '@/shared/components/repartidor/Pedido/ModalPedidoPendienteRepartidor';
import ModalPedidoDetalle from '@/shared/components/repartidor/Pedido/VerDetallePedido';

// APIs
import { patchEstadoInicial, patchResultado } from '@/services/repartidor/pedidos/pedidos.api';

import TablePedidosHoy from '@/shared/components/repartidor/Pedido/TablePedidosHoy';
import TablePedidosPendientes from '@/shared/components/repartidor/Pedido/TablePedidosPendientes';
import TablePedidosTerminados from '@/shared/components/repartidor/Pedido/TablePedidosTerminados';
import Tittlex from '@/shared/common/Tittlex';
import Buttonx from '@/shared/common/Buttonx';

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

  // ===== modal "ver detalle"
  const [openModalDetalle, setOpenModalDetalle] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoListItem | null>(null);

  // ahora recibe id
  const handleVerDetalle = (id: number) => {
    console.log('[Repartidor] Ver detalle pedido', id);

    // 🔹 Aquí puedes buscar el pedido en tu store/lista ya cargada
    // Ejemplo temporal: simulamos un pedido
    setPedidoDetalle({
      id,
      codigo_pedido: 'C25JUL25V14',
      estado_id: 1,
      estado_nombre: 'Proceso',
      fecha_entrega_programada: new Date().toISOString(),
      fecha_entrega_real: null,
      direccion_envio: 'Av. Siempre Viva 123',
      ecommerce: { id: 1, nombre_comercial: 'Peru FIT' },
      cliente: {
        nombre: 'Rosa Mamani',
        celular: '987654321',
        distrito: 'Cayma',
        direccion: 'Calle Los Álamos 456',
        referencia: 'A media cuadra del parque',
      },
      monto_recaudar: '45.00',
      metodo_pago: { id: 1, nombre: 'Efectivo', requiere_evidencia: false },
      items: [
        { producto_id: 1, nombre: 'Laptop', descripcion: 'Lenovo Ryzen 7', cantidad: 1, subtotal: '3000.00' },
        { producto_id: 2, nombre: 'Billetera', descripcion: 'Cuero marrón', cantidad: 1, subtotal: '50.00' },
      ],
      items_total_cantidad: 2,
      items_total_monto: '3050.00',
    });
    setOpenModalDetalle(true);
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
      setOpenModalCambio(false);
      setPedidoSeleccionado(null);
    } catch (err) {
      console.error('Error al actualizar estado inicial:', err);
      alert((err as Error).message);
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
      setOpenModalEntrega(false);
      setPedidoEntrega(null);
    } catch (err: any) {
      console.error('Error al guardar resultado final:', err);
      alert(String(err?.message || 'Error al actualizar el resultado del pedido'));
    }
  }

  const view = toRepartidorVista(vista);

  return (
    <section className="mt-4 md:mt-8">
      {/* Header */}
      <div className="hidden md:flex md:items-center md:justify-between gap-3">
        <Tittlex
          title="Mis Pedidos"
          description="Revisa tus pedidos asignados, gestiona pendientes y finalizados"
        />
        <div className="flex gap-2 items-center">
          <Buttonx
            label="Asignados (Hoy)"
            icon="solar:bill-list-broken"
            variant={vista === 'asignados' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('asignados')}
            disabled={false}
          />
          <Buttonx
            label="Pendientes"
            icon="mdi:clock-outline"
            variant={vista === 'pendientes' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('pendientes')}
            disabled={false}
          />
          <Buttonx
            label="Terminados"
            icon="mdi:clipboard-check-outline"
            variant={vista === 'terminados' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('terminados')}
            disabled={false}
          />
        </div>
      </div>

      {/* Tablas */}
      <div className="my-6 md:my-8">
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

      {/* Modales */}
      <ModalRepartidorMotorizado
        isOpen={openModalCambio}
        onClose={() => {
          setOpenModalCambio(false);
          setPedidoSeleccionado(null);
        }}
        pedido={pedidoSeleccionado}
        onConfirm={handleConfirmResultado}
      />
      <ModalEntregaRepartidor
        isOpen={openModalEntrega}
        onClose={() => {
          setOpenModalEntrega(false);
          setPedidoEntrega(null);
        }}
        pedido={pedidoEntrega}
        onConfirm={handleConfirmEntrega}
      />
      <ModalPedidoDetalle
        isOpen={openModalDetalle}
        onClose={() => {
          setOpenModalDetalle(false);
          setPedidoDetalle(null);
        }}
        pedido={pedidoDetalle}
      />
    </section>
  );
}
