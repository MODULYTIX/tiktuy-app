  import { useState } from "react";
  import { Icon } from "@iconify/react";
  import {
    registrarManualEcommerce,
    getAuthToken,
  } from "@/services/courier/panel_control/panel_control.api";
  import type { RegistroManualPayload } from "@/services/courier/panel_control/panel_control.types";

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
      // normaliza a solo dígitos
      setPhoneLocal(v.replace(/\D/g, ""));
    };

    // estilos de inputs (mismos que el modal de repartidor)
    const inputClass =
      "h-10 px-3 rounded-md border bg-white text-gray90 text-[12px] placeholder:text-gray50 border-gray30 focus:outline-none focus:ring-1 focus:ring-gray90 focus:border-gray90";

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

      // validación mínima (como tu versión original)
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
          // reset opcional
          setForm(initialForm);
          setPhoneLocal("");
          // Si deseas cerrar automáticamente:
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
      // Contenedor padre: padding 20 y separación 20 entre bloques
      <div className="w-full h-full max-w-[720px] flex flex-col p-5 gap-5 text-[12px]">
        {/* Header */}
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-primaryDark">
            <Icon icon="mdi:store-plus" width={22} height={22} />
            <h2 className="text-[20px] font-bold uppercase">REGISTRAR NUEVO ECOMMERCE</h2>
          </div>
          <p className="text-[12px] text-gray60 leading-relaxed">
            Completa el formulario para registrar un nuevo ecommerce en la plataforma.
            Se enviará un correo para que el ecommerce complete su contraseña.
          </p>
        </div>

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

        {/* Formulario (crece) */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
          {/* Fila 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Nombre</label>
              <input
                type="text"
                placeholder="Ejem. Álvaro"
                className={inputClass}
                value={form.nombres}
                onChange={(e) => handleInput("nombres", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Apellido</label>
              <input
                type="text"
                placeholder="Ejem. Maguiña"
                className={inputClass}
                value={form.apellidos}
                onChange={(e) => handleInput("apellidos", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">DNI / CI</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ejem. 87654321"
                className={inputClass}
                value={form.dni_ci}
                onChange={(e) => handleInput("dni_ci", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Correo</label>
              <input
                type="email"
                placeholder="correo@gmail.com"
                className={inputClass}
                value={form.correo}
                onChange={(e) => handleInput("correo", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Teléfono</label>
              <div className="flex items-center h-10 rounded-md overflow-hidden border bg-white border-gray30">
                <span className="w-[56px] shrink-0 grid place-items-center text-gray70 text-[12px] border-r border-gray30">
                  + 51
                </span>
                <input
                  type="text"
                  inputMode="tel"
                  placeholder="Ejem. 987654321"
                  className="flex-1 h-full px-3 bg-transparent text-gray90 text-[12px] focus:outline-none placeholder:text-gray50"
                  value={phoneLocal}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Nombre Comercial</label>
              <input
                type="text"
                placeholder="Ejem. Electrosur"
                className={inputClass}
                value={form.nombre_comercial}
                onChange={(e) => handleInput("nombre_comercial", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">RUC</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ejem. 10234567891"
                className={inputClass}
                value={form.ruc}
                onChange={(e) => handleInput("ruc", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray80 font-medium">Ciudad</label>
              <input
                type="text"
                placeholder="Ejem. Arequipa"
                className={inputClass}
                value={form.ciudad}
                onChange={(e) => handleInput("ciudad", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 5 (2 columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-gray80 font-medium">Dirección</label>
              <input
                type="text"
                placeholder="Ejem. Av. Belgrano"
                className={inputClass}
                value={form.direccion}
                onChange={(e) => handleInput("direccion", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 6 (2 columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-gray80 font-medium">Rubro</label>
              <input
                type="text"
                placeholder="Ejem. Electricidad"
                className={inputClass}
                value={form.rubro}
                onChange={(e) => handleInput("rubro", e.target.value)}
              />
            </div>
          </div>

          {/* Botones (siempre abajo/izquierda) */}
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
              onClick={onClose}
              className="border border-gray30 px-4 py-2 rounded text-[12px] hover:bg-gray10 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }
