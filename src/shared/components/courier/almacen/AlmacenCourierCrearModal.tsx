import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

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
  // onSubmit debe llamar a crearSedeSecundariaConInvitacion(payload)
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
              tmp.push({
                code: meta.ubigeo,
                dep: depName,
                prov: provName,
                dist: distName,
              });
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
      new Set(
        ubigeos.filter((u) => u.dep === form.departamento).map((u) => u.prov)
      )
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
    const {
      nombre_sede,
      departamento,
      provincia,
      distrito,
      direccion,
      representante,
    } = form;
    if (!nombre_sede.trim()) return "El nombre de la sede es obligatorio.";
    if (!departamento.trim()) return "El departamento es obligatorio.";
    if (!provincia.trim()) return "La provincia es obligatoria.";
    if (!distrito.trim()) return "El distrito es obligatorio.";
    if (!direccion.trim()) return "La dirección es obligatoria.";

    if (!representante.nombres.trim())
      return "Los nombres del representante son obligatorios.";
    if (!representante.apellidos.trim())
      return "Los apellidos del representante son obligatorios.";
    if (!representante.dni.trim())
      return "El DNI del representante es obligatorio.";
    if (!representante.correo.trim())
      return "El correo del representante es obligatorio.";
    if (!/^\S+@\S+\.\S+$/.test(representante.correo.trim()))
      return "El correo del representante no es válido.";
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

    const {
      nombre_sede,
      departamento,
      provincia,
      distrito,
      direccion,
      representante,
    } = form;
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

      await onSubmit(payload); // Debe llamar al endpoint /almacenamientocourier/sedes
      onClose(); // Solo cierra si fue exitoso
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

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end ${
        isSubmitting ? "cursor-wait" : ""
      }`}
    >
      <div className="w-[460px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col gap-5 p-5 ">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="hugeicons:warehouse"
          title="Registrar nueva Sede"
          description="Completa la información de la sede e invita a su representante por correo."
        />

        {/* Body + Footer dentro del FORM */}
        <form
          id="form-crear-sede"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 h-full over overflow-auto"
        >
          {/* Datos de sede */}
          <section className="flex flex-col gap-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon icon="mdi:office-building" /> Datos de la sede
            </h3>

            <Inputx
              label="Nombre de la sede"
              name="nombre_sede"
              placeholder="Ej. Sede Secundaria"
              value={form.nombre_sede}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />

            <div className="flex gap-5">
              {/* DEPARTAMENTO */}
              <Selectx
                label="Departamento"
                labelVariant="left"
                name="departamento"
                value={form.departamento}
                onChange={handleChange}
                placeholder={
                  loadingUbigeo ? "Cargando..." : "Seleccionar departamento"
                }
                disabled={loadingUbigeo || isSubmitting}
                required
              >
                {departamentos.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </Selectx>

              {/* PROVINCIA */}
              <Selectx
                label="Provincia"
                labelVariant="left"
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
                placeholder="Seleccionar provincia"
                disabled={
                  !form.departamento ||
                  loadingUbigeo ||
                  provincias.length === 0 ||
                  isSubmitting
                }
                required
              >
                {provincias.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Selectx>
            </div>

            {/* DISTRITO */}
            <Selectx
              label="Distrito (se guarda como ciudad)"
              labelVariant="left"
              name="distrito"
              value={form.distrito}
              onChange={handleChange}
              placeholder="Seleccionar distrito"
              disabled={
                !form.provincia ||
                loadingUbigeo ||
                distritos.length === 0 ||
                isSubmitting
              }
              required
            >
              {distritos.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </Selectx>

            {/* DIRECCIÓN */}
            <Inputx
              label="Dirección"
              name="direccion"
              placeholder="Av. Los Próceres 1234, Urb. Santa Catalina, La Victoria, Lima"
              value={form.direccion}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </section>

          {/* Datos del representante */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Icon icon="mdi:account-badge" />
                Datos del representante
              </h3>

              <p className="text-xs text-gray-500">
                Se enviará una invitación al correo del representante para que
                cree su contraseña y active su cuenta.
              </p>
            </div>

            <div className="flex gap-5">
              <Inputx
                label="Nombres"
                name="rep.nombres"
                value={form.representante.nombres}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Juan Carlos"
                required
              />

              {/* APELLIDOS */}
              <Inputx
                label="Apellidos"
                name="rep.apellidos"
                value={form.representante.apellidos}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Pérez Flores"
                required
              />
            </div>

            <div className="flex gap-5">
              <Inputx
                label="DNI"
                name="rep.dni"
                value={form.representante.dni}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="12345678"
                required
              />

              {/* CELULAR */}
              <InputxPhone
                label="Celular (opcional)"
                countryCode="+51"
                name="rep.celular"
                value={form.representante.celular}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="9xxxxxxxx"
              />
            </div>

            <div className="sm:col-span-2">
              <Inputx
                label="Correo"
                type="email"
                name="rep.correo"
                value={form.representante.correo}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="correo@dominio.com"
                required
              />
            </div>
          </section>

          {errorMsg && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Footer dentro del form */}
          <div className="flex gap-5 mt-2">
            <Buttonx
              type="submit"
              variant="secondary"
              disabled={isSubmitting}
              className="px-4"
              label={isSubmitting ? "Creando..." : "Crear nuevo"}
              icon={isSubmitting ? "svg-spinners:180-ring" : undefined}
              iconPosition="left"
            />

            <Buttonx
              type="button"
              variant="outlinedw"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4"
              label="Cancelar"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
