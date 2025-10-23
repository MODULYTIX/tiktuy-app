// src/shared/components/courier/zona-tarifaria/EditZonaTarifariaDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import {
  actualizarZonaTarifaria,
  fetchMisZonas,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type {
  ApiResult,
  ZonaTarifaria,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";

// 🧩 Componentes base
import { Selectx } from "@/shared/common/Selectx";
import { InputxNumber } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";

type Props = {
  open: boolean;
  zona: ZonaTarifaria | null;
  zonasOpciones?: string[];
  onClose: () => void;
  onUpdated?: () => void;
};

type EditForm = {
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: string;   // mantengo como string y parseo al enviar
  pago_motorizado: string;
};

const DEFAULT_ZONAS = ["1", "2", "3", "4", "5", "6"];

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
  const [sugerenciasDistritos, setSugerenciasDistritos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<EditForm>({
    distrito: "",
    zona_tarifario: "",
    tarifa_cliente: "",
    pago_motorizado: "",
  });

  // Precarga con la zona seleccionada
  useEffect(() => {
    if (open && zona) {
      setErr(null);
      setForm({
        distrito: zona.distrito ?? "",
        zona_tarifario: zona.zona_tarifario ?? "",
        tarifa_cliente: toStr(zona.tarifa_cliente),
        pago_motorizado: toStr(zona.pago_motorizado),
      });
    }
    if (!open) {
      setErr(null);
      setForm({
        distrito: "",
        zona_tarifario: "",
        tarifa_cliente: "",
        pago_motorizado: "",
      });
    }
  }, [open, zona]);

  // Cargar sugerencias de distritos (por si luego quieres autocompletar)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!open) return;
      try {
        const token = getAuthToken();
        if (!token) return;
        const res: ApiResult<ZonaTarifaria[]> = await fetchMisZonas(token);
        if (!mounted || !res.ok) return;
        const uniques = Array.from(
          new Set(res.data.map((z) => (z.distrito || "").trim()))
        ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
        setSugerenciasDistritos(uniques);
      } catch {
        /* silent */
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [open]);

  function handleChange<K extends keyof EditForm>(k: K, v: EditForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // Solo envía campos modificados
  function buildUpdatePayload() {
    if (!zona) return {};
    const payload: Record<string, unknown> = {};

    if (form.distrito.trim() !== (zona.distrito ?? "")) {
      payload.distrito = form.distrito.trim();
    }
    if (form.zona_tarifario.trim() !== (zona.zona_tarifario ?? "")) {
      payload.zona_tarifario = form.zona_tarifario.trim();
    }

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

    return payload;
  }

  async function handleUpdate() {
    setErr(null);
    if (!zona) return;

    // Validaciones mínimas
    if (!form.distrito.trim()) return setErr("El distrito es obligatorio.");
    if (!form.zona_tarifario.trim()) return setErr("La zona es obligatoria.");

    if (form.tarifa_cliente.trim() !== "" && Number.isNaN(Number(form.tarifa_cliente))) {
      return setErr("Tarifa Cliente debe ser numérico válido.");
    }
    if (form.pago_motorizado.trim() !== "" && Number.isNaN(Number(form.pago_motorizado))) {
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
    const res = await actualizarZonaTarifaria(zona.id, payload, token);
    setSaving(false);

    if (!res.ok) {
      setErr(res.error || "No se pudo actualizar la zona.");
      return;
    }

    onUpdated?.();
    onClose();
  }

  const titulo = useMemo(() => "ACTUALIZAR DISTRITO DE ATENCIÓN", []);

  if (!open || !zona) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer derecho (misma estructura que “Nuevo”) */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-5 flex flex-col gap-5 overflow-y-auto">
        {/* Header con Tittlex (sin botón X) */}
        <Tittlex
          variant="modal"
          icon="solar:point-on-map-broken"
          title={titulo}
          description="Actualiza los datos del distrito, su zona, tarifa y pago al motorizado según necesidades del servicio."
        />

        {err && (
          <div className="mb-1 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        {/* Formulario (gap-5) */}
        <div className="h-full flex flex-col gap-5">
          {/* Fila 1: Distrito / Zona */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Selectx
              label="Distrito"
              placeholder="Seleccionar distrito"
              value={form.distrito}
              onChange={(e) => handleChange("distrito", (e.target as HTMLSelectElement).value)}
              labelVariant="left"
            >
              {/* Si quieres usar sugerencias reales de tus zonas: */}
              {sugerenciasDistritos.length > 0
                ? sugerenciasDistritos.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))
                : (zonasOpciones || []).map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
            </Selectx>

            <Selectx
              label="Zona"
              placeholder="Seleccionar zona"
              value={form.zona_tarifario}
              onChange={(e) => handleChange("zona_tarifario", (e.target as HTMLSelectElement).value)}
              labelVariant="left"
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
