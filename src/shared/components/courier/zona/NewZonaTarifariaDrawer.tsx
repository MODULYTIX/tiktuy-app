// src/shared/components/courier/zona-tarifaria/NewZonaTarifariaDrawer.tsx
import { useEffect, useState } from "react";
import type React from "react";
import {
  crearZonaTarifariaParaMiUsuario,
  fetchMisZonas,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import type {
  ApiResult,
  ZonaTarifaria,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.types";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";

//  Tus componentes
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import Tittlex from "@/shared/common/Tittlex";
import { InputxNumber } from "@/shared/common/Inputx";

type Props = {
  open: boolean;
  zonasOpciones?: string[];      // SOLO para el combo de "Zona"
  onClose: () => void;
  onCreated?: () => void;
};

type CreateForm = {
  distrito: string;
  zona_tarifario: string;
  tarifa_cliente: string;
  pago_motorizado: string;
  estado_id: string;
};

const ESTADOS_ZONA = [
  { id: 28, nombre: "Activo" },
  { id: 29, nombre: "Inactivo" },
];

export default function NewZonaTarifariaDrawer({
  open,
  zonasOpciones = ["1", "2", "3", "4", "5", "6"], // ← SOLO para campo Zona
  onClose,
  onCreated,
}: Props) {
  const [sugerenciasDistritos, setSugerenciasDistritos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<CreateForm>({
    distrito: "",
    zona_tarifario: "",
    tarifa_cliente: "",
    pago_motorizado: "",
    estado_id: String(ESTADOS_ZONA[0].id),
  });

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setErr(null);
      setForm({
        distrito: "",
        zona_tarifario: "",
        tarifa_cliente: "",
        pago_motorizado: "",
        estado_id: String(ESTADOS_ZONA[0].id),
      });
    }
  }, [open]);

  // Cargar sugerencias de distritos desde MIS zonas (todas las sedes del courier)
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
          new Set(
            res.data
              .map((z) => (z.distrito ?? "").toString().trim())
              .filter(Boolean)
          )
        ).sort((a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        );
        setSugerenciasDistritos(uniques);
      } catch {
        /* silencioso */
      }
    }
    load();
    return () => {
      mounted = false;
    };
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
    if (!form.distrito.trim()) return setErr("El distrito es obligatorio.");
    if (!form.zona_tarifario.trim()) return setErr("La zona es obligatoria.");

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
        distrito: form.distrito.trim(),
        zona_tarifario: form.zona_tarifario.trim(),
        tarifa_cliente: tarifa,
        pago_motorizado: pago,
        estado_id: estadoId,
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

  // 🔹 AHORA: solo usamos distritos reales, sin fallback a números
  const distritosOptions = sugerenciasDistritos;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer derecho */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-5 flex flex-col gap-5 overflow-y-auto">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="solar:point-on-map-broken"
          title="NUEVO DISTRITO DE ATENCIÓN"
          description="Registra un nuevo distrito en el que brindaremos atención logística. Asigna su zona correspondiente, define el tarifario por envío y especifica el pago destinado al motorizado que realizará las entregas."
        />

        {err && (
          <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        {/* Formulario */}
        <div className="h-full flex flex-col md:grid-cols-2 gap-5">
          <div className="flex gap-5">
            <Selectx
              label="Distrito"
              placeholder="Seleccionar distrito"
              value={form.distrito}
              onChange={(e) => handleChange("distrito", e.target.value)}
              labelVariant="left"
            >
              {/* Solo mostramos opciones si hay distritos sugeridos */}
              {distritosOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Selectx>

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
              labelVariant="left"
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
