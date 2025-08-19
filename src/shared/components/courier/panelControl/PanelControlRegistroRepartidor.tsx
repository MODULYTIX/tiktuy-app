import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import {
  registrarManualMotorizado,
  getAuthToken,
} from "@/services/courier/panel_control/panel_control.api";
import type {
  RegistroManualMotorizadoPayload,
  TipoVehiculo,
} from "@/services/courier/panel_control/panel_control.types";
import { TIPOS_VEHICULO } from "@/services/courier/panel_control/panel_control.types";

interface Props {
  onClose: () => void;        // cerrar sin recargar
  onCreated?: () => void;     // cerrar + recargar tabla (opcional)
}

type FormState = Omit<RegistroManualMotorizadoPayload, "tipo_vehiculo"> & {
  tipo_vehiculo: TipoVehiculo | "";
};

const initialForm: FormState = {
  nombres: "",
  apellidos: "",
  dni_ci: "",
  correo: "",
  telefono: "",
  licencia: "",
  placa: "",
  tipo_vehiculo: "",
};

type Errors = Partial<
  Record<
    | "nombres"
    | "apellidos"
    | "dni_ci"
    | "correo"
    | "telefono"
    | "licencia"
    | "placa"
    | "tipo_vehiculo",
    string
  >
>;

export default function PanelControlRegistroRepartidor({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInput = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handlePhoneChange = (v: string) =>
    setPhoneLocal(v.replace(/\D/g, ""));

  const validate = (f: FormState, phone: string): Errors => {
    const e: Errors = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!f.nombres.trim()) e.nombres = "Requerido.";
    if (!f.apellidos.trim()) e.apellidos = "Requerido.";

    const dni = f.dni_ci.replace(/\D/g, "");
    if (!dni) e.dni_ci = "Requerido.";
    else if (dni.length !== 8) e.dni_ci = "Debe tener 8 dígitos.";

    if (!f.correo.trim()) e.correo = "Requerido.";
    else if (!emailRx.test(f.correo)) e.correo = "Correo inválido.";

    const phoneDigits = phone.replace(/\D/g, "");
    if (!phoneDigits) e.telefono = "Requerido.";
    else if (phoneDigits.length !== 9)
      e.telefono = "El teléfono debe tener 9 dígitos.";

    if (!f.licencia.trim()) e.licencia = "Requerido.";
    if (!f.placa.trim()) e.placa = "Requerido.";
    else if (f.placa.trim().length < 5)
      e.placa = "La placa debe tener al menos 5 caracteres.";

    if (!f.tipo_vehiculo) e.tipo_vehiculo = "Selecciona una opción.";
    return e;
  };

  useEffect(() => {
    if (!submitted) return;
    setErrors(validate(form, phoneLocal));
  }, [submitted, form, phoneLocal]);

  const inputClass = (invalid?: boolean) =>
    [
      "h-10 px-3 rounded-md border bg-white text-gray90 text-[12px] placeholder:text-gray60",
      "focus:outline-none focus:ring-1 focus:ring-gray90 focus:border-gray90",
      invalid ? "border-red-400" : "border-gray30",
    ].join(" ");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const errs = validate(form, phoneLocal);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const token = getAuthToken();
    if (!token) {
      setFormError("Sesión no válida. Vuelve a iniciar sesión.");
      return;
    }

    const payload: RegistroManualMotorizadoPayload = {
      ...form,
      telefono: `+51 ${phoneLocal.trim()}`,
      tipo_vehiculo: form.tipo_vehiculo as TipoVehiculo,
    };

    try {
      setLoading(true);
      const res = await registrarManualMotorizado(payload, token);
      if (res.ok) {
        // 👇 solo aquí disparas la recarga (si el padre te pasó onCreated)
        if (onCreated) onCreated();
        else onClose(); // fallback: si no te pasan onCreated, solo cierra
      } else {
        setFormError(res.error || "No se pudo registrar.");
      }
    } catch {
      setFormError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Contenedor padre con padding y separación entre bloques
    <div className="w-full h-full max-w-[720px] flex flex-col p-5 gap-5 text-[12px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primaryDark">
          <Icon icon="mdi:clipboard-account-outline" width={22} height={22} />
          <h2 className="text-[20px] font-bold uppercase">
            REGISTRAR NUEVO REPARTIDOR
          </h2>
        </div>
        <p className="text-[12px] text-gray60 leading-relaxed mt-2">
          Completa el formulario para registrar un nuevo repartidor en la
          plataforma. Esta información permitirá habilitar su perfil logístico,
          monitorear sus entregas y garantizar una correcta operación durante el
          proceso de distribución.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        {/* Bloque 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Nombre</label>
            <input
              type="text"
              placeholder="Ejem. Álvaro"
              className={inputClass(!!errors.nombres)}
              value={form.nombres}
              onChange={(e) => handleInput("nombres", e.target.value)}
            />
            {errors.nombres && (
              <span className="text-[11px] text-red-500">{errors.nombres}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Apellido</label>
            <input
              type="text"
              placeholder="Ejem. Maguiña"
              className={inputClass(!!errors.apellidos)}
              value={form.apellidos}
              onChange={(e) => handleInput("apellidos", e.target.value)}
            />
            {errors.apellidos && (
              <span className="text-[11px] text-red-500">
                {errors.apellidos}
              </span>
            )}
          </div>
        </div>

        {/* Bloque 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Licencia</label>
            <input
              type="text"
              placeholder="Ejem. Motorista"
              className={inputClass(!!errors.licencia)}
              value={form.licencia}
              onChange={(e) => handleInput("licencia", e.target.value)}
            />
            {errors.licencia && (
              <span className="text-[11px] text-red-500">{errors.licencia}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">DNI</label>
            <input
              type="text"
              placeholder="Ejem. 756432189"
              className={inputClass(!!errors.dni_ci)}
              value={form.dni_ci}
              onChange={(e) => handleInput("dni_ci", e.target.value)}
            />
            {errors.dni_ci && (
              <span className="text-[11px] text-red-500">{errors.dni_ci}</span>
            )}
          </div>
        </div>

        {/* Bloque 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Teléfono</label>
            <div
              className={`flex items-center h-10 rounded-md overflow-hidden border bg-white ${
                errors.telefono ? "border-red-400" : "border-gray30"
              }`}
            >
              <span className="w-[56px] shrink-0 grid place-items-center text-gray70 text-[12px] border-r border-gray30">
                + 51
              </span>
              <input
                type="text"
                placeholder="Ejem. 987654321"
                className="flex-1 h-full px-3 bg-transparent text-gray90 text-[12px] focus:outline-none placeholder:text-gray60"
                value={phoneLocal}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>
            {errors.telefono && (
              <span className="text-[11px] text-red-500">
                {errors.telefono}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Correo</label>
            <input
              type="email"
              placeholder="Ejem. correo@gmail.com"
              className={inputClass(!!errors.correo)}
              value={form.correo}
              onChange={(e) => handleInput("correo", e.target.value)}
            />
            {errors.correo && (
              <span className="text-[11px] text-red-500">{errors.correo}</span>
            )}
          </div>
        </div>

        {/* Bloque 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Tipo de Vehículo</label>
            <select
              className={inputClass(!!errors.tipo_vehiculo)}
              value={form.tipo_vehiculo}
              onChange={(e) =>
                handleInput("tipo_vehiculo", e.target.value as TipoVehiculo | "")
              }
            >
              <option value="">Selecciona una opción</option>
              {TIPOS_VEHICULO.map((tv) => (
                <option key={tv} value={tv}>
                  {tv}
                </option>
              ))}
            </select>
            {errors.tipo_vehiculo && (
              <span className="text-[11px] text-red-500">
                {errors.tipo_vehiculo}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray80 font-medium">Placa</label>
            <input
              type="text"
              placeholder="Ejem. ADV-835"
              className={inputClass(!!errors.placa)}
              value={form.placa}
              onChange={(e) => handleInput("placa", e.target.value)}
            />
            {errors.placa && (
              <span className="text-[11px] text-red-500">{errors.placa}</span>
            )}
          </div>
        </div>

        {/* Error backend */}
        {formError && (
          <div className="text-[12px] text-red-600">{formError}</div>
        )}

        {/* Botones → siempre abajo */}
        <div className="mt-auto flex gap-5">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray90 text-white px-4 py-2 rounded text-[12px] hover:bg-gray70 transition disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear nuevo"}
          </button>
          <button
            type="button"
            onClick={onClose} // 👈 solo cierra; NO recarga
            className="border border-gray30 px-4 py-2 rounded text-[12px] hover:bg-gray10 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
