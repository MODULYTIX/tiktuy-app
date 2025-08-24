import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

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
  modo: "editar" | "registrar"; // 👈 solo 2 modos
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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

  // 🎨 Estilos normalizados (como tu figma)
  const fieldClass =
    "w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors";
  const labelClass = "block text-gray-700 font-medium mb-1";

  return !isOpen ? null : (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end"
    >
      {/* Drawer: ancho reducido + padding y separaciones de 20px; footer anclado */}
      <div className="w-[480px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray20">
          <div className="flex items-center gap-2 mb-5">
            <Icon icon="mdi:warehouse" width={22} className="text-primaryDark" />
            <h2 className="text-xl font-bold uppercase text-[#1A253D]">
              {isCreateMode ? "Registrar nuevo almacén" : "Editar almacén"}
            </h2>
          </div>

          <p className="text-sm text-gray-600">
            {isCreateMode
              ? "Complete la información para registrar un nuevo almacén y habilitarlo como punto de origen o destino en sus operaciones logísticas."
              : "Actualice la información del almacén y guarde los cambios."}
          </p>
        </div>

        {/* Body (scroll) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-5 text-sm">
          <div>
            <label className={labelClass}>Nombre de Almacén</label>
            <input
              type="text"
              name="nombre_almacen"
              placeholder="Ejem. Almacén secundario"
              value={formData.nombre_almacen}
              onChange={handleChange}
              className={fieldClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Departamento</label>
            <div className="relative">
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9`}
                required
              >
                <option value="">Seleccionar departamento</option>
                {departamentos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <Icon icon="mdi:chevron-down" width={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Provincia</label>
            <div className="relative">
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!provincias.length}
                required
              >
                <option value="">Seleccionar provincia</option>
                {provincias.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Icon icon="mdi:chevron-down" width={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Ciudad</label>
            <div className="relative">
              <select
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!formData.departamento || !formData.provincia}
                required
              >
                <option value="">Seleccionar ciudad</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Icon icon="mdi:chevron-down" width={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              name="direccion"
              placeholder="Av. Los Próceres 1234, Urb. Santa Catalina, La Victoria, Lima"
              value={formData.direccion}
              onChange={handleChange}
              className={fieldClass}
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
        </form>

        {/* Footer (botones abajo a la izquierda) */}
        <div className="p-5 border-t border-gray20 flex items-center gap-2">
          <button
            type="submit"
            form="__no-id__" // no es necesario; el form submit es via onSubmit del form superior
            onClick={(e) => {
              // envía el form del body
              (e.currentTarget.closest("div")?.previousElementSibling as HTMLFormElement)?.requestSubmit();
            }}
            className="bg-[#1A253D] text-white px-4 py-2 rounded hover:opacity-95"
          >
            {isCreateMode ? "Crear nuevo" : "Actualizar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
