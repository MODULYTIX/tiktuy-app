import { useState } from "react";
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
  onClose: () => void;
}

// Estado local que permite 'tipo_vehiculo' vacío hasta que el usuario seleccione
type FormState = Omit<RegistroManualMotorizadoPayload, "tipo_vehiculo"> & {
  tipo_vehiculo: TipoVehiculo | "";
};

const initialForm: FormState = {
  nombres: "",
  apellidos: "",
  dni_ci: "",
  correo: "",
  telefono: "", // lo sobreescribimos con +51 + phoneLocal en submit
  licencia: "",
  placa: "",
  tipo_vehiculo: "", // el usuario debe elegir
};

export default function PanelControlRegistroRepartidor({ onClose }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [phoneLocal, setPhoneLocal] = useState<string>(""); // sólo dígitos después del +51
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleInput<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhoneChange(v: string) {
    // Normaliza: sólo dígitos
    const digits = v.replace(/\D/g, "");
    setPhoneLocal(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = getAuthToken();
    if (!token) {
      setErrorMsg("No se encontró el token de autenticación.");
      return;
    }

    // compone el teléfono con +51 si hay valor
    const telefonoCompleto =
      phoneLocal.trim().length > 0 ? `+51 ${phoneLocal.trim()}` : "";

    // Validación mínima en cliente
    const requiredKeys: (keyof FormState)[] = [
      "nombres",
      "apellidos",
      "dni_ci",
      "correo",
      "licencia",
      "placa",
    ];
    const missingBase = requiredKeys.filter(
      (k) => String(form[k] ?? "").trim() === ""
    );
    if (missingBase.length > 0) {
      setErrorMsg("Por favor completa todos los campos obligatorios.");
      return;
    }
    if (!telefonoCompleto) {
      setErrorMsg("El teléfono es obligatorio.");
      return;
    }
    if (!form.tipo_vehiculo) {
      setErrorMsg("Debes seleccionar el tipo de vehículo.");
      return;
    }

    const payload: RegistroManualMotorizadoPayload = {
      ...form,
      telefono: telefonoCompleto,
      // aquí garantizamos el tipo exacto del enum
      tipo_vehiculo: form.tipo_vehiculo as TipoVehiculo,
    };

    try {
      setLoading(true);
      const res = await registrarManualMotorizado(payload, token);
      if (res.ok) {
        setSuccessMsg(res.data.mensaje);
        // reset
        setForm(initialForm);
        setPhoneLocal("");
        // Si deseas cerrar automáticamente:
        // onClose();
      } else {
        setErrorMsg(res.error || "No se pudo registrar el repartidor.");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Título */}
      <div className="flex items-center gap-2 mb-2">
        <Icon icon="mdi:store-plus" className="text-[#1A237E]" />
        <h2 className="text-lg font-bold text-[#1A237E] uppercase">
          Registrar Nuevo Repartidor
        </h2>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-4">
        Completa el formulario para registrar un nuevo repartidor en la
        plataforma. Esta información permitirá habilitar su perfil logístico,
        monitorear sus entregas y garantizar una correcta operación durante el
        proceso de distribución.
      </p>

      {/* Alertas */}
      {errorMsg && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          {successMsg}
        </div>
      )}

      {/* Formulario */}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Nombre</label>
          <input
            type="text"
            placeholder="Ejem. Álvaro"
            className="w-full border rounded px-3 py-2 text-sm"
            autoComplete="given-name"
            value={form.nombres}
            onChange={(e) => handleInput("nombres", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Apellido</label>
          <input
            type="text"
            placeholder="Ejem. Maguiña"
            className="w-full border rounded px-3 py-2 text-sm"
            autoComplete="family-name"
            value={form.apellidos}
            onChange={(e) => handleInput("apellidos", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">DNI / CI</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ejem. 87654321"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.dni_ci}
            onChange={(e) => handleInput("dni_ci", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Correo</label>
          <input
            type="email"
            placeholder="correo@gmail.com"
            className="w-full border rounded px-3 py-2 text-sm"
            autoComplete="email"
            value={form.correo}
            onChange={(e) => handleInput("correo", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Teléfono</label>
          <div className="flex items-center gap-2">
            <span className="px-2 py-2 border rounded text-sm bg-gray-100">
              +51
            </span>
            <input
              type="text"
              inputMode="tel"
              placeholder="Ejem. 987654321"
              className="w-full border rounded px-3 py-2 text-sm"
              value={phoneLocal}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Licencia</label>
          <input
            type="text"
            placeholder="Ejem. ABC123"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.licencia}
            onChange={(e) => handleInput("licencia", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Placa</label>
          <input
            type="text"
            placeholder="Ejem. ADV-835"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.placa}
            onChange={(e) => handleInput("placa", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Tipo de Vehículo
          </label>
          <select
            className="w-full border rounded px-3 py-2 text-sm bg-white"
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
        </div>

        {/* Botones */}
        <div className="md:col-span-2 mt-2 flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1A237E] text-white px-4 py-2 rounded text-sm hover:bg-[#0d174f] transition disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear nuevo"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
