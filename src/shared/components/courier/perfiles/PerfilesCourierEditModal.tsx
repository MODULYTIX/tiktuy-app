// src/shared/components/courier/perfiles/PerfilesCourierEditModal.tsx
import { IoClose } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import { GrUserAdmin } from 'react-icons/gr';
import { editarTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trabajador: (PerfilTrabajador & { rol_perfil_id?: number; rol_perfil?: string }) | null;
  onUpdated?: () => void;
}

// ---------------- Helpers ----------------
function normalize(s?: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

// Courier roles (IDs según tu DB)
const rolModuloMap: Record<string, string[]> = {
  '4': ['almacen', 'stock', 'movimiento'], // AlmaceneroCourier
  '5': ['panel', 'reportes', 'saldos', 'perfiles', 'almacen', 'pedidos'], // AsistenteCourier
  '6': ['pedidos'], // RepartidorCourier
};

const moduloLabelMap: Record<string, string> = {
  panel: 'Panel de Control',
  almacen: 'Almacén',
  productos: 'Productos',
  stock: 'Stock de Productos',
  movimiento: 'Movimientos',
  pedidos: 'Pedidos',
  saldos: 'Saldos',
  perfiles: 'Perfiles',
  reportes: 'Reportes',
};

// Derivar rol_perfil_id desde el nombre mostrado en la tabla (campo `perfil`)
const perfilNameToId: Record<string, number> = {
  [normalize('AlmaceneroCourier')]: 4,
  [normalize('AsistenteCourier')]: 5,
  [normalize('RepartidorCourier')]: 6,
  // fallback por si en la tabla no incluyen "Courier"
  [normalize('Almacenero')]: 4,
  [normalize('Asistente')]: 5,
  [normalize('Repartidor')]: 6,
};

export default function PerfilesCourierEditModal({ isOpen, onClose, trabajador, onUpdated }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    correo: '',
    rol_perfil_id: '', // string para el <select>
  });

  const [modulos, setModulos] = useState<string[]>([]);
  const [selectModulo, setSelectModulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Precarga
  useEffect(() => {
    if (!isOpen || !trabajador) return;

    const incomingId =
      trabajador.rol_perfil_id ??
      perfilNameToId[normalize(trabajador.perfil)] ??
      perfilNameToId[normalize((trabajador as any).rol_perfil)];

    setForm({
      nombre: trabajador.nombres || '',
      apellido: trabajador.apellidos || '',
      dni: trabajador.DNI_CI || '',
      telefono: trabajador.telefono || '',
      correo: trabajador.correo || '',
      rol_perfil_id: incomingId ? String(incomingId) : '',
    });

    const actuales = Array.isArray(trabajador.modulo_asignado) ? trabajador.modulo_asignado : [];
    // Asegura coherencia inicial con el rol (si hay restricción)
    const permitidos = new Set(rolModuloMap[String(incomingId)] || []);
    let iniciales = permitidos.size ? actuales.filter((m) => permitidos.has(m)) : actuales;
    if (iniciales.length === 0 && permitidos.size > 0) {
      iniciales = [Array.from(permitidos)[0]];
    }

    setModulos(iniciales);
    setSelectModulo('');
    setError('');
  }, [isOpen, trabajador]);

  // Cerrar por click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Al cambiar el rol, ajusta módulos a los permitidos
  useEffect(() => {
    if (!form.rol_perfil_id) return;
    const permitidos = new Set(rolModuloMap[form.rol_perfil_id] || []);
    setModulos((prev) => {
      const filtrados = prev.filter((m) => (permitidos.size ? permitidos.has(m) : true));
      if (filtrados.length > 0) return filtrados;
      const arr = Array.from(permitidos);
      return arr.length ? [arr[0]] : [];
    });
    setSelectModulo('');
  }, [form.rol_perfil_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddModulo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !modulos.includes(value)) setModulos((prev) => [...prev, value]);
    setSelectModulo('');
  };

  const handleRemoveModulo = (modulo: string) => {
    setModulos((prev) => prev.filter((m) => m !== modulo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajador) return;

    if (!form.rol_perfil_id) {
      setError('Debe seleccionar un rol.');
      return;
    }
    if (modulos.length === 0) {
      setError('Debe seleccionar al menos un módulo.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || '';
      await editarTrabajador(
        trabajador.id,
        {
          nombres: form.nombre,
          apellidos: form.apellido,
          telefono: form.telefono,
          correo: form.correo,
          rol_perfil_id: Number(form.rol_perfil_id),
          modulos,
        },
        token
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al editar trabajador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trabajador) return null;

  const modulosDisponibles = rolModuloMap[form.rol_perfil_id] || [];
  const modulosFiltrados = modulosDisponibles.filter((m) => !modulos.includes(m));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div ref={modalRef} className="bg-white p-6 rounded-l-md w-full max-w-md h-full overflow-auto shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary flex gap-2 items-center">
            <GrUserAdmin size={18} />
            <span>EDITAR PERFIL</span>
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            <IoClose size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Actualiza la información personal, datos de contacto, rol y módulos asignados.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              name="nombre"
              placeholder="Nombre"
              className="w-full border rounded-lg px-4 py-2"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellido</label>
            <input
              name="apellido"
              placeholder="Apellido"
              className="w-full border rounded-lg px-4 py-2"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">DNI / CI</label>
            <input
              name="dni"
              placeholder="DNI / CI"
              className="w-full border rounded-lg px-4 py-2 bg-gray-100"
              value={form.dni}
              onChange={handleChange}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <div className="flex items-center border rounded-lg px-4 py-2 gap-2">
              <span className="text-gray-500 text-sm">+51</span>
              <input
                name="telefono"
                placeholder="987654321"
                className="w-full outline-none"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input
              name="correo"
              placeholder="correo@gmail.com"
              className="w-full border rounded-lg px-4 py-2"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rol Perfil</label>
            <select
              name="rol_perfil_id"
              className="w-full border rounded-lg px-4 py-2"
              value={form.rol_perfil_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="4">AlmaceneroCourier</option>
              <option value="5">AsistenteCourier</option>
              <option value="6">RepartidorCourier</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Módulo</label>
            <select onChange={handleAddModulo} className="w-full border rounded-lg px-4 py-2" value={selectModulo}>
              <option value="">Seleccionar módulo</option>
              {modulosFiltrados.map((mod) => (
                <option key={mod} value={mod}>
                  {moduloLabelMap[mod] || mod}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap gap-2">
              {modulos.map((mod) => (
                <div
                  key={mod}
                  className="bg-gray-100 text-sm text-gray-700 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {moduloLabelMap[mod] || mod}
                  <button
                    type="button"
                    onClick={() => handleRemoveModulo(mod)}
                    className="text-red-500 hover:text-red-700"
                    aria-label={`Quitar ${moduloLabelMap[mod] || mod}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="col-span-2 text-sm text-red-500 mt-2">{error}</div>}

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button type="submit" disabled={loading} className="bg-primaryDark text-white px-5 py-2 rounded border">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={onClose} className="border px-5 py-2 rounded">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
