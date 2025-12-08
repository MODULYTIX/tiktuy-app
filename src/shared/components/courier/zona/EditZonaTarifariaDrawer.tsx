// src/shared/components/courier/zona-tarifaria/EditZonaTarifariaDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  actualizarMiZonaTarifaria,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type {
  ZonaTarifaria,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";

// 🧩 Componentes base
import { Selectx } from "@/shared/common/Selectx";
import { InputxNumber, Inputx } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

type Props = {
  open: boolean;
  zona: ZonaTarifaria | null;
  zonasOpciones?: string[];
  onClose: () => void;
  onUpdated?: () => void;
};

/**
 * En el backend el campo se llama "distrito", pero en el body
 * de update se envía como "ciudad" (el service lo mapea).
 */
type EditForm = {
  ciudad: string;          // UI: Ciudad -> backend: ciudad -> prisma: distrito
  zona_tarifario: string;
  tarifa_cliente: string;  // string en el form, se parsea al enviar
  pago_motorizado: string;
  estado_id: string;
};

const DEFAULT_ZONAS = ["1", "2", "3", "4", "5", "6"];
const ESTADOS_ZONA = [
  { id: 28, nombre: "Activo" },
  { id: 29, nombre: "Inactivo" },
];

function toStr(n: unknown) {
  if (typeof n === "number") return String(n);
  if (typeof n === "string") return n;
  return "";
}

export default function EditZonaTarifariaDrawer({
  open,
  zona,
  zonasOpciones = DEFAULT_ZONAS,
  onClose,
  onUpdated,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<EditForm>({
    ciudad: "",
    zona_tarifario: "",
    tarifa_cliente: "",
    pago_motorizado: "",
    estado_id: String(ESTADOS_ZONA[0].id),
  });

  // Precarga con la zona seleccionada
  useEffect(() => {
    if (open && zona) {
      setErr(null);
      setForm({
        ciudad: zona.distrito ?? "",           // distrito -> ciudad en el form
        zona_tarifario: zona.zona_tarifario ?? "",
        tarifa_cliente: toStr(zona.tarifa_cliente),
        pago_motorizado: toStr(zona.pago_motorizado),
        estado_id: String(zona.estado_id ?? ESTADOS_ZONA[0].id),
      });
    }
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
  }, [open, zona]);

  function handleChange<K extends keyof EditForm>(k: K, v: EditForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // Solo envía campos modificados según ActualizarZonaTarifariaPayload:
  // { ciudad?, zona_tarifario?, tarifa_cliente?, pago_motorizado?, estado_id? }
  function buildUpdatePayload() {
    if (!zona) return {};
    const payload: Record<string, unknown> = {};

    // ciudad (mapeada a distrito en backend)
    if (form.ciudad.trim() !== (zona.distrito ?? "")) {
      payload.ciudad = form.ciudad.trim();
    }

    // zona_tarifario
    if (form.zona_tarifario.trim() !== (zona.zona_tarifario ?? "")) {
      payload.zona_tarifario = form.zona_tarifario.trim();
    }

    // Montos
    const tOld =
      typeof zona.tarifa_cliente === "string"
        ? parseFloat(zona.tarifa_cliente)
        : zona.tarifa_cliente;
    const pOld =
      typeof zona.pago_motorizado === "string"
        ? parseFloat(zona.pago_motorizado)
        : zona.pago_motorizado;

    const tNew = Number(form.tarifa_cliente);
    const pNew = Number(form.pago_motorizado);

    if (!Number.isNaN(tNew) && tNew !== tOld) payload.tarifa_cliente = tNew;
    if (!Number.isNaN(pNew) && pNew !== pOld) payload.pago_motorizado = pNew;

    // Estado
    const estadoIdNew = Number(form.estado_id);
    if (
      !Number.isNaN(estadoIdNew) &&
      estadoIdNew !== (zona.estado_id ?? ESTADOS_ZONA[0].id)
    ) {
      payload.estado_id = estadoIdNew;
    }

    return payload;
  }

  async function handleUpdate() {
    setErr(null);
    if (!zona) return;

    // Validaciones mínimas
    if (!form.ciudad.trim()) return setErr("La ciudad es obligatoria.");
    if (!form.zona_tarifario.trim()) return setErr("La zona es obligatoria.");

    if (
      form.tarifa_cliente.trim() !== "" &&
      Number.isNaN(Number(form.tarifa_cliente))
    ) {
      return setErr("Tarifa Cliente debe ser numérico válido.");
    }
    if (
      form.pago_motorizado.trim() !== "" &&
      Number.isNaN(Number(form.pago_motorizado))
    ) {
      return setErr("Pago a Motorizado debe ser numérico válido.");
    }

    const token = getAuthToken();
    if (!token) return setErr("No se encontró el token de autenticación.");

    const payload = buildUpdatePayload();
    if (Object.keys(payload).length === 0) {
      onClose(); // nada cambió
      return;
    }

    setSaving(true);
    const res = await actualizarMiZonaTarifaria(zona.id, payload, token);
    setSaving(false);

    if (!res.ok) {
      setErr(res.error || "No se pudo actualizar la zona.");
      return;
    }

    onUpdated?.();
    onClose();
  }

  const titulo = useMemo(() => "ACTUALIZAR CIUDAD / ZONA", []);

  if (!open || !zona) return null;

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
          title={titulo}
          description="Actualiza la ciudad, su zona, la tarifa al cliente y el pago al motorizado según la política de tu servicio."
        />

        {err && (
          <div className="mb-1 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        {/* Formulario */}
        <div className="h-full flex flex-col gap-5">
          {/* Fila 1: Ciudad / Zona */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Inputx
              label="Ciudad"
              placeholder="Escribe la ciudad"
              value={form.ciudad}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("ciudad", e.target.value)
              }
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

          {/* Fila 2: Tarifas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          {/* Fila 3: Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        <div className="mt-2 flex gap-3">
          <Buttonx
            variant="secondary"
            onClick={handleUpdate}
            label={saving ? "Actualizando..." : "Actualizar"}
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
