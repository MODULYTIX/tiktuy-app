import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  actualizarZonaTarifaria,
  fetchMisZonas,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type {
  ApiResult,
  ZonaTarifaria,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";

type Props = {
  open: boolean;
  zona: ZonaTarifaria | null;        // zona seleccionada desde la tabla
  zonasOpciones?: string[];          // ["1","2","3","4","5","6"] por defecto
  onClose: () => void;
  onUpdated?: () => void;            // refrescar la tabla
};

type EditForm = {
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: string;   // inputs como string → parse a number
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

  // Precarga del formulario con la zona seleccionada
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
      // reset suave al cerrar
      setErr(null);
      setForm({
        distrito: "",
        zona_tarifario: "",
        tarifa_cliente: "",
        pago_motorizado: "",
      });
    }
  }, [open, zona]);

  // Sugerencias de distritos (desde mis zonas)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!open) return;
      try {
        const token = getAuthToken();
        if (!token) return;
        const res: ApiResult<ZonaTarifaria[]> = await fetchMisZonas(token);
        if (!mounted || !res.ok) return;
        const uniques = Array.from(new Set(res.data.map((z) => z.distrito.trim()))).sort((a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        );
        setSugerenciasDistritos(uniques);
      } catch {
        /* opcional */
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

  // Construye payload solo con campos cambiados (opcional pero elegante)
  function buildUpdatePayload() {
    if (!zona) return {};
    const payload: Record<string, unknown> = {};

    if (form.distrito.trim() !== (zona.distrito ?? "")) payload.distrito = form.distrito.trim();
    if (form.zona_tarifario.trim() !== (zona.zona_tarifario ?? "")) {
      payload.zona_tarifario = form.zona_tarifario.trim();
    }

    const tOld = typeof zona.tarifa_cliente === "string" ? parseFloat(zona.tarifa_cliente) : zona.tarifa_cliente;
    const pOld = typeof zona.pago_motorizado === "string" ? parseFloat(zona.pago_motorizado) : zona.pago_motorizado;

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

    // Asegura números válidos si cambiaron
    if (form.tarifa_cliente.trim() !== "" && Number.isNaN(Number(form.tarifa_cliente))) {
      return setErr("Tarifario debe ser numérico válido.");
    }
    if (form.pago_motorizado.trim() !== "" && Number.isNaN(Number(form.pago_motorizado))) {
      return setErr("Pago a motorizado debe ser numérico válido.");
    }

    const token = getAuthToken();
    if (!token) return setErr("No se encontró el token de autenticación.");

    const payload = buildUpdatePayload();
    if (Object.keys(payload).length === 0) {
      // Nada cambió
      onClose();
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
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="ph:user-gear-duotone" className="text-primaryDark" width={26} />
            <h2 className="text-xl font-extrabold text-[#1A237E]">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Actualiza los datos del distrito, su zona, tarifa y pago al motorizado según necesidades del servicio.
        </p>

        {err && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Distrito con datalist (sugerencias desde “mis zonas”) */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Distrito</label>
            <input
              list="distritosSugeridosEdit"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Seleccionar distrito"
              value={form.distrito}
              onChange={(e) => handleChange("distrito", e.target.value)}
            />
            <datalist id="distritosSugeridosEdit">
              {sugerenciasDistritos.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* Zona */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Zona</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm bg-white"
              value={form.zona_tarifario}
              onChange={(e) => handleChange("zona_tarifario", e.target.value)}
            >
              <option value="">Seleccionar zona</option>
              {(zonasOpciones || []).map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Tarifario */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Tarifario</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="10.00"
              value={form.tarifa_cliente}
              onChange={(e) => handleChange("tarifa_cliente", e.target.value)}
            />
          </div>

          {/* Pago a Motorizado */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Pago a Motorizado</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="8.00"
              value={form.pago_motorizado}
              onChange={(e) => handleChange("pago_motorizado", e.target.value)}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex items-center gap-3">
          <button
            className="px-4 py-2 rounded bg-[#1A237E] text-white text-sm disabled:opacity-60"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            className="px-4 py-2 rounded border text-sm hover:bg-gray-100"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
