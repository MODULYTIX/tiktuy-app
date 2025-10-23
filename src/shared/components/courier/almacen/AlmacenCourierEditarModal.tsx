import { useEffect, useMemo, useRef, useState } from "react";
import type { AlmacenCourierCreateDTO } from "@/services/courier/almacen/almacenCourier.type";

// 🧩 Tus componentes
import Tittlex from "@/shared/common/Tittlex";
import { Inputx } from "@/shared/common/Inputx";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

type Ubigeo = { code: string; dep: string; prov: string; dist: string };

type FormData = {
  uuid?: string;
  nombre_almacen: string;
  departamento: string;
  provincia: string;
  distrito: string;   // (código ubigeo). Se guarda como ciudad (nombre) en el payload
  direccion: string;
  fecha_registro?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Nota: en la Page se pasa { distrito: seleccionado.ciudad }
  almacen: Partial<FormData> | null;
  onSubmit: (uuid: string, payload: AlmacenCourierCreateDTO) => Promise<void> | void;
}

export default function AlmacenCourierEditarModal({ isOpen, onClose, almacen, onSubmit }: Props) {
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

  // Precargar datos del almacén cuando tengamos ubigeos listos
  useEffect(() => {
    if (!isOpen) return;

    const dep = almacen?.departamento ?? "";
    const ciudad = almacen?.distrito ?? ""; // en Page: distrito = ciudad BD
    // Derivar provincia a partir de dep + ciudad
    const prov = (() => {
      if (!dep || !ciudad || ubigeos.length === 0) return "";
      const match = ubigeos.find((u) => u.dep === dep && u.dist === ciudad);
      return match?.prov ?? "";
    })();

    setForm({
      uuid: almacen?.uuid,
      nombre_almacen: almacen?.nombre_almacen ?? "",
      departamento: dep,
      provincia: prov,
      distrito: (() => {
        if (!dep || !ciudad) return "";
        const m = ubigeos.find((u) => u.dep === dep && u.prov === prov && u.dist === ciudad);
        return m?.code ?? "";
      })(),
      direccion: almacen?.direccion ?? "",
      fecha_registro: almacen?.fecha_registro,
    });
    setIsSubmitting(false);
  }, [isOpen, almacen, ubigeos]);

  // Cerrar con ESC (bloqueado si enviando)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, isSubmitting]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
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

    const uuid = form.uuid || almacen?.uuid || "";
    if (!uuid) {
      console.warn("Falta el identificador de la sede");
      return;
    }

    const { nombre_almacen, departamento, provincia, distrito, direccion } = form;
    if (!nombre_almacen || !departamento || !provincia || !distrito || !direccion) {
      console.warn("Complete todos los campos obligatorios");
      return;
    }

    const selectedDist = distritos.find((d) => d.code === distrito);
    const ciudad = selectedDist?.name || "";

    try {
      setIsSubmitting(true);
      await onSubmit(uuid, { nombre_almacen, departamento, ciudad, direccion });
      onClose(); // cerrar solo después de terminar
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
          title="EDITAR SEDE"
          description="Actualice la información de la sede y guarde los cambios."
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
            label="Ciudad"
            name="distrito"
            labelVariant="left"
            value={form.distrito}
            onChange={handleChange}
            placeholder="Seleccionar ciudad"
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
            label={isSubmitting ? "Actualizando..." : "Actualizar"}
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
