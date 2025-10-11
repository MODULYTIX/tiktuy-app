import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react"; // <-- para usar React.MouseEvent en el handler del overlay
import Tittlex from "@/shared/common/Tittlex";
import { Inputx } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

type FormData = {
  uuid?: string;
  nombre_almacen: string;
  departamento: string;
  provincia: string;
  ciudad: string;
  direccion: string;
  fecha_registro?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modo: "editar" | "registrar";
  almacen: Partial<FormData> | null;
  onSubmit: (payload: Omit<FormData, "uuid" | "fecha_registro">) => Promise<void> | void;
}

export default function AlmacenFormModal({
  isOpen,
  onClose,
  modo,
  almacen,
  onSubmit,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    nombre_almacen: "",
    departamento: "",
    provincia: "",
    ciudad: "",
    direccion: "",
  });

  const formRef = useRef<HTMLFormElement | null>(null); // <-- ref al form

  const isEditMode = modo === "editar";
  const isCreateMode = modo === "registrar";

  // ⚠️ Demo de opciones (reemplazar por API real si aplica)
  const departamentos = useMemo(() => ["Lima", "Arequipa", "Cusco"], []);
  const provinciasPorDepartamento = useMemo<Record<string, string[]>>(
    () => ({
      Lima: ["Lima"],
      Arequipa: ["Arequipa"],
      Cusco: ["Cusco"],
    }),
    []
  );
  const ciudadesPorProvincia = useMemo<Record<string, string[]>>(
    () => ({
      "Lima|Lima": ["Lima", "Miraflores", "San Isidro"],
      "Arequipa|Arequipa": ["Arequipa", "Camaná", "Cayma"],
      "Cusco|Cusco": ["Cusco", "San Sebastián", "San Jerónimo"],
    }),
    []
  );

  // Carga inicial / cambio de modo
  useEffect(() => {
    if (!isOpen) return;
    if (almacen && isEditMode) {
      setFormData({
        uuid: almacen.uuid,
        nombre_almacen: almacen.nombre_almacen ?? "",
        departamento: almacen.departamento ?? "",
        provincia: almacen.provincia ?? "",
        ciudad: almacen.ciudad ?? "",
        direccion: almacen.direccion ?? "",
        fecha_registro: almacen.fecha_registro,
      });
    } else if (isCreateMode) {
      setFormData({
        nombre_almacen: "",
        departamento: "",
        provincia: "",
        ciudad: "",
        direccion: "",
      });
    }
  }, [isOpen, almacen, isEditMode, isCreateMode]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "departamento") {
      setFormData((prev) => ({ ...prev, departamento: value, provincia: "", ciudad: "" }));
      return;
    }
    if (name === "provincia") {
      setFormData((prev) => ({ ...prev, provincia: value, ciudad: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!formData.nombre_almacen || !formData.departamento || !formData.provincia || !formData.ciudad || !formData.direccion) {
      console.warn("Complete todos los campos obligatorios");
      return;
    }

    await onSubmit({
      nombre_almacen: formData.nombre_almacen,
      departamento: formData.departamento,
      provincia: formData.provincia,
      ciudad: formData.ciudad,
      direccion: formData.direccion,
    });

    onClose();
  };

  const provincias = provinciasPorDepartamento[formData.departamento] ?? [];
  const ciudades = ciudadesPorProvincia[`${formData.departamento}|${formData.provincia}`] ?? [];

  return !isOpen ? null : (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end"
    >
      {/* Drawer: ancho reducido + padding y separaciones de 20px; footer anclado */}
      <div className="w-[480px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col gap-5 p-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="hugeicons:warehouse"
          title={isCreateMode ? "Registrar nuevo almacén" : "Editar almacén"}
          description={
            isCreateMode
              ? "Complete la información para registrar un nuevo almacén y habilitarlo como punto de origen o destino en sus operaciones logísticas."
              : "Actualice la información del almacén y guarde los cambios."
          }
        />

        {/* Body (scroll) */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-5 text-sm">
          <Inputx
            label="Nombre de Almacén"
            name="nombre_almacen"
            placeholder="Ejem. Almacén secundario"
            value={formData.nombre_almacen}
            onChange={handleChange}
            required
          />

          <Selectx
            label="Departamento"
            name="departamento"
            labelVariant="left"
            value={formData.departamento}
            onChange={handleChange}
            placeholder="Seleccionar departamento"
            required
          >
            <option value="">Seleccionar departamento</option>
            {departamentos.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Selectx>

          <Selectx
            label="Provincia"
            name="provincia"
            labelVariant="left"
            value={formData.provincia}
            onChange={handleChange}
            placeholder="Seleccionar provincia"
            required
            disabled={!provincias.length}
          >
            <option value="">Seleccionar provincia</option>
            {provincias.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Selectx>

          <Selectx
            label="Ciudad"
            name="ciudad"
            labelVariant="left"
            value={formData.ciudad}
            onChange={handleChange}
            placeholder="Seleccionar ciudad"
            required
            disabled={!formData.departamento || !formData.provincia}
          >
            <option value="">Seleccionar ciudad</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Selectx>

          <Inputx
            label="Dirección"
            name="direccion"
            placeholder="Av. Los Próceres 1234, Urb. Santa Catalina, La Victoria, Lima"
            value={formData.direccion}
            onChange={handleChange}
            required
          />

          {formData.fecha_registro && (
            <div>
              <span className="block text-sm font-medium text-gray-700">Fecha de creación</span>
              <div className="mt-1 text-sm text-gray-600">
                {new Date(formData.fecha_registro).toLocaleString("es-PE")}
              </div>
            </div>
          )}
        </form>

        {/* Footer (botones abajo a la izquierda) */}
        <div className="border-t border-gray20 flex items-center gap-5">
          <div className="border-gray20 flex items-center gap-2">
            <Buttonx
              variant="quartery"
              onClick={() => {
                // Envía el form del body sin usar 'e' para respetar la firma () => void
                formRef.current?.requestSubmit();
              }}
              label={isCreateMode ? "Crear nuevo" : "Actualizar"}
              className="px-4 py-2 text-white bg-[#1A253D] hover:opacity-95"
            />

            <Buttonx
              variant="outlinedw"
              onClick={onClose}
              label="Cancelar"
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
