import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

/** =========================
 *  DTO para crear sede + invitación de representante (Courier)
 *  ========================= */
export type CrearSedeSecundariaCourierDTO = {
  nombre_sede: string;
  departamento?: string | null;
  provincia?: string | null;
  ciudad: string;
  direccion: string;
  representante: {
    nombres: string;
    apellidos: string;
    dni: string;
    celular?: string | null;
    correo: string;
  };
};

type Ubigeo = { code: string; dep: string; prov: string; dist: string };

type FormData = {
  nombre_sede: string;
  departamento: string;
  provincia: string;
  distrito: string; // se usará como "ciudad" (name del distrito)
  direccion: string;
  representante: {
    nombres: string;
    apellidos: string;
    dni: string;
    celular: string;
    correo: string;
  };
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit debe llamar a crearSedeSecundariaConInvitacion(payload, token)
  onSubmit: (payload: CrearSedeSecundariaCourierDTO) => Promise<void> | void;
}

export default function AlmacenCourierCrearModalInvitacion({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FormData>({
    nombre_sede: "",
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
    representante: {
      nombres: "",
      apellidos: "",
      dni: "",
      celular: "",
      correo: "",
    },
  });

  const [ubigeos, setUbigeos] = useState<Ubigeo[]>([]);
  const [loadingUbigeo, setLoadingUbigeo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Reset del formulario al abrir
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      nombre_sede: "",
      departamento: "",
      provincia: "",
      distrito: "",
      direccion: "",
      representante: {
        nombres: "",
        apellidos: "",
        dni: "",
        celular: "",
        correo: "",
      },
    });
    setIsSubmitting(false);
    setErrorMsg(null);
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

  // Derivados (ubigeo)
  const departamentos = useMemo(
    () => Array.from(new Set(ubigeos.map((u) => u.dep))).sort(),
    [ubigeos]
  );

  const provincias = useMemo(() => {
    if (!form.departamento) return [];
    return Array.from(
      new Set(ubigeos.filter((u) => u.dep === form.departamento).map((u) => u.prov))
    ).sort();
  }, [form.departamento, ubigeos]);

  const distritos = useMemo(() => {
    if (!form.departamento || !form.provincia) return [];
    return ubigeos
      .filter((u) => u.dep === form.departamento && u.prov === form.provincia)
      .map((u) => ({ code: u.code, name: u.dist }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [form.departamento, form.provincia, ubigeos]);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (isSubmitting) return;
    const { name, value } = e.target;

    // Campos del representante
    if (name.startsWith("rep.")) {
      const k = name.split(".")[1] as keyof FormData["representante"];
      setForm((prev) => ({
        ...prev,
        representante: { ...prev.representante, [k]: value },
      }));
      return;
    }

    // Campos de sede
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departamento" ? { provincia: "", distrito: "" } : null),
      ...(name === "provincia" ? { distrito: "" } : null),
    }));
  };

  const validar = (): string | null => {
    const { nombre_sede, departamento, provincia, distrito, direccion, representante } = form;
    if (!nombre_sede.trim()) return "El nombre de la sede es obligatorio.";
    if (!departamento.trim()) return "El departamento es obligatorio.";
    if (!provincia.trim()) return "La provincia es obligatoria.";
    if (!distrito.trim()) return "El distrito es obligatorio.";
    if (!direccion.trim()) return "La dirección es obligatoria.";

    if (!representante.nombres.trim()) return "Los nombres del representante son obligatorios.";
    if (!representante.apellidos.trim()) return "Los apellidos del representante son obligatorios.";
    if (!representante.dni.trim()) return "El DNI del representante es obligatorio.";
    if (!representante.correo.trim()) return "El correo del representante es obligatorio.";
    if (!/^\S+@\S+\.\S+$/.test(representante.correo.trim())) return "El correo del representante no es válido.";
    return null;
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const err = validar();
    if (err) {
      setErrorMsg(err);
      return;
    }

    const { nombre_sede, departamento, provincia, distrito, direccion, representante } = form;
    const selectedDist = distritos.find((d) => d.code === distrito);
    const ciudad = selectedDist?.name || "";

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Payload para invitar representante de la sede (Courier)
      const payload: CrearSedeSecundariaCourierDTO = {
        nombre_sede: nombre_sede.trim(),
        departamento: departamento || null,
        provincia: provincia || null,
        ciudad,
        direccion: direccion.trim(),
        representante: {
          nombres: representante.nombres.trim(),
          apellidos: representante.apellidos.trim(),
          dni: representante.dni.trim(),
          celular: representante.celular ? representante.celular.trim() : null,
          correo: representante.correo.trim().toLowerCase(),
        },
      };

      await onSubmit(payload);       // Debe llamar al endpoint /almacenamientocourier/sedes
      onClose();                     // Solo cierra si fue exitoso
    } catch (e: any) {
      // Intenta leer message del backend si vino como JSON string
      try {
        const parsed = JSON.parse(e?.message);
        setErrorMsg(parsed?.message || "No se pudo crear la sede");
      } catch {
        setErrorMsg(e?.message || "No se pudo crear la sede");
      }
    } finally {
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
      className={`fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end ${
        isSubmitting ? "cursor-wait" : ""
      }`}
    >
      <div className="w-[520px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray20">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="mdi:warehouse" width={22} className="text-primaryDark" />
            <h2 className="text-xl font-bold uppercase text-[#1A253D]">Registrar nueva Sede</h2>
          </div>
          <p className="text-sm text-gray-600">
            Completa la información de la sede e invita a su representante por correo.
          </p>
        </div>

        {/* Body */}
        <form id="form-crear-sede" onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-6 text-sm">
          {/* Datos de sede */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon icon="mdi:office-building" />
              Datos de la sede
            </h3>

            <div>
              <label className={labelClass}>Nombre de la sede</label>
              <input
                type="text"
                name="nombre_sede"
                placeholder="Ej. Sede Secundaria"
                value={form.nombre_sede}
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
                  <option value="">
                    {loadingUbigeo ? "Cargando..." : "Seleccionar departamento"}
                  </option>
                  {departamentos.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  width={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
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
                  {provincias.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  width={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
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
                  {distritos.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  width={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
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
          </section>

          {/* Datos del representante */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon icon="mdi:account-badge" />
              Datos del representante
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombres</label>
                <input
                  type="text"
                  name="rep.nombres"
                  value={form.representante.nombres}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={isSubmitting}
                  placeholder="Juan Carlos"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Apellidos</label>
                <input
                  type="text"
                  name="rep.apellidos"
                  value={form.representante.apellidos}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={isSubmitting}
                  placeholder="Pérez Flores"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>DNI</label>
                <input
                  type="text"
                  name="rep.dni"
                  value={form.representante.dni}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={isSubmitting}
                  placeholder="12345678"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Celular (opcional)</label>
                <input
                  type="text"
                  name="rep.celular"
                  value={form.representante.celular}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={isSubmitting}
                  placeholder="9xxxxxxxx"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Correo</label>
                <input
                  type="email"
                  name="rep.correo"
                  value={form.representante.correo}
                  onChange={handleChange}
                  className={fieldClass}
                  disabled={isSubmitting}
                  placeholder="correo@dominio.com"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Se enviará una invitación al correo del representante para que cree su contraseña y active su cuenta.
            </p>
          </section>

          {errorMsg && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
              {errorMsg}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-gray20 flex items-center gap-2">
          <button
            type="submit"
            form="form-crear-sede"
            className={`text-white px-4 py-2 rounded hover:opacity-95 flex items-center gap-2 ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#1A253D]"
            }`}
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
            className={`px-4 py-2 text-sm border rounded ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
