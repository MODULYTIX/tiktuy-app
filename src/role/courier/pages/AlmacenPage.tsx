import { useEffect, useMemo, useState } from "react";
import AlmacenCourierTable from "@/shared/components/courier/almacen/AlmacenCourierTable";

// ⛳️ Mantén el modal de EDITAR (sigue funcionando con /almacenamientocourier/:uuid)
import AlmacenCourierEditarModal from "@/shared/components/courier/almacen/AlmacenCourierEditarModal";

// ✅ Usa el NUEVO modal de “sede + invitación”
import AlmacenCourierCrearModalInvitacion from "@/shared/components/courier/almacen/AlmacenCourierCrearModal";
import type { CrearSedeSecundariaCourierDTO } from "@/shared/components/courier/almacen/AlmacenCourierCrearModal";

import {
  fetchAlmacenesCourier,
  updateAlmacenCourier, // para editar sigue igual
  crearSedeSecundariaConInvitacion, // ✅ nueva API para crear sede + invitar
} from "@/services/courier/almacen/almacenCourier.api";

import type {
  AlmacenamientoCourier,
  AlmacenCourierCreateDTO,
} from "@/services/courier/almacen/almacenCourier.type";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";

export default function AlmacenPage() {
  const [items, setItems] = useState<AlmacenamientoCourier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [seleccionado, setSeleccionado] =
    useState<AlmacenamientoCourier | null>(null);

  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAlmacenesCourier(token);
      setItems(data);
      setError("");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error al cargar almacenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCrear = () => setModalCrearOpen(true);
  const closeCrear = () => setModalCrearOpen(false);

  const openEditar = (row: AlmacenamientoCourier) => {
    setSeleccionado(row);
    setModalEditarOpen(true);
  };
  const closeEditar = () => {
    setModalEditarOpen(false);
    setSeleccionado(null);
  };

  // ✅ Crear “sede + invitación” usando el endpoint /almacenamientocourier/sedes
  const onCreate = async (form: CrearSedeSecundariaCourierDTO) => {
    await crearSedeSecundariaConInvitacion(form, token);
    await loadData();
    // el modal se cierra desde dentro tras éxito (o puedes cerrarlo aquí también)
  };

  // 🛠 Editar almacén existente (sigue yendo al endpoint /almacenamientocourier/:uuid)
  const onUpdate = async (uuid: string, form: AlmacenCourierCreateDTO) => {
    await updateAlmacenCourier(uuid, form, token);
    await loadData();
  };

  return (
    <section className="mt-8 flex flex-col gap-5">
      <div className="flex justify-between items-end">
        <Tittlex
          title="Sede"
          description="Visualice su sede y sus movimientos"
        />

        <Buttonx
          label="Nueva Sede"
          icon="solar:garage-linear"
          variant="secondary"
          onClick={openCrear}
        />
      </div>

      <div>
        <AlmacenCourierTable
          items={items}
          loading={loading}
          error={error}
          onView={() => {}}
          onEdit={openEditar}
        />
      </div>

      {/* ✅ Crear sede + invitación */}
      <AlmacenCourierCrearModalInvitacion
        isOpen={modalCrearOpen}
        onClose={closeCrear}
        onSubmit={onCreate}
      />

      {/* ✏️ Editar almacén existente */}
      <AlmacenCourierEditarModal
        isOpen={modalEditarOpen}
        onClose={closeEditar}
        almacen={
          seleccionado
            ? {
                uuid: seleccionado.uuid,
                nombre_almacen: seleccionado.nombre_almacen,
                departamento: seleccionado.departamento,
                distrito: seleccionado.ciudad,
                direccion: seleccionado.direccion,
                fecha_registro: seleccionado.fecha_registro,
              }
            : null
        }
        onSubmit={onUpdate}
      />
    </section>
  );
}
