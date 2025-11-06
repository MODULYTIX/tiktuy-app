// src/shared/components/ecommerce/CrearAlmacenModal.tsx
import { useEffect, useMemo, useState } from 'react';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import {
  crearSedeSecundariaConInvitacion,
  updateAlmacenamiento,
} from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import Tittlex from '@/shared/common/Tittlex';
import { Inputx, InputxPhone } from '@/shared/common/Inputx';
import Buttonx from '@/shared/common/Buttonx';

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
    <div className="flex flex-col gap-5 p-5 h-full w-[420px]">
      {/* Header */}
      <Tittlex
        variant="modal"
        icon="hugeicons:warehouse"
        title={titulo}
        description={`Complete la información para ${isEditar ? 'actualizar' : 'registrar'} la sede.`}
      />

      {/* Body */}
      <div className='flex flex-col gap-5 h-full'>
        <Inputx
          label="Nombre de Sede"
          placeholder="Ej.: Sede Secundaria"
          value={form.nombre_sede}
          onChange={(e) => set('nombre_sede', e.target.value)}
        />

        <div className="flex gap-5">
          <Inputx
            label="Departamento (opcional)"
            placeholder="Seleccionar departamento"
            value={form.departamento ?? ''}
            onChange={(e) => set('departamento', e.target.value || null)}
          />

          <Inputx
            label="Provincia (opcional)"
            placeholder="Seleccionar provincia"
            value={form.provincia ?? ''}
            onChange={(e) => set('provincia', e.target.value || null)}
          />
        </div>

        <div className="flex gap-5">
          <Inputx
            label="Ciudad"
            placeholder="Seleccionar ciudad"
            value={form.ciudad}
            onChange={(e) => set('ciudad', e.target.value)}
          />

          <Inputx
            label="Dirección"
            placeholder="Ej.: Av. Los Próceres 1234"
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
          />
        </div>

        {/* Datos del representante (solo CREAR) */}
        {!isEditar && (
          <div className="flex flex-col gap-5">
            <div className="text-md font-semibold text-gray-800">Datos del representante</div>

            <div className="flex gap-5">
              <Inputx
                label="Nombres"
                placeholder="Nombres"
                value={form.representante.nombres}
                onChange={(e) => setRep('nombres', e.target.value)}
              />

              <Inputx
                label="Apellidos"
                placeholder="Apellidos"
                value={form.representante.apellidos}
                onChange={(e) => setRep('apellidos', e.target.value)}
              />
            </div>

            <div className="flex gap-5">
              <Inputx
                label="DNI"
                placeholder="DNI"
                value={form.representante.dni}
                onChange={(e) => setRep('dni', e.target.value)}
              />

              <InputxPhone
                label="Celular (opcional)"
                placeholder="Celular"
                countryCode="+51"
                value={form.representante.celular ?? ''}
                onChange={(e) => setRep('celular', e.target.value)}
              />
            </div>

            <Inputx
              label="Correo"
              placeholder="correo@dominio.com"
              type="email"
              value={form.representante.correo}
              onChange={(e) => setRep('correo', e.target.value)}
            />

            <p className="text-[12px] text-gray-500">
              Se enviará una invitación al correo del representante para que cree su contraseña y active su cuenta.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-5">
        <Buttonx
          variant="quartery"
          onClick={onSubmit}
          disabled={saving}
          label={
            saving
              ? isEditar
                ? 'Guardando…'
                : 'Creando…'
              : isEditar
                ? 'Guardar cambios'
                : 'Crear nuevo'
          }
        />
        <Buttonx
          variant="outlinedw"
          disabled={saving}
          onClick={onClose}
          label="Cancelar"
        />
      </div>
    </div>
  );
}
