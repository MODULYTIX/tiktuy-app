import { useEffect, useState } from "react";
import {
  registrarManualMotorizado,
  getAuthToken,
} from "@/services/courier/panel_control/panel_control.api";
import type {
  RegistroManualMotorizadoPayload,
  TipoVehiculo,
} from "@/services/courier/panel_control/panel_control.types";
import { TIPOS_VEHICULO } from "@/services/courier/panel_control/panel_control.types";

// 🧩 Tus componentes
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import { Selectx } from "@/shared/common/Selectx";

interface Props {
  onClose: () => void; // cerrar sin recargar
  onCreated?: () => void; // cerrar + recargar tabla (opcional)
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

export default function PanelControlRegistroRepartidor({
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInput = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handlePhoneChange = (v: string) => setPhoneLocal(v.replace(/\D/g, ""));

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
        if (onCreated) onCreated();
        else onClose();
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
    <div className="w-[460px] max-w-[92vw] h-full flex flex-col p-5 gap-5 text-[12px] bg-white">
      <Tittlex
        variant="modal"
        icon="mdi:clipboard-account-outline"
        title="REGISTRAR NUEVO REPARTIDOR"
        description="Completa el formulario para registrar un nuevo repartidor en la plataforma. Esta información habilitará su perfil logístico y permitirá monitorear sus entregas."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Inputx
              label="Nombre"
              name="nombre"
              placeholder="Ejem. Álvaro"
              value={form.nombres}
              onChange={(e) => handleInput("nombres", e.target.value)}
              className={errors.nombres ? "border-red-400" : ""}
              required
            />
            {errors.nombres && (
              <span className="text-[11px] text-red-500">{errors.nombres}</span>
            )}
          </div>

          <div>
            <Inputx
              label="Apellido"
              name="apellido"
              placeholder="Ejem. Maguiña"
              value={form.apellidos}
              onChange={(e) => handleInput("apellidos", e.target.value)}
              className={errors.apellidos ? "border-red-400" : ""}
              required
            />
            {errors.apellidos && (
              <span className="text-[11px] text-red-500">{errors.apellidos}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Inputx
              label="Licencia"
              name="licencia"
              placeholder="Ejem. A-1, B-2, etc."
              value={form.licencia}
              onChange={(e) => handleInput("licencia", e.target.value)}
              className={errors.licencia ? "border-red-400" : ""}
              required
            />
            {errors.licencia && (
              <span className="text-[11px] text-red-500">{errors.licencia}</span>
            )}
          </div>

          <div>
            <Inputx
              label="DNI"
              name="dni_ci"
              inputMode="numeric"
              placeholder="Ejem. 75643218"
              value={form.dni_ci}
              onChange={(e) => handleInput("dni_ci", e.target.value)}
              className={errors.dni_ci ? "border-red-400" : ""}
              required
            />
            {errors.dni_ci && (
              <span className="text-[11px] text-red-500">{errors.dni_ci}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <InputxPhone
              label="Teléfono"
              countryCode="+51"
              name="telefono"
              placeholder="Ejem. 987654321"
              value={phoneLocal}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={errors.telefono ? "border-red-400" : ""}
              required
            />
            {errors.telefono && (
              <span className="text-[11px] text-red-500">{errors.telefono}</span>
            )}
          </div>

          <div>
            <Inputx
              label="Correo"
              name="correo"
              type="email"
              placeholder="Ejem. correo@gmail.com"
              value={form.correo}
              onChange={(e) => handleInput("correo", e.target.value)}
              className={errors.correo ? "border-red-400" : ""}
              required
            />
            {errors.correo && (
              <span className="text-[11px] text-red-500">{errors.correo}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Selectx
              label="Tipo de Vehículo"
              name="tipo_vehiculo"
              labelVariant="left"
              value={form.tipo_vehiculo}
              onChange={(e) =>
                handleInput("tipo_vehiculo", e.target.value as TipoVehiculo | "")
              }
              placeholder="Selecciona una opción"
              className={errors.tipo_vehiculo ? "border-red-400" : ""}
              required
            >
              <option value="">Seleccionar opción</option>
              {TIPOS_VEHICULO.map((tv) => (
                <option key={tv} value={tv}>
                  {tv}
                </option>
              ))}
            </Selectx>
            {errors.tipo_vehiculo && (
              <span className="text-[11px] text-red-500">
                {errors.tipo_vehiculo}
              </span>
            )}
          </div>

          <div>
            <Inputx
              label="Placa"
              name="placa"
              placeholder="Ejem. ADV-835"
              value={form.placa}
              onChange={(e) => handleInput("placa", e.target.value)}
              className={errors.placa ? "border-red-400" : ""}
              required
            />
            {errors.placa && (
              <span className="text-[11px] text-red-500">{errors.placa}</span>
            )}
          </div>
        </div>

        {formError && <div className="text-[12px] text-red-600">{formError}</div>}

        <div className="mt-auto flex items-center gap-5">
          <Buttonx
            type="submit"
            variant="tertiary"
            disabled={loading}
            label={loading ? "Creando..." : "Crear nuevo"}
            icon={loading ? "line-md:loading-twotone-loop" : "mdi:content-save-outline"}
            className={`px-4 text-sm ${loading ? "[&_svg]:animate-spin" : ""}`}
          />
          <Buttonx
            type="button"
            variant="outlinedw"
            onClick={onClose}
            label="Cancelar"
            icon="mdi:close"
            className="px-4 text-sm border"
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
}
