// src/role/courier/pages/ZonasPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/auth/context/useAuth";

// Tabla conectada al backend (ajusta el path si tu archivo está en otra carpeta)
import TableZonaCourier from "@/shared/components/courier/zona/TableZonaCourier";
import ZonaFilterCourier from "@/shared/components/courier/zona/ZonaFilterCourier";

import {
  crearZonaTarifaria,
  fetchZonasByCourierPublic,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.api";
import { getAuthToken } from "@/services/courier/panel_control/panel_control.api";
import type {
  ApiResult,
  ZonaTarifariaPublic,
} from "@/services/courier/zonaTarifaria/zonaTarifaria.types";

/* -------------------------------------------
   Hook tipado: obtener courierId desde el user
-------------------------------------------- */
type CourierUserShape =
  | {
      perfil_courier?: { id?: number | null } | null;
      courier?: { id?: number | null } | null;
      courier_id?: number | null;
    }
  | null;

function useCourierId(): number | null {
  const { user } = useAuth();
  const u = user as CourierUserShape;

  if (u?.perfil_courier?.id != null) return u.perfil_courier.id!;
  if (u?.courier?.id != null) return u.courier.id!;
  if (u?.courier_id != null) return u.courier_id!;
  return null;
}

type CreateForm = {
  distrito: string;
  zona_tarifario: string;  // ej: "1", "2", ...
  tarifa_cliente: string;  // input string → número al guardar
  pago_motorizado: string; // input string → número al guardar
  estado_id: string;       // id numérico (p. ej. 1 = Activo)
};

const ZONAS_OPCIONES = ["1", "2", "3", "4", "5", "6"];

export default function ZonasPage() {
  const courierId = useCourierId();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Sugerencias de distritos (endpoint público: solo { distrito })
  const [sugerenciasDistritos, setSugerenciasDistritos] = useState<string[]>([]);

  useEffect(() => {
    async function loadDistritos() {
      if (!courierId) return;
      const res: ApiResult<ZonaTarifariaPublic[]> = await fetchZonasByCourierPublic(courierId);
      if (res.ok) setSugerenciasDistritos(res.data.map((z) => z.distrito));
    }
    loadDistritos();
  }, [courierId]);

  const [form, setForm] = useState<CreateForm>({
    distrito: "",
    zona_tarifario: "",
    tarifa_cliente: "",
    pago_motorizado: "",
    estado_id: "1", // por defecto "Activo" si corresponde
  });

  function handleChange<K extends keyof CreateForm>(k: K, v: CreateForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCreate() {
    setErr(null);

    if (!courierId) {
      setErr("No se pudo determinar el courier actual.");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setErr("No se encontró el token de autenticación.");
      return;
    }

    if (!form.distrito.trim()) {
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

    if (Number.isNaN(tarifa) || Number.isNaN(pago) || Number.isNaN(estadoId)) {
      setErr("Tarifa, Pago y Estado deben ser numéricos válidos.");
      return;
    }

    setSaving(true);
    const res = await crearZonaTarifaria(
      {
        courier_id: courierId,
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

    // OK → cerrar y refrescar tabla
    setDrawerOpen(false);
    setForm({
      distrito: "",
      zona_tarifario: "",
      tarifa_cliente: "",
      pago_motorizado: "",
      estado_id: "1",
    });
    setRefreshKey((k) => k + 1);
  }

  const courierError = useMemo(
    () => (!courierId ? "No se pudo determinar el courier actual." : ""),
    [courierId]
  );

  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Zonas de Atención</h1>
          <p className="text-gray-500">Tarifas y pagos por zona.</p>
        </div>

        <div className="flex items-end">
          <button
            className="flex gap-2 items-center bg-primaryDark text-white px-3 py-2 rounded-sm disabled:opacity-60"
            onClick={() => setDrawerOpen(true)}
            disabled={!courierId}
          >
            <Icon icon="iconoir:new-tab" width="24" height="24" />
            <span>Nuevo Distrito de Atención</span>
          </button>
        </div>
      </div>

      <div className="my-8">
        <ZonaFilterCourier />
      </div>

      <div>
        {courierId ? (
          <TableZonaCourier key={refreshKey} courierId={courierId} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-red-700">
            {courierError}
          </div>
        )}
      </div>

      {/* Drawer lateral derecho */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="ph:user-gear-duotone" className="text-primaryDark" width={26} />
                <h2 className="text-xl font-extrabold text-[#1A237E]">
                  NUEVO DISTRITO DE ATENCIÓN
                </h2>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Registra un nuevo distrito en el que brindaremos atención logística. Asigna su
              zona correspondiente, define el tarifario por envío y especifica el pago destinado
              al motorizado que realizará las entregas.
            </p>

            {err && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {err}
              </div>
            )}
            {courierError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {courierError}
              </div>
            )}

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distrito con datalist (sugerencias) */}
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Distrito</label>
                <input
                  list="distritosSugeridos"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Seleccionar distrito"
                  value={form.distrito}
                  onChange={(e) => handleChange("distrito", e.target.value)}
                />
                <datalist id="distritosSugeridos">
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
                  {ZONAS_OPCIONES.map((z) => (
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
                  placeholder="Ejem. 10.00"
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
                  placeholder="Ejem. 8.00"
                  value={form.pago_motorizado}
                  onChange={(e) => handleChange("pago_motorizado", e.target.value)}
                />
              </div>

              {/* Estado (numérico) — cámbialo por select si tienes catálogo */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-700 mb-1 block">Estado (ID numérico)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.estado_id}
                  onChange={(e) => handleChange("estado_id", e.target.value)}
                  placeholder="Ej: id del estado 'Activo'"
                />
                <p className="text-xs text-gray-500 mt-1">
                  (Si tienes catálogo de estados, reemplaza este input por un select.)
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 flex items-center gap-3">
              <button
                className="px-4 py-2 rounded bg-[#1A237E] text-white text-sm disabled:opacity-60"
                onClick={handleCreate}
                disabled={saving || !courierId}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                className="px-4 py-2 rounded border text-sm hover:bg-gray-100"
                onClick={() => setDrawerOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
