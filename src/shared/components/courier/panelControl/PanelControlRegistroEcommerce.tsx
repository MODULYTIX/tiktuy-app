import { useState } from "react";
import { Icon } from "@iconify/react";
import { registrarManualEcommerce, getAuthToken } from "@/services/courier/panel_control/panel_control.api";
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
  const [phoneLocal, setPhoneLocal] = useState<string>(""); // solo los dígitos luego del +51
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleInput<K extends keyof RegistroManualPayload>(
    key: K,
    value: RegistroManualPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

    // compone el teléfono con +51 sólo si hay valor
    const telefonoCompleto =
      phoneLocal.trim().length > 0 ? `+51 ${phoneLocal.trim()}` : "";

    const payload: RegistroManualPayload = {
      ...form,
      telefono: telefonoCompleto,
    };

    // validación mínima en cliente
    const requiredKeys: (keyof RegistroManualPayload)[] = [
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
    const missing = requiredKeys.filter(
      (k) => String(payload[k] ?? "").trim() === ""
    );
    if (missing.length > 0) {
      setErrorMsg("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      const res = await registrarManualEcommerce(payload, token);
      if (res.ok) {
        setSuccessMsg(res.data.mensaje);
        // opcional: resetear y cerrar
        setForm(initialForm);
        setPhoneLocal("");
        // Si prefieres cerrar automáticamente tras éxito, descomenta:
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
    <div>
      {/* Título */}
      <div className="flex items-center gap-2 mb-2">
        <Icon icon="mdi:store-plus" className="text-[#1A237E]" />
        <h2 className="text-lg font-bold text-[#1A237E] uppercase">
          Registrar Nuevo Ecommerce
        </h2>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-4">
        Completa el formulario para registrar un nuevo ecommerce en la
        plataforma. Se enviará un correo para que el ecommerce complete su
        contraseña.
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
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Nombre</label>
          <input
            type="text"
            placeholder="Ejem. Álvaro"
            className="w-full border rounded px-3 py-2 text-sm"
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
            value={form.apellidos}
            onChange={(e) => handleInput("apellidos", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">DNI / CI</label>
          <input
            type="text"
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
              onChange={(e) => setPhoneLocal(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Nombre Comercial
          </label>
          <input
            type="text"
            placeholder="Ejem. Electrosur"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.nombre_comercial}
            onChange={(e) => handleInput("nombre_comercial", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">RUC</label>
          <input
            type="text"
            placeholder="Ejem. 10234567891"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.ruc}
            onChange={(e) => handleInput("ruc", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">Ciudad</label>
          <input
            type="text"
            placeholder="Ejem. Arequipa"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.ciudad}
            onChange={(e) => handleInput("ciudad", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Dirección</label>
          <input
            type="text"
            placeholder="Ejem. Av. Belgrano"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.direccion}
            onChange={(e) => handleInput("direccion", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 mb-1 block">Rubro</label>
          <input
            type="text"
            placeholder="Ejem. Electricidad"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.rubro}
            onChange={(e) => handleInput("rubro", e.target.value)}
          />
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
