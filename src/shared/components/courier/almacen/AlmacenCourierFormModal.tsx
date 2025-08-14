// shared/components/courier/almacen/AlmacenCourierFormModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

type FormData = {
  uuid?: string;
  nombre_almacen: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  fecha_registro?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modo: "ver" | "editar" | "registrar";
  almacen: FormData | null;
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
    ciudad: "",
    direccion: "",
  });

  const isViewMode = modo === "ver";
  const isEditMode = modo === "editar";
  const isCreateMode = modo === "registrar";

  // Opciones demo (puedes reemplazar por tu API de ubigeo real)
  const departamentos = useMemo(() => ["Lima", "Arequipa", "Cusco"], []);
  const ciudadesPorDepartamento = useMemo<Record<string, string[]>>(
    () => ({
      Lima: ["Lima", "Miraflores", "San Isidro"],
      Arequipa: ["Arequipa", "Camaná", "Cayma"],
      Cusco: ["Cusco", "San Sebastián", "San Jerónimo"],
    }),
    []
  );

  // Carga inicial / cambio de modo
  useEffect(() => {
    if (!isOpen) return;
    if (almacen && (isViewMode || isEditMode)) {
      setFormData({
        uuid: almacen.uuid,
        nombre_almacen: almacen.nombre_almacen ?? "",
        departamento: almacen.departamento ?? "",
        ciudad: almacen.ciudad ?? "",
        direccion: almacen.direccion ?? "",
        fecha_registro: almacen.fecha_registro,
      });
    } else if (isCreateMode) {
      setFormData({
        nombre_almacen: "",
        departamento: "",
        ciudad: "",
        direccion: "",
      });
    }
  }, [isOpen, almacen, isViewMode, isEditMode, isCreateMode]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "departamento") {
      const ciudades = ciudadesPorDepartamento[value] ?? [];
      setFormData((prev) => ({
        ...prev,
        departamento: value,
        ciudad: ciudades.includes(prev.ciudad) ? prev.ciudad : "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isViewMode) return;

    if (!formData.nombre_almacen || !formData.departamento || !formData.ciudad || !formData.direccion) {
      console.warn("Complete todos los campos obligatorios");
      return;
    }

    await onSubmit({
      nombre_almacen: formData.nombre_almacen,
      departamento: formData.departamento,
      ciudad: formData.ciudad,
      direccion: formData.direccion,
    });

    onClose();
  };

  if (!isOpen) return null;

  const ciudades = ciudadesPorDepartamento[formData.departamento] ?? [];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end"
    >
      <div className="bg-white w-full max-w-md h-full shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <Icon icon="mdi:warehouse" width={24} />
            {isCreateMode ? "Registrar Nuevo Almacén" : isEditMode ? "Editar Almacén" : "Detalle del Almacén"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <Icon icon="ic:round-close" width="24" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {isViewMode
            ? "Visualiza la información del almacén."
            : "Complete la información para registrar o editar un almacén."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de Almacén</label>
            <input
              type="text"
              name="nombre_almacen"
              value={formData.nombre_almacen}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Ejem. Almacén secundario"
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Departamento</label>
            <select
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              disabled={isViewMode}
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm bg-white"
              required
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad</label>
            <select
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              disabled={isViewMode || !formData.departamento}
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm bg-white"
              required
            >
              <option value="">Seleccionar ciudad</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Ejem. Av. Los Próceres 1234, La Victoria, Lima"
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm"
              required
            />
          </div>

          {formData.fecha_registro && (
            <div>
              <span className="block text-sm font-medium text-gray-700">Fecha de creación</span>
              <div className="mt-1 text-sm text-gray-600">
                {new Date(formData.fecha_registro).toLocaleString("es-PE")}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {!isViewMode && (
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
              >
                {isCreateMode ? "Crear nuevo" : "Guardar cambios"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium w-full"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
