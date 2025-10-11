import { useEffect, useRef, useState } from 'react';
import { registerTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import { Inputx, InputxPhone } from '@/shared/common/Inputx';
import { Selectx } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';
import { Icon } from '@iconify/react';

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
  saldos: 'Cuadre de Saldos',
  perfiles: 'Perfiles',
  reportes: 'Reportes',
};

const moduloIconMap: Record<string, string> = {
  panel: 'mdi:view-dashboard-outline',
  almacen: 'mdi:warehouse',
  stock: 'mdi:package-variant-closed',
  movimiento: 'mdi:swap-horizontal',
  pedidos: 'mdi:cart-outline',
  saldos: 'mdi:wallet-outline',
  perfiles: 'mdi:account-cog-outline',
  reportes: 'mdi:chart-box-outline',
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

  // Reset selección de módulos cuando cambia el rol
  useEffect(() => {
    setModulos([]);
  }, [form.rol_perfil_id]);

  // Cerrar al hacer click fuera
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

  const modulosDisponibles = rolModuloMap[form.rol_perfil_id] || [];

  const toggleModulo = (mod: string) => {
    setModulos((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const selectAll = () => {
    if (modulosDisponibles.length) setModulos(modulosDisponibles);
  };

  const clearAll = () => setModulos([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
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

  const moduloBtnBase =
    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition border focus:outline-none focus:ring-2 focus:ring-gray-300';
  const moduloBtnActive = 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800';
  const moduloBtnInactive =
    'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5"
      >
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="hugeicons:access"
          title="REGISTRAR NUEVO PERFIL"
          description="Crea un nuevo perfil completando la información personal, datos de contacto, rol y módulo asignado."
        />

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
          <div className="h-full flex flex-col gap-5">
            {/* Nombre / Apellido */}
            <div className="flex items-center gap-5">
              <Inputx
                label="Nombre"
                name="nombre"
                placeholder="Ejem. Alvaro"
                value={form.nombre}
                onChange={handleChange}
                required
              />
              <Inputx
                label="Apellido"
                name="apellido"
                placeholder="Ejem. Maguiña"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>

            {/* DNI / Teléfono */}
            <div className="flex items-center gap-5">
              <Inputx
                label="DNI / CI"
                name="dni"
                placeholder="Ejem. 48324487"
                value={form.dni}
                onChange={handleChange}
                required
              />
              <InputxPhone
                label="Teléfono"
                countryCode="+51"
                name="telefono"
                placeholder="Ejem. 987654321"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>

            {/* Correo / Rol */}
            <div className="flex items-center gap-5">
              <Inputx
                label="Correo"
                name="correo"
                placeholder="Ejem. correo@gmail.com"
                value={form.correo}
                onChange={handleChange}
                required
              />
              <Selectx
                label="Rol Perfil"
                labelVariant="left"
                name="rol_perfil_id"
                value={form.rol_perfil_id}
                onChange={handleChange}
                placeholder="Seleccionar rol"
                required
              >
                <option value="">Seleccionar rol</option>
                <option value="1">Almacenero</option>
                <option value="2">Vendedor</option>
                <option value="3">Ecommerce asistente</option>
              </Selectx>
            </div>

            {/* Contraseñas */}
            <div className="flex items-center gap-5">
              <Inputx
                label="Contraseña"
                type="password"
                name="password"
                placeholder="Escribir aquí"
                value={form.password}
                onChange={handleChange}
                required
              />
              <Inputx
                label="Repetir Contraseña"
                type="password"
                name="confirmarPassword"
                placeholder="Escribir aquí"
                value={form.confirmarPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Acceso a Módulos */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-black">Acceso a Modulos</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={!modulosDisponibles.length}
                    title="Seleccionar todos"
                    className="disabled:opacity-40"
                    aria-label="Seleccionar todos los módulos"
                  >
                    <Icon icon="mdi:check-bold" className="text-2xl text-green-600" />
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={!modulosDisponibles.length}
                    title="Deseleccionar todos"
                    className="disabled:opacity-40"
                    aria-label="Deseleccionar todos los módulos"
                  >
                    <Icon icon="mdi:close-thick" className="text-2xl text-red-500" />
                  </button>
                </div>
              </div>

              {modulosDisponibles.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Selecciona un rol para ver los módulos disponibles.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {modulosDisponibles.map((mod) => {
                    const active = modulos.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModulo(mod)}
                        className={`${moduloBtnBase} ${active ? moduloBtnActive : moduloBtnInactive}`}
                        title={moduloLabelMap[mod] || mod}
                        aria-pressed={active}
                        aria-label={`${
                          active ? 'Quitar acceso a' : 'Dar acceso a'
                        } ${moduloLabelMap[mod] || mod}`}
                      >
                        <Icon icon={moduloIconMap[mod]} className="text-lg" />
                        <span>{moduloLabelMap[mod] || mod}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center gap-5">
            <Buttonx
              variant="quartery"
              disabled={loading}
              onClick={() => {}}
              label={loading ? 'Creando...' : 'Crear nuevo'}
              icon={loading ? 'line-md:loading-twotone-loop' : undefined}
              className={`px-4 text-sm ${loading ? '[&_svg]:animate-spin' : ''}`}
            />

            <Buttonx
              variant="outlined"
              onClick={onClose}
              label="Cancelar"
              className="px-4 text-sm border"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
