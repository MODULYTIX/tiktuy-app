// src/shared/components/courier/zona-tarifaria/NewZonaTarifariaDrawer.tsx
import { useEffect, useState } from "react";
import type React from "react";
import { crearZonaTarifariaParaMiUsuario } from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";

import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxNumber } from "@/shared/common/Inputx";

type Props = {
  open: boolean;
  zonasOpciones?: string[];
  onClose: () => void;
  onCreated?: () => void;
};

type CreateForm = {
  ciudad: string;          // se envía como "ciudad" al backend (se guarda en distrito)
  zona_tarifario: string;
  tarifa_cliente: string;
  pago_motorizado: string;
  estado_id: string;       // opcional: si no lo mandas, backend usa "Activo/zona"
};

const ESTADOS_ZONA = [
  { id: 28, nombre: "Activo" },
  { id: 29, nombre: "Inactivo" },
];

export default function NewZonaTarifariaDrawer({
  open,
  zonasOpciones = ["1", "2", "3", "4", "5", "6"],
  onClose,
  onCreated,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<CreateForm>({
    ciudad: "",
    zona_tarifario: "",
    tarifa_cliente: "",
    pago_motorizado: "",
    estado_id: String(ESTADOS_ZONA[0].id),
  });

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) {
      setErr(null);
      setForm({
        ciudad: "",
        zona_tarifario: "",
        tarifa_cliente: "",
        pago_motorizado: "",
        estado_id: String(ESTADOS_ZONA[0].id),
      });
    }
  }, [open]);

  function handleChange<K extends keyof CreateForm>(k: K, v: CreateForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCreate() {
    setErr(null);

    const token = getAuthToken();
    if (!token) {
      setErr("No se encontró el token de autenticación.");
      return;
    }

    if (!form.ciudad.trim()) {
      setErr("El distrito es obligatorio.");
      return;
    }
    if (!form.zona_tarifario.trim()) {
      setErr("La zona es obligatoria.");
      return;
    }

    const tarifa = Number(form.tarifa_cliente);
    const pago = Number(form.pago_motorizado);
    const estadoId = Number(form.estado_id);

    if (Number.isNaN(tarifa) || Number.isNaN(pago)) {
      setErr("Tarifa y Pago deben ser numéricos válidos.");
      return;
    }

    setSaving(true);
    const res = await crearZonaTarifariaParaMiUsuario(
      {
        ciudad: form.ciudad.trim(),
        zona_tarifario: form.zona_tarifario.trim(),
        tarifa_cliente: tarifa,
        pago_motorizado: pago,
        estado_id: estadoId, // si quieres que backend decida por defecto, podrías omitirlo
      },
      token
    );
    setSaving(false);

    if (!res.ok) {
      setErr(res.error || "No se pudo crear la zona tarifaria.");
      return;
    }

    onCreated?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
      />

      {/* Drawer derecho */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-5 flex flex-col gap-5 overflow-y-auto">
        <Tittlex
          variant="modal"
          icon="solar:point-on-map-broken"
          title="NUEVO DISTRITO DE ATENCIÓN"
          description="Registra una nueva distrito en la que brindaremos atención logística. Asigna su zona correspondiente, define el tarifario por envío y especifica el pago destinado al motorizado que realizará las entregas."
        />

        {err && (
          <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        {/* Formulario */}
        <div className="h-full flex flex-col gap-5">
          <div className="flex gap-5">
            <Inputx
              label="Distrito"
              placeholder="Ej. Arequipa, Lima, Cusco"
              value={form.ciudad}
              onChange={(e) => handleChange("ciudad", e.target.value)}
            />

            <Selectx
              label="Zona"
              placeholder="Seleccionar zona"
              value={form.zona_tarifario}
              onChange={(e) =>
                handleChange(
                  "zona_tarifario",
                  (e.target as HTMLSelectElement).value
                )
              }
            >
              {(zonasOpciones || []).map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </Selectx>
          </div>

          <div className="flex gap-5">
            <InputxNumber
              name="tarifa_cliente"
              label="Tarifa Cliente"
              value={form.tarifa_cliente}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("tarifa_cliente", e.target.value)
              }
              placeholder="0.00"
              decimals={2}
              step={0.01}
              inputMode="decimal"
            />

            <InputxNumber
              name="pago_motorizado"
              label="Pago a Motorizado"
              value={form.pago_motorizado}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("pago_motorizado", e.target.value)
              }
              placeholder="0.00"
              decimals={2}
              step={0.01}
              inputMode="decimal"
            />
          </div>

          <div className="flex gap-5">
            <Selectx
              label="Estado"
              value={form.estado_id}
              onChange={(e) =>
                handleChange("estado_id", (e.target as HTMLSelectElement).value)
              }
            >
              {ESTADOS_ZONA.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </Selectx>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex gap-3">
          <Buttonx
            variant="secondary"
            onClick={handleCreate}
            label={saving ? "Guardando..." : "Guardar"}
            className="px-4 text-sm"
            disabled={saving}
          />
          <Buttonx
            variant="outlined"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm"
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}
