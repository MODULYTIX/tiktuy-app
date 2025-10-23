import { useEffect, useMemo, useRef, useState } from "react";
import type { AlmacenCourierCreateDTO } from "@/services/courier/almacen/almacenCourier.type";

// 🧩 Tus componentes
import Tittlex from "@/shared/common/Tittlex";
import { Inputx } from "@/shared/common/Inputx";

import Buttonx from "@/shared/common/Buttonx";
import { Selectx } from "@/shared/common/Selectx";

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

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting) return; // no cerrar mientras envía
    if (e.target === overlayRef.current) onClose();
  };

  // Derivados
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isSubmitting) return;
    const { name, value } = e.target;
    setForm((prev) => ({
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

    const selectedDist = distritos.find((d) => d.code === distrito);
    const ciudad = selectedDist?.name || "";

    try {
      setIsSubmitting(true);
      await onSubmit({ nombre_almacen, departamento, ciudad, direccion });
      onClose(); // Cierra al terminar
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
      <div className="w-[480px] max-w-[92vw] h-full bg-white rounded-l-md shadow-lg flex flex-col gap-5 p-5">
        {/* Header con Tittlex */}
          <Tittlex
            variant="modal"
            icon="mdi:warehouse"
            title="REGISTRAR NUEVA SEDE"
            description="Complete la información para registrar una nueva sede."
          />


        {/* Body (form) usando tus componentes */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="h-full flex flex-col gap-5"
        >
          <Inputx
            label="Nombre de la Sede"
            name="nombre_almacen"
            placeholder="Ejem. Sede secundaria"
            value={form.nombre_almacen}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />

          <Selectx
            label="Departamento"
            name="departamento"
            labelVariant="left"
            value={form.departamento}
            onChange={handleChange}
            placeholder={loadingUbigeo ? "Cargando..." : "Seleccionar departamento"}
            disabled={loadingUbigeo || isSubmitting}
            required
          >
            {departamentos.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </Selectx>

          <Selectx
            label="Provincia"
            name="provincia"
            labelVariant="left"
            value={form.provincia}
            onChange={handleChange}
            placeholder="Seleccionar provincia"
            disabled={!form.departamento || loadingUbigeo || provincias.length === 0 || isSubmitting}
            required
          >
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Selectx>

          <Selectx
            label="Distrito (se guarda como ciudad)"
            name="distrito"
            labelVariant="left"
            value={form.distrito}
            onChange={handleChange}
            placeholder="Seleccionar distrito"
            disabled={!form.provincia || loadingUbigeo || distritos.length === 0 || isSubmitting}
            required
          >
            {distritos.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </Selectx>

          <Inputx
            label="Dirección"
            name="direccion"
            placeholder="Av. Los Próceres 1234, Urb. Santa Catalina, La Victoria, Lima"
            value={form.direccion}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </form>

        {/* Footer con Buttonx */}
        <div className="flex items-center gap-5">
          <Buttonx
            variant="quartery"
            disabled={isSubmitting}
            onClick={() => formRef.current?.requestSubmit()}
            label={isSubmitting ? "Creando..." : "Crear nuevo"}
            icon={isSubmitting ? "line-md:loading-twotone-loop" : undefined}
            className={`px-4 text-sm ${isSubmitting ? "[&_svg]:animate-spin" : ""}`}
          />
          <Buttonx
            variant="outlined"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm border"
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
