import { useContext, useState } from "react";
import { AuthContext } from "@/auth/context/AuthContext";
import type { RepartidorVista, PedidoListItem } from "@/services/repartidor/pedidos/pedidos.types";

import ModalRepartidorMotorizado from "@/shared/components/repartidor/Pedido/ModalPedidoRepartidor";
import ModalEntregaRepartidor from "@/shared/components/repartidor/Pedido/ModalPedidoPendienteRepartidor";
import ModalPedidoDetalle from "@/shared/components/repartidor/Pedido/VerDetallePedido";

import { patchEstadoInicial, patchResultado, fetchPedidoDetalle } from "@/services/repartidor/pedidos/pedidos.api";

import TablePedidosHoy from "@/shared/components/repartidor/Pedido/TablePedidosHoy";
import TablePedidosPendientes from "@/shared/components/repartidor/Pedido/TablePedidosPendientes";
import TablePedidosTerminados from "@/shared/components/repartidor/Pedido/TablePedidosTerminados";

import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

type VistaUI = "asignados" | "pendientes" | "terminados";
const toRepartidorVista = (v: VistaUI): RepartidorVista => (v === "asignados" ? "hoy" : v);

/** IDs reales de tu tabla MetodoPago (según tu BD) */
const METODO_PAGO_IDS = {
  EFECTIVO: 1,
  BILLETERA: 2,
  DIRECTO_ECOMMERCE: 3,
} as const;

/** Tipo que el ModalEntregaRepartidor ya está enviando */
type ConfirmEntregaPayload =
  | { pedidoId: number; resultado: "RECHAZADO"; observacion?: string }
  | {
    pedidoId: number;
    resultado: "ENTREGADO";
    metodo_pago_id: number;
    observacion?: string;
    evidenciaFile?: File;
    fecha_entrega_real?: string;
  };

export default function PedidosPage() {
  const auth = useContext(AuthContext);
  const token = auth?.token ?? "";

  const [refreshKey, setRefreshKey] = useState(0);

  const [vista, setVista] = useState<VistaUI>("asignados");

  const [openModalCambio, setOpenModalCambio] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoListItem | null>(null);

  const [openModalEntrega, setOpenModalEntrega] = useState(false);
  const [pedidoEntrega, setPedidoEntrega] = useState<PedidoListItem | null>(null);

  const [openModalDetalle, setOpenModalDetalle] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoListItem | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const handleVerDetalle = async (id: number) => {
    setOpenModalDetalle(true);
    setPedidoDetalle(null);
    setLoadingDetalle(true);
    try {
      const detalle = await fetchPedidoDetalle(token, id);
      setPedidoDetalle(detalle as any);
    } catch (err: any) {
      console.error("Error al obtener detalle:", err);
      alert(String(err?.message || "No se pudo obtener el detalle del pedido"));
      setOpenModalDetalle(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCambiarEstado = (pedido: PedidoListItem) => {
    if (vista === "pendientes") {
      setPedidoEntrega(pedido);
      setOpenModalEntrega(true);
    } else {
      setPedidoSeleccionado(pedido);
      setOpenModalCambio(true);
    }
  };

  async function handleConfirmResultado(payload: {
    pedidoId: number;
    resultado: "RECEPCION_HOY" | "NO_RESPONDE" | "REPROGRAMADO" | "ANULO";
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
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error al actualizar estado inicial:", err);
      alert((err as Error).message);
    }
  }

  async function handleConfirmEntrega(data: ConfirmEntregaPayload) {
    try {
      if (data.resultado === "RECHAZADO") {
        await patchResultado(token, data.pedidoId, {
          resultado: "RECHAZADO",
          observacion: data.observacion,
          fecha_entrega_real: undefined,
        });
      } else {
        if (!Number.isFinite(data.metodo_pago_id) || data.metodo_pago_id <= 0) {
          throw new Error("metodo_pago_id inválido (undefined/NaN). Revisa metodoPagoIds.");
        }

        await patchResultado(token, data.pedidoId, {
          resultado: "ENTREGADO",
          metodo_pago_id: data.metodo_pago_id,
          observacion: data.observacion,
          evidenciaFile: data.evidenciaFile,
          fecha_entrega_real: data.fecha_entrega_real,
        });
      }

      setOpenModalEntrega(false);
      setPedidoEntrega(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.error("Error al guardar resultado final:", err);
      alert(String(err?.message || "Error al actualizar el resultado del pedido"));
    }
  }

  const view = toRepartidorVista(vista);

  return (
    <section
      className="
        mt-4 md:mt-8
        w-full min-w-0
        px-3 sm:px-4 lg:px-0
      "
    >
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between min-w-0 pb-5 border-b border-gray30">
        <div className="text-center md:text-left min-w-0">
          <Tittlex
            title="Mis Pedidos"
            description="Revisa tus pedidos asignados, gestiona pendientes y finalizados"
          />
        </div>

        {/* Tabs/Botones */}
        <nav className="w-full md:w-auto min-w-0">
          <div
            className="
              flex flex-wrap items-end justify-center gap-3
              md:flex-nowrap md:justify-end
              w-full md:w-auto min-w-0
              -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0
            "
          >
            <Buttonx
              label="Asignados"
              icon="solar:bill-list-broken"
              variant={vista === "asignados" ? "secondary" : "tertiary"}
              onClick={() => setVista("asignados")}
            />

            <span className="w-[1px] h-10 bg-gray40" />

            <Buttonx
              label="Pendientes"
              icon="mdi:clock-outline"
              variant={vista === "pendientes" ? "secondary" : "tertiary"}
              onClick={() => setVista("pendientes")}
            />

            <span className="w-[1px] h-10 bg-gray40" />

            <Buttonx
              label="Terminados"
              icon="mdi:clipboard-check-outline"
              variant={vista === "terminados" ? "secondary" : "tertiary"}
              onClick={() => setVista("terminados")}
            />
          </div>
        </nav>
      </header>

      {/* Tablas */}
      <div className="my-4 md:my-7 w-full min-w-0">
        {view === "hoy" && (
          <TablePedidosHoy
            token={token}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleCambiarEstado}
            refreshKey={refreshKey}
          />
        )}

        {view === "pendientes" && (
          <TablePedidosPendientes
            token={token}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleCambiarEstado}
            refreshKey={refreshKey}
          />
        )}

        {view === "terminados" && (
          <TablePedidosTerminados
            token={token}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleCambiarEstado}
            refreshKey={refreshKey}
          />
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
        metodoPagoIds={METODO_PAGO_IDS}
      />

      <ModalPedidoDetalle
        isOpen={openModalDetalle}
        onClose={() => {
          setOpenModalDetalle(false);
          setPedidoDetalle(null);
        }}
        pedido={pedidoDetalle}
        loading={loadingDetalle as any}
      />
    </section>
  );
}
