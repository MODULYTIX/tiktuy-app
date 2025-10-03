import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import type { AlmacenCourierCreateDTO } from "@/services/courier/almacen/almacenCourier.type";

type Ubigeo = { code: string; dep: string; prov: string; dist: string };

type FormData = {
  nombre_almacen: string;
  departamento: string;
  provincia: string;
  distrito: string; // usamos distrito como "ciudad"
  direccion: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AlmacenCourierCreateDTO) => Promise<void> | void;
}

export default function AlmacenCourierCrearModal({ isOpen, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormData>({
    nombre_almacen: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
  });

  const [ubigeos, setUbigeos] = useState<Ubigeo[]>([]);
  const [loadingUbigeo, setLoadingUbigeo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar ubigeos al abrir
  useEffect(() => {
    if (!isOpen) return;
    setLoadingUbigeo(true);
    (async () => {
      try {
        const res = await fetch("https://free.e-api.net.pe/ubigeos.json");
        const raw = await res.json();
        const tmp: Ubigeo[] = [];
        for (const depName of Object.keys(raw)) {
          const provinciasObj = raw[depName];
          for (const provName of Object.keys(provinciasObj)) {
            const distritosObj = provinciasObj[provName];
            for (const distName of Object.keys(distritosObj)) {
              const meta = distritosObj[distName];
              tmp.push({ code: meta.ubigeo, dep: depName, prov: provName, dist: distName });
            }
          }
        }
        setUbigeos(tmp);
      } catch (err) {
        console.error("Error cargando ubigeos:", err);
      } finally {
        setLoadingUbigeo(false);
      }
    })();
  }, [isOpen]);

  // Reset del formulario al abrir (no al cerrar → evita parpadeo)
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      nombre_almacen: "",
      departamento: "",
      provincia: "",
      distrito: "",
      direccion: "",
    });
    setIsSubmitting(false);
  }, [isOpen]);

  // Cerrar con ESC (deshabilitado si está enviando)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, isSubmitting]);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting) return; // no cerrar mientras envía
    if (e.target === overlayRef.current) onClose();
  };

  // Derivados
  const departamentos = useMemo(() => Array.from(new Set(ubigeos.map(u => u.dep))).sort(), [ubigeos]);

  const provincias = useMemo(() => {
    if (!form.departamento) return [];
    return Array.from(
      new Set(ubigeos.filter(u => u.dep === form.departamento).map(u => u.prov))
    ).sort();
  }, [form.departamento, ubigeos]);

  const distritos = useMemo(() => {
    if (!form.departamento || !form.provincia) return [];
    return ubigeos
      .filter(u => u.dep === form.departamento && u.prov === form.provincia)
      .map(u => ({ code: u.code, name: u.dist }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [form.departamento, form.provincia, ubigeos]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isSubmitting) return;
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "departamento" ? { provincia: "", distrito: "" } : null),
      ...(name === "provincia" ? { distrito: "" } : null),
    }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { nombre_almacen, departamento, provincia, distrito, direccion } = form;
    if (!nombre_almacen || !departamento || !provincia || !distrito || !direccion) {
      console.warn("Complete todos los campos obligatorios");
      return;
    }

    const selectedDist = distritos.find(d => d.code === distrito);
    const ciudad = selectedDist?.name || "";

    try {
      setIsSubmitting(true);
      await onSubmit({ nombre_almacen, departamento, ciudad, direccion });
      // Cerrar recién cuando termina:
      onClose();
    } finally {
      // no reseteo aquí para evitar el “parpadeo” previo al cierre
      setIsSubmitting(false);
    }
  };

  // 🎨 Estilos
  const fieldClass =
    "w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors " +
    (isSubmitting ? "opacity-70 pointer-events-none select-none" : "");
  const labelClass = "block text-gray-700 font-medium mb-1";

  return !isOpen ? null : (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end ${isSubmitting ? "cursor-wait" : ""}`}
    >
      <div className="w-[480px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray20">
          <div className="flex items-center gap-2 mb-5">
            <Icon icon="mdi:warehouse" width={22} className="text-primaryDark" />
            <h2 className="text-xl font-bold uppercase text-[#1A253D]">Registrar nuevo almacén</h2>
          </div>
          <p className="text-sm text-gray-600">Complete la información para registrar un nuevo almacén.</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-5 text-sm">
          <div>
            <label className={labelClass}>Nombre de Almacén</label>
            <input
              type="text"
              name="nombre_almacen"
              placeholder="Ejem. Almacén secundario"
              value={form.nombre_almacen}
              onChange={handleChange}
              className={fieldClass}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Departamento</label>
            <div className="relative">
              <select
                name="departamento"
                value={form.departamento}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9`}
                required
                disabled={loadingUbigeo || isSubmitting}
              >
                <option value="">{loadingUbigeo ? "Cargando..." : "Seleccionar departamento"}</option>
                {departamentos.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
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
                value={form.provincia}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!form.departamento || loadingUbigeo || provincias.length === 0 || isSubmitting}
                required
              >
                <option value="">Seleccionar provincia</option>
                {provincias.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Icon icon="mdi:chevron-down" width={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Distrito (se guarda como ciudad)</label>
            <div className="relative">
              <select
                name="distrito"
                value={form.distrito}
                onChange={handleChange}
                className={`${fieldClass} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!form.provincia || loadingUbigeo || distritos.length === 0 || isSubmitting}
                required
              >
                <option value="">Seleccionar distrito</option>
                {distritos.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
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
              value={form.direccion}
              onChange={handleChange}
              className={fieldClass}
              disabled={isSubmitting}
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-gray20 flex items-center gap-2">
          <button
            type="submit"
            form="__no-id__"
            onClick={(e) => {
              if (isSubmitting) return;
              (e.currentTarget.closest("div")?.previousElementSibling as HTMLFormElement)?.requestSubmit();
            }}
            className={`text-white px-4 py-2 rounded hover:opacity-95 flex items-center gap-2 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#1A253D]"}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icon icon="svg-spinners:180-ring" width={18} />
                Creando...
              </>
            ) : (
              "Crear nuevo"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-sm border rounded ${isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-100"}`}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
