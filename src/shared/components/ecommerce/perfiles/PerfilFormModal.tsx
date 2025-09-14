import { IoClose } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import { GrUserAdmin } from 'react-icons/gr';
import { FiChevronDown } from 'react-icons/fi';
import { registerTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const rolModuloMap: Record<string, string[]> = {
  '1': ['stock', 'movimiento'],
  '2': ['pedidos'],
  '3': ['panel', 'almacen', 'stock', 'movimiento', 'pedidos', 'saldos', 'perfiles', 'reportes'],
};

const moduloLabelMap: Record<string, string> = {
  panel: 'Panel de Control',
  almacen: 'Almacén',
  stock: 'Stock de Productos',
  movimiento: 'Movimientos',
  pedidos: 'Pedidos',
  saldos: 'Saldos',
  perfiles: 'Perfiles',
  reportes: 'Reportes',
};

export default function PerfilFormModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    correo: '',
    password: '',
    confirmarPassword: '',
    rol_perfil_id: '',
  });
  const [modulos, setModulos] = useState<string[]>([]);
  const [selectModulo, setSelectModulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const posibles = rolModuloMap[form.rol_perfil_id] || [];
    setModulos(posibles.length ? [posibles[0]] : []);
    setSelectModulo('');
  }, [form.rol_perfil_id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

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
    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
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
      await registerTrabajador(
        {
          nombres: form.nombre,
          apellidos: form.apellido,
          correo: form.correo,
          contrasena: form.password,
          telefono: form.telefono,
          DNI_CI: form.dni,
          rol_perfil_id: Number(form.rol_perfil_id),
          modulos,
        },
        token
      );
      onCreated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al registrar trabajador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modulosDisponibles = rolModuloMap[form.rol_perfil_id] || [];
  const modulosFiltrados = modulosDisponibles.filter((m) => !modulos.includes(m));

  // 🎨 Modelo base de estilos
  const fieldClass =
    "w-full h-11 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors";
  const labelClass = "block text-gray-700 font-medium mb-1";
  const selectBaseClass = `${fieldClass} appearance-none pr-9`;
  const selectWrapperClass = "relative";
  const selectChevronClass =
    "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400";
  const btnPrimary =
    "bg-[#1A253D] text-white px-4 py-0 rounded flex items-center gap-2 disabled:opacity-70 h-auto";
  const btnSecondary = "px-4 py-2 text-sm border rounded hover:bg-gray-100";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div ref={modalRef} className="bg-white p-6 rounded-l-md w-full max-w-md h-full overflow-auto shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary flex gap-2 items-center">
            <GrUserAdmin size={18} />
            <span>REGISTRAR NUEVO PERFIL</span>
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            <IoClose size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Crea un nuevo perfil completando la información personal, datos de contacto, rol y módulo asignado.
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              name="nombre"
              placeholder="Nombre"
              className={fieldClass}
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Apellido</label>
            <input
              name="apellido"
              placeholder="Apellido"
              className={fieldClass}
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass}>DNI / CI</label>
            <input
              name="dni"
              placeholder="DNI / CI"
              className={fieldClass}
              value={form.dni}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono</label>
            <div className={`${fieldClass} flex items-center gap-2`}>
              <span className="text-gray-500 text-sm">+51</span>
              <input
                name="telefono"
                placeholder="987654321"
                className="bg-transparent outline-none w-full h-full"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Correo</label>
            <input
              name="correo"
              placeholder="correo@gmail.com"
              className={fieldClass}
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Rol Perfil</label>
            <div className={selectWrapperClass}>
              <select
                name="rol_perfil_id"
                className={selectBaseClass}
                value={form.rol_perfil_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar rol</option>
                <option value="1">Almacenero</option>
                <option value="2">Vendedor</option>
                <option value="3">Ecommerce asistente</option>
              </select>
              <FiChevronDown className={selectChevronClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="Escribir aquí"
              className={fieldClass}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Repetir Contraseña</label>
            <input
              name="confirmarPassword"
              type="password"
              placeholder="Escribir aquí"
              className={fieldClass}
              value={form.confirmarPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Módulo</label>
            <div className={selectWrapperClass}>
              <select
                onChange={handleAddModulo}
                className={selectBaseClass}
                value={selectModulo}
              >
                <option value="">Seleccionar módulo</option>
                {modulosFiltrados.map((mod) => (
                  <option key={mod} value={mod}>
                    {moduloLabelMap[mod] || mod}
                  </option>
                ))}
              </select>
              <FiChevronDown className={selectChevronClass} />
            </div>

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

          {error && <div className="col-span-2 text-sm text-red-600 mt-2">{error}</div>}

          <div className="col-span-2 flex justify-end gap-3 mt-screen h-full">
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? 'Creando...' : 'Crear nuevo'}
            </button>
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
