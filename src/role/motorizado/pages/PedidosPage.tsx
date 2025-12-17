import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/auth/context/AuthContext";
import type {
  RepartidorVista,
  PedidoListItem,
} from "@/services/repartidor/pedidos/pedidos.types";

import ModalRepartidorMotorizado from "@/shared/components/repartidor/Pedido/ModalPedidoRepartidor";
import ModalEntregaRepartidor from "@/shared/components/repartidor/Pedido/ModalPedidoPendienteRepartidor";
import ModalPedidoDetalle from "@/shared/components/repartidor/Pedido/VerDetallePedido";

import {
  patchEstadoInicial,
  patchResultado,
  fetchPedidoDetalle,
} from "@/services/repartidor/pedidos/pedidos.api";

import TablePedidosHoy from "@/shared/components/repartidor/Pedido/TablePedidosHoy";
import TablePedidosPendientes from "@/shared/components/repartidor/Pedido/TablePedidosPendientes";
import TablePedidosTerminados from "@/shared/components/repartidor/Pedido/TablePedidosTerminados";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

type VistaUI = "asignados" | "pendientes" | "terminados";
const toRepartidorVista = (v: VistaUI): RepartidorVista =>
  v === "asignados" ? "hoy" : v;

/** ✅ IDs reales de tu tabla MetodoPago (según tu BD) */
const METODO_PAGO_IDS = {
  EFECTIVO: 1,
  BILLETERA: 2,
  DIRECTO_ECOMMERCE: 3,
} as const;

/** ✅ Tipo que el ModalEntregaRepartidor ya está enviando */
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

  const [vista, setVista] = useState<VistaUI>(() => {
    const saved = localStorage.getItem(
      "repartidor_vista_pedidos"
    ) as VistaUI | null;
    return saved ?? "asignados";
  });
  useEffect(() => {
    localStorage.setItem("repartidor_vista_pedidos", vista);
  }, [vista]);

  const [openModalCambio, setOpenModalCambio] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<PedidoListItem | null>(null);

  const [openModalEntrega, setOpenModalEntrega] = useState(false);
  const [pedidoEntrega, setPedidoEntrega] = useState<PedidoListItem | null>(
    null
  );

  const [openModalDetalle, setOpenModalDetalle] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoListItem | null>(
    null
  );
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
    } catch (err) {
      console.error("Error al actualizar estado inicial:", err);
      alert((err as Error).message);
    }
  }

  /** ✅ FIX: ahora usamos metodo_pago_id (lo que exige el backend) */
  async function handleConfirmEntrega(data: ConfirmEntregaPayload) {
    try {
      if (data.resultado === "RECHAZADO") {
        await patchResultado(token, data.pedidoId, {
          resultado: "RECHAZADO",
          observacion: data.observacion,
          fecha_entrega_real: undefined,
        });
      } else {
        // ✅ Validación defensiva por si alguien cambia el modal
        if (!Number.isFinite(data.metodo_pago_id) || data.metodo_pago_id <= 0) {
          throw new Error(
            "metodo_pago_id inválido (undefined/NaN). Revisa metodoPagoIds."
          );
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
    } catch (err: any) {
      console.error("Error al guardar resultado final:", err);
      alert(String(err?.message || "Error al actualizar el resultado del pedido"));
    }
  }

  const view = toRepartidorVista(vista);

  return (
    <section className="mt-4 md:mt-8 px-3 sm:px-4 lg:px-0">
      {/* Header Desktop */}
      <div className="hidden md:flex md:items-center md:justify-between gap-3">
        <Tittlex
          title="Mis Pedidos"
          description="Revisa tus pedidos asignados, gestiona pendientes y finalizados"
        />
        <div className="flex gap-2 items-center">
          <Buttonx
            label="Asignados (Hoy)"
            icon="solar:bill-list-broken"
            variant={vista === "asignados" ? "secondary" : "tertiary"}
            onClick={() => setVista("asignados")}
          />
          <Buttonx
            label="Pendientes"
            icon="mdi:clock-outline"
            variant={vista === "pendientes" ? "secondary" : "tertiary"}
            onClick={() => setVista("pendientes")}
          />
          <Buttonx
            label="Terminados"
            icon="mdi:clipboard-check-outline"
            variant={vista === "terminados" ? "secondary" : "tertiary"}
            onClick={() => setVista("terminados")}
          />
        </div>
      </div>

      {/* Header Mobile */}
      <div className="flex flex-col md:hidden text-center mt-2">
        <h2 className="text-lg font-semibold text-blue-700">
          Gestión de Pedidos
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          Administra y visualiza el estado de tus pedidos
        </p>
        <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Buttonx
            label="Asignados"
            variant={vista === "asignados" ? "secondary" : "tertiary"}
            onClick={() => setVista("asignados")}
          />
          <Buttonx
            label="Pendientes"
            variant={vista === "pendientes" ? "secondary" : "tertiary"}
            onClick={() => setVista("pendientes")}
          />
          <Buttonx
            label="Terminados"
            variant={vista === "terminados" ? "secondary" : "tertiary"}
            onClick={() => setVista("terminados")}
          />
        </div>
      </div>

      {/* Tablas */}
      <div className="my-4 md:my-8 ">
        {view === "hoy" && (
          <TablePedidosHoy
            token={token}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleCambiarEstado}
          />
        )}
        {view === "pendientes" && (
          <TablePedidosPendientes
            token={token}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleCambiarEstado}
          />
        )}
        {view === "terminados" && (
          <TablePedidosTerminados
            token={token}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleCambiarEstado}
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
        metodoPagoIds={METODO_PAGO_IDS} // ✅ CLAVE: le pasamos ids reales
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
