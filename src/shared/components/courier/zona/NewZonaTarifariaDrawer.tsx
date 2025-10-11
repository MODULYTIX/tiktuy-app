import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  crearZonaTarifariaParaMiUsuario,
  fetchMisZonas,
} from '@/services/courier/zonaTarifaria/zonaTarifaria.api';
import type {
  ApiResult,
  ZonaTarifaria,
} from '@/services/courier/zonaTarifaria/zonaTarifaria.types';
import { getAuthToken } from '@/services/courier/panel_control/panel_control.api';

type Props = {
  open: boolean;
  zonasOpciones?: string[];
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

const DEFAULT_ZONAS = ['1', '2', '3', '4', '5', '6'];

const ESTADOS_ZONA = [
  { id: 28, nombre: 'Activo' },
  { id: 29, nombre: 'Inactivo' },
];

export default function NewZonaTarifariaDrawer({
  open,
  zonasOpciones = DEFAULT_ZONAS,
  onClose,
  onCreated,
}: Props) {
  const [sugerenciasDistritos, setSugerenciasDistritos] = useState<string[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<CreateForm>({
    distrito: '',
    zona_tarifario: '',
    tarifa_cliente: '',
    pago_motorizado: '',
    estado_id: String(ESTADOS_ZONA[0].id), // por defecto "Activo"
  });

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setErr(null);
      setForm({
        distrito: '',
        zona_tarifario: '',
        tarifa_cliente: '',
        pago_motorizado: '',
        estado_id: String(ESTADOS_ZONA[0].id),
      });
    }
  }, [open]);

  // Cargar sugerencias de distritos (mis zonas)
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
          new Set(res.data.map((z) => z.distrito.trim()))
        ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
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
      setErr('No se encontró el token de autenticación.');
      return;
    }
    if (!form.distrito.trim()) return setErr('El distrito es obligatorio.');
    if (!form.zona_tarifario.trim()) return setErr('La zona es obligatoria.');

    const tarifa = Number(form.tarifa_cliente);
    const pago = Number(form.pago_motorizado);
    const estadoId = Number(form.estado_id);

    if (Number.isNaN(tarifa) || Number.isNaN(pago)) {
      setErr('Tarifa y Pago deben ser numéricos válidos.');
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
      setErr(res.error || 'No se pudo crear la zona tarifaria.');
      return;
    }

    onCreated?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="solar:point-on-map-broken" width="24" height="24" className='text-primary' />
            <h2 className="text-xl font-extrabold text-[#1A237E]">
              NUEVO DISTRITO DE ATENCIÓN
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Cerrar">
            ×
          </button>
        </div>

        {err && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Distrito */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Distrito</label>
            <input
              list="distritosSugeridos"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Seleccionar distrito"
              value={form.distrito}
              onChange={(e) => handleChange('distrito', e.target.value)}
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
              onChange={(e) => handleChange('zona_tarifario', e.target.value)}>
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
            <label className="text-sm text-gray-700 mb-1 block">
              Tarifa Cliente
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej: 10.00"
              value={form.tarifa_cliente}
              onChange={(e) => handleChange('tarifa_cliente', e.target.value)}
            />
          </div>

          {/* Pago a Motorizado */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">
              Pago a Motorizado
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej: 8.00"
              value={form.pago_motorizado}
              onChange={(e) => handleChange('pago_motorizado', e.target.value)}
            />
          </div>

          {/* Estado (select fijo) */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 mb-1 block">Estado</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm bg-white"
              value={form.estado_id}
              onChange={(e) => handleChange('estado_id', e.target.value)}>
              {ESTADOS_ZONA.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex gap-3 items-end">
          <button
            className="px-4 py-2 rounded bg-[#1F2937] text-white text-sm disabled:opacity-60"
            onClick={handleCreate}
            disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            className="px-4 py-2 rounded border text-sm hover:bg-gray-100"
            onClick={onClose}
            disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
