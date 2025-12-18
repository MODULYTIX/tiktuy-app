import { useState } from "react";
import {
  registrarManualEcommerce,
  getAuthToken,
} from "@/services/courier/panel_control/panel_control.api";
import type { RegistroManualPayload } from "@/services/courier/panel_control/panel_control.types";
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxPhone } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";

interface Props {
  onClose: () => void;
}

const initialForm: RegistroManualPayload = {
  nombres: "",
  apellidos: "",
  dni_ci: "",
  correo: "",
  telefono: "",
  nombre_comercial: "",
  ruc: "",
  ciudad: "",
  direccion: "",
  rubro: "",
};

export default function PanelControlRegistroEcommerce({ onClose }: Props) {
  const [form, setForm] = useState<RegistroManualPayload>(initialForm);
  const [phoneLocal, setPhoneLocal] = useState<string>(""); // solo dígitos después del +51
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleInput = <K extends keyof RegistroManualPayload>(
    key: K,
    value: RegistroManualPayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhoneChange = (v: string) => {
    setPhoneLocal(v.replace(/\D/g, ""));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = getAuthToken();
    if (!token) {
      setErrorMsg("No se encontró el token de autenticación.");
      return;
    }

    const telefonoCompleto =
      phoneLocal.trim().length > 0 ? `+51 ${phoneLocal.trim()}` : "";

    const payload: RegistroManualPayload = {
      ...form,
      telefono: telefonoCompleto,
    };

    const required: (keyof RegistroManualPayload)[] = [
      "nombres",
      "apellidos",
      "dni_ci",
      "correo",
      "telefono",
      "nombre_comercial",
      "ruc",
      "ciudad",
      "direccion",
      "rubro",
    ];

    const missing = required.filter((k) => String(payload[k] ?? "").trim() === "");
    if (missing.length > 0) {
      setErrorMsg("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      const res = await registrarManualEcommerce(payload, token);

      if (res.ok) {
        setSuccessMsg(res.data.mensaje);
        setForm(initialForm);
        setPhoneLocal("");
        // onClose();
      } else {
        setErrorMsg(res.error || "No se pudo registrar el ecommerce.");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-[460px] max-w-[92vw] h-full flex flex-col p-5 gap-5 text-[12px] bg-white">
      {/* Header */}
      <Tittlex
        variant="modal"
        icon="lucide:layout-panel-top"
        title="REGISTRAR NUEVO ECOMMERCE"
        description="Completa el formulario para registrar un nuevo ecommerce en la plataforma, garantizando su integración adecuada al sistema para futuras operaciones, gestiones y monitoreos."
      />

      {/* Alertas */}
      {errorMsg && (
        <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="text-[12px] text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          {successMsg}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 flex-1">
        <div className="flex flex-col h-full gap-5 w-full">
          {/* Fila 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Inputx
              label="Nombre"
              name="nombre"
              placeholder="Ejem. Alvaro"
              value={form.nombres}
              onChange={(e) => handleInput("nombres", e.target.value)}
              required
            />
            <Inputx
              label="Apellido"
              name="apellido"
              placeholder="Ejem. Maguiña"
              value={form.apellidos}
              onChange={(e) => handleInput("apellidos", e.target.value)}
              required
            />
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Inputx
              label="DNI / CI"
              name="dni"
              inputMode="numeric"
              placeholder="Ejem. 87654321"
              value={form.dni_ci}
              onChange={(e) => handleInput("dni_ci", e.target.value)}
              required
            />
            <Inputx
              label="Correo"
              name="email"
              placeholder="correo@gmail.com"
              value={form.correo}
              onChange={(e) => handleInput("correo", e.target.value)}
              required
            />
          </div>

          {/* Fila 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputxPhone
              label="Teléfono"
              countryCode="+51"
              name="telefono"
              placeholder="Ejem. 987654321"
              value={phoneLocal}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
            />
            <Inputx
              label="Nombre Comercial"
              name="comercial"
              placeholder="Ejem. Electrosur"
              value={form.nombre_comercial}
              onChange={(e) => handleInput("nombre_comercial", e.target.value)}
              required
            />
          </div>

          {/* Fila 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Inputx
              label="RUC"
              name="ruc"
              placeholder="Ejem. 10234567891"
              value={form.ruc}
              onChange={(e) => handleInput("ruc", e.target.value)}
              required
            />
            <Inputx
              label="Ciudad"
              name="ciudad"
              placeholder="Ejem. Arequipa"
              value={form.ciudad}
              onChange={(e) => handleInput("ciudad", e.target.value)}
              required
            />
          </div>

          {/* Fila 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Inputx
              label="Dirección"
              name="address"
              placeholder="Ejem. Av. Belgrano"
              value={form.direccion}
              onChange={(e) => handleInput("direccion", e.target.value)}
              required
            />
            <Inputx
              label="Rubro"
              name="rubro"
              placeholder="Ejem. Electricidad"
              value={form.rubro}
              onChange={(e) => handleInput("rubro", e.target.value)}
              required
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-5 mt-auto">
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
