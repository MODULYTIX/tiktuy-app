import { IoClose } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import { GrUserAdmin } from 'react-icons/gr';
import { registerTrabajadorRequest } from '@/auth/services/auth.api';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const rolModuloMap: Record<string, string[]> = {
  '2': ['Stock de productos', 'Movimientos'],
  '3': ['Gestion de pedidos'],
  '4': ['Stock de productos', 'Movimientos', 'Gestion de pedidos'],
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const posiblesModulos = rolModuloMap[form.rol_perfil_id] || [];
    setModulos(posiblesModulos.length > 0 ? [posiblesModulos[0]] : []);
  }, [form.rol_perfil_id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddModulo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !modulos.includes(value)) {
      setModulos((prev) => [...prev, value]);
    }
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
      await registerTrabajadorRequest(
        {
          nombres: form.nombre,
          apellidos: form.apellido,
          correo: form.correo,
          contraseña: form.password,
          DNI_CI: form.dni,
          estado: 'activo',
          rol_perfil_id: Number(form.rol_perfil_id),
          modulo: modulos[0],
          codigo_trabajador: '', // opcional
        },
        token
      );

      onCreated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar trabajador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modulosDisponibles = rolModuloMap[form.rol_perfil_id] || [];
  const modulosFiltrados = modulosDisponibles.filter((m) => !modulos.includes(m));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div
        ref={modalRef}
        className="bg-white p-6 rounded-l-md w-full max-w-md h-full overflow-auto shadow-lg">
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
          Crea un nuevo perfil completando la información personal, datos de
          contacto, rol y módulo asignado.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              name="nombre"
              placeholder="Ejem. Alvaro"
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
              placeholder="Ejem. Maguiña"
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
              placeholder="Ejem. 48324487"
              className="w-full border rounded-lg px-4 py-2"
              value={form.dni}
              onChange={handleChange}
              required
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
              placeholder="Ejem. correo@gmail.com"
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
              required>
              <option value="">Seleccionar rol</option>
              <option value="2">Almacenero</option>
              <option value="3">Vendedor</option>
              <option value="4">Ecommerce asistente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="Escribir aquí"
              className="w-full border rounded-lg px-4 py-2"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Repetir Contraseña
            </label>
            <input
              name="confirmarPassword"
              type="password"
              placeholder="Escribir aquí"
              className="w-full border rounded-lg px-4 py-2"
              value={form.confirmarPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Módulo</label>
            <select
              onChange={handleAddModulo}
              className="w-full border rounded-lg px-4 py-2"
              value="">
              <option value="">Seleccionar módulo</option>
              {modulosFiltrados.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap gap-2">
              {modulos.map((mod) => (
                <div
                  key={mod}
                  className="bg-gray-100 text-sm text-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                  {mod}
                  <button
                    type="button"
                    onClick={() => handleRemoveModulo(mod)}
                    className="text-red-500 hover:text-red-700">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primaryDark text-white px-5 py-2 rounded border">
              {loading ? 'Creando...' : 'Crear nuevo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border px-5 py-2 rounded">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
