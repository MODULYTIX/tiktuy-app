// pages/AlmacenPage.tsx
import { useEffect, useMemo, useState } from "react";
import { PiGarageLight } from "react-icons/pi";
import AlmacenCourierTable from "@/shared/components/courier/almacen/AlmacenCourierTable";
import AlmacenFormModal from "@/shared/components/courier/almacen/AlmacenCourierFormModal";
import {
  fetchAlmacenesCourier,
  createAlmacenCourier,
  updateAlmacenCourier,
} from "@/services/courier/almacen/almacenCourier.api";
import type { AlmacenamientoCourier, AlmacenCourierCreateDTO } from "@/services/courier/almacen/almacenCourier.type";

export default function AlmacenPage() {
  const [items, setItems] = useState<AlmacenamientoCourier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal state centralizado
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState<"ver" | "editar" | "registrar">("ver");
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

  const openNew = () => {
    setModo("registrar");
    setSeleccionado(null);
    setModalOpen(true);
  };

  const onView = (row: AlmacenamientoCourier) => {
    setModo("ver");
    setSeleccionado(row);
    setModalOpen(true);
  };

  const onEdit = (row: AlmacenamientoCourier) => {
    setModo("editar");
    setSeleccionado(row);
    setModalOpen(true);
  };

  const onClose = () => {
    setModalOpen(false);
    setSeleccionado(null);
  };

  // Submit del modal: crea o edita y refresca la tabla
  const onSubmit = async (form: AlmacenCourierCreateDTO) => {
    if (modo === "registrar") {
      await createAlmacenCourier(form, token);
    } else if (modo === "editar" && seleccionado?.uuid) {
      await updateAlmacenCourier(seleccionado.uuid, form, token);
    }
    await loadData();
  };

  return (
    <section className="mt-8 flex flex-col gap-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl text-primary font-bold">Almacén</h1>
          <p className="text-gray-500">Visualice su almacén y sus movimientos</p>
        </div>
        <div>
          <button
            onClick={openNew}
            className="text-white flex px-3 py-2 bg-[#1A253D] items-center gap-2 rounded-sm text-sm hover:opacity-90 transition"
          >
            <PiGarageLight size={18} />
            <span>Nuevo Almacén</span>
          </button>
        </div>
      </div>

      <div className="my-8">
        <AlmacenCourierTable
          items={items}
          loading={loading}
          error={error}
          onView={onView}
          onEdit={onEdit}
        />
      </div>

      <AlmacenFormModal
        isOpen={modalOpen}
        onClose={onClose}
        modo={modo}
        almacen={
          seleccionado
            ? {
                uuid: seleccionado.uuid,
                nombre_almacen: seleccionado.nombre_almacen,
                departamento: seleccionado.departamento,
                ciudad: seleccionado.ciudad,
                direccion: seleccionado.direccion,
                fecha_registro: seleccionado.fecha_registro,
              }
            : null
        }
        onSubmit={onSubmit}
      />
    </section>
  );
}
