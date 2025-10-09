import { useEffect, useMemo, useState } from "react";
import { PiGarageLight } from "react-icons/pi";
import AlmacenCourierTable from "@/shared/components/courier/almacen/AlmacenCourierTable";

import AlmacenCourierCrearModal from "@/shared/components/courier/almacen/AlmacenCourierCrearModal";
import AlmacenCourierEditarModal from "@/shared/components/courier/almacen/AlmacenCourierEditarModal";

import {
  fetchAlmacenesCourier,
  createAlmacenCourier,
  updateAlmacenCourier,
} from "@/services/courier/almacen/almacenCourier.api";

import type {
  AlmacenamientoCourier,
  AlmacenCourierCreateDTO,
} from "@/services/courier/almacen/almacenCourier.type";

export default function AlmacenPage() {
  const [items, setItems] = useState<AlmacenamientoCourier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<AlmacenamientoCourier | null>(null);

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

  const onCreate = async (form: AlmacenCourierCreateDTO) => {
    await createAlmacenCourier(form, token);
    await loadData();
    // el modal se cierra desde dentro del componente tras éxito
  };

  const onUpdate = async (uuid: string, form: AlmacenCourierCreateDTO) => {
    await updateAlmacenCourier(uuid, form, token);
    await loadData();
    // el modal se cierra desde dentro del componente tras éxito
  };

  return (
    <section className="mt-8 flex flex-col gap-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl text-primary font-bold">Cede</h1>
          <p className="text-gray-500">Visualice su cede y sus movimientos</p>
        </div>
        <div>
          <button
            onClick={openCrear}
            className="text-white flex px-3 py-2 bg-[#1A253D] items-center gap-2 rounded-sm text-sm hover:opacity-90 transition"
          >
            <PiGarageLight size={18} />
            <span>Nueva Cede</span>
          </button>
        </div>
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

      {/* Crear */}
      <AlmacenCourierCrearModal
        isOpen={modalCrearOpen}
        onClose={closeCrear}
        onSubmit={onCreate}
      />

      {/* Editar */}
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
