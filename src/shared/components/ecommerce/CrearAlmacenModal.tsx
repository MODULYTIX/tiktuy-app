// src/shared/components/ecommerce/CrearAlmacenModal.tsx
import { useEffect, useMemo, useState } from 'react';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import {
  crearSedeSecundariaConInvitacion,
  updateAlmacenamiento,
} from '@/services/ecommerce/almacenamiento/almacenamiento.api';

type Props = {
  token: string;
  almacen: Almacenamiento | null;
  modo: 'crear' | 'editar';
  onClose: () => void;
  onSuccess: (almacen: Almacenamiento) => void;
};

type FormState = {
  nombre_sede: string;
  departamento?: string | null;
  provincia?: string | null;
  ciudad: string;
  direccion: string;
  representante: {
    nombres: string;
    apellidos: string;
    dni: string;
    celular?: string | null;
    correo: string;
  };
};

export default function CrearAlmacenModal({ token, almacen, modo, onClose, onSuccess }: Props) {
  const isEditar = modo === 'editar';

  const [form, setForm] = useState<FormState>({
    nombre_sede: '',
    departamento: null,
    provincia: null,
    ciudad: '',
    direccion: '',
    representante: {
      nombres: '',
      apellidos: '',
      dni: '',
      celular: '',
      correo: '',
    },
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Prefill en edición
  useEffect(() => {
    if (isEditar && almacen) {
      setForm((prev) => ({
        ...prev,
        nombre_sede: almacen.nombre_almacen || '',
        departamento: almacen.departamento ?? null,
        provincia: (almacen as any).provincia ?? null,
        ciudad: almacen.ciudad || '',
        direccion: almacen.direccion || '',
        // en edición no se muestran datos de representante
        representante: prev.representante,
      }));
    }
  }, [isEditar, almacen]);

  const titulo = useMemo(
    () => (isEditar ? 'Editar Sede' : 'Registrar Nueva Sede'),
    [isEditar]
  );

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const setRep = (k: keyof FormState['representante'], v: string | null) => {
    setForm((f) => ({
      ...f,
      representante: { ...f.representante, [k]: v ?? '' },
    }));
  };

  const validar = (): string | null => {
    if (!form.nombre_sede.trim()) return 'El nombre de la sede es obligatorio.';
    if (!form.ciudad.trim()) return 'La ciudad es obligatoria.';
    if (!form.direccion.trim()) return 'La dirección es obligatoria.';

    if (!isEditar) {
      const { nombres, apellidos, dni, correo } = form.representante;
      if (!nombres.trim()) return 'El nombre del representante es obligatorio.';
      if (!apellidos.trim()) return 'El apellido del representante es obligatorio.';
      if (!dni.trim()) return 'El DNI del representante es obligatorio.';
      if (!correo.trim()) return 'El correo del representante es obligatorio.';
      if (!/^\S+@\S+\.\S+$/.test(correo.trim())) return 'El correo no es válido.';
    }
    return null;
  };

  const onSubmit = async () => {
    const err = validar();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setSaving(true);

    try {
      if (isEditar && almacen) {
        const updated = await updateAlmacenamiento(
          almacen.uuid,
          {
            nombre_almacen: form.nombre_sede.trim(),
            departamento: form.departamento ?? null,
            provincia: form.provincia ?? null,
            ciudad: form.ciudad.trim(),
            direccion: form.direccion.trim(),
          },
          token
        );
        onSuccess(updated);
        onClose();
      } else {
        // Crear sede secundaria + invitar representante (requerido en CREAR)
        const { sede /*, invitacion*/ } = await crearSedeSecundariaConInvitacion(
          {
            nombre_sede: form.nombre_sede.trim(),
            departamento: form.departamento ?? null,
            provincia: form.provincia ?? null,
            ciudad: form.ciudad.trim(),
            direccion: form.direccion.trim(),
            representante: {
              nombres: form.representante.nombres.trim(),
              apellidos: form.representante.apellidos.trim(),
              dni: form.representante.dni.trim(),
              celular: form.representante.celular?.toString() || null,
              correo: form.representante.correo.trim().toLowerCase(),
            },
          },
          token
        );
        // Aquí puedes disparar un toast: "Se envió la invitación al correo del representante".
        onSuccess(sede);
        onClose();
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'No se pudo guardar la sede.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="text-primary-600 text-2xl">🏬</div>
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900">{titulo}</h2>
            <p className="text-sm text-gray-500">
              Complete la información para {isEditar ? 'actualizar' : 'registrar'} la sede.
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {/* Datos de sede */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-700">Nombre de Sede</span>
            <input
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ej.: Sede Secundaria"
              value={form.nombre_sede}
              onChange={(e) => set('nombre_sede', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-700">Departamento (opcional)</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Seleccionar departamento"
                value={form.departamento ?? ''}
                onChange={(e) => set('departamento', e.target.value || null)}
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">Provincia (opcional)</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Seleccionar provincia"
                value={form.provincia ?? ''}
                onChange={(e) => set('provincia', e.target.value || null)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-700">Ciudad</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Seleccionar ciudad"
                value={form.ciudad}
                onChange={(e) => set('ciudad', e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">Dirección</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ej.: Av. Los Próceres 1234"
                value={form.direccion}
                onChange={(e) => set('direccion', e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Datos del representante (solo CREAR) */}
        {!isEditar && (
          <div className="mt-2">
            <div className="text-sm font-semibold text-gray-800 mb-2">Datos del representante</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-gray-700">Nombres</span>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.representante.nombres}
                  onChange={(e) => setRep('nombres', e.target.value)}
                  placeholder="Nombres"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">Apellidos</span>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.representante.apellidos}
                  onChange={(e) => setRep('apellidos', e.target.value)}
                  placeholder="Apellidos"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">DNI</span>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.representante.dni}
                  onChange={(e) => setRep('dni', e.target.value)}
                  placeholder="DNI"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">Celular (opcional)</span>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.representante.celular ?? ''}
                  onChange={(e) => setRep('celular', e.target.value)}
                  placeholder="Celular"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm text-gray-700">Correo</span>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.representante.correo}
                  onChange={(e) => setRep('correo', e.target.value)}
                  placeholder="correo@dominio.com"
                  type="email"
                />
              </label>
            </div>
            <p className="text-[12px] text-gray-500 mt-2">
              Se enviará una invitación al correo del representante para que cree su contraseña y active su cuenta.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
        >
          {saving ? (isEditar ? 'Guardando…' : 'Creando…') : isEditar ? 'Guardar cambios' : 'Crear nuevo'}
        </button>
      </footer>
    </div>
  );
}
