import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

interface Almacen {
  id?: number;
  nombre: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  fecha?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modo: 'ver' | 'editar' | 'registrar';
  almacen: Almacen | null;
  onSave?: (almacen: Almacen) => void; // opcional por si el padre solo muestra (ver)
}

export default function AlmacenFormModal({
  isOpen,
  onClose,
  modo,
  almacen,
  onSave,
}: Props) {
  const [formData, setFormData] = useState<Almacen>({
    nombre: '',
    departamento: '',
    ciudad: '',
    direccion: '',
  });

  const isViewMode = modo === 'ver';
  const isEditMode = modo === 'editar';
  const isCreateMode = modo === 'registrar';

  // Opciones demo (reemplazar por ubigeo dinámico cuando conectes API)
  const departamentos = useMemo(() => ['Lima', 'Arequipa', 'Cusco'], []);
  const ciudadesPorDepartamento = useMemo<Record<string, string[]>>(
    () => ({
      Lima: ['Lima', 'Miraflores', 'San Isidro'],
      Arequipa: ['Arequipa', 'Camaná', 'Cayma'],
      Cusco: ['Cusco', 'San Sebastián', 'San Jerónimo'],
    }),
    []
  );

  // Carga inicial / cambio de modo
  useEffect(() => {
    if (!isOpen) return;
    if (almacen && (isViewMode || isEditMode)) {
      setFormData({
        id: almacen.id,
        nombre: almacen.nombre ?? '',
        departamento: almacen.departamento ?? '',
        ciudad: almacen.ciudad ?? '',
        direccion: almacen.direccion ?? '',
        fecha: almacen.fecha,
      });
    } else if (isCreateMode) {
      setFormData({
        nombre: '',
        departamento: '',
        ciudad: '',
        direccion: '',
      });
    }
  }, [isOpen, almacen, isViewMode, isEditMode, isCreateMode]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Si cambia el departamento, resetea ciudad si ya no pertenece
    if (name === 'departamento') {
      const ciudades = ciudadesPorDepartamento[value] ?? [];
      setFormData((prev) => ({
        ...prev,
        departamento: value,
        ciudad: ciudades.includes(prev.ciudad) ? prev.ciudad : '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (isViewMode) return; // no guarda en modo 'ver'

    // Validación mínima
    if (!formData.nombre || !formData.departamento || !formData.ciudad || !formData.direccion) {
      // podrías reemplazar por tu sistema de toasts
      console.warn('Complete todos los campos obligatorios');
      return;
    }

    onSave?.(formData);
    onClose();
  };

  if (!isOpen) return null;

  const ciudades = ciudadesPorDepartamento[formData.departamento] ?? [];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end"
    >
      <div className="bg-white w-full max-w-md h-full shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <Icon icon="mdi:warehouse" width={24} />
            {isCreateMode ? 'Registrar Nuevo Almacén' : isEditMode ? 'Editar Almacén' : 'Detalle del Almacén'}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">
            <Icon icon="ic:round-close" width="24" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {isViewMode
            ? 'Visualiza la información del almacén.'
            : 'Complete la información para registrar o editar un almacén.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de Almacén
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Ejem. Almacén secundario"
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Departamento
            </label>
            <select
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              disabled={isViewMode}
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm bg-white"
              required
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad</label>
            <select
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              disabled={isViewMode || !formData.departamento}
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm bg-white"
              required
            >
              <option value="">Seleccionar ciudad</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Ejem. Av. Los Próceres 1234, La Victoria, Lima"
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm"
              required
            />
          </div>

          {/* Solo mostrar fecha si viene del backend */}
          {formData.fecha && (
            <div>
              <span className="block text-sm font-medium text-gray-700">Fecha</span>
              <div className="mt-1 text-sm text-gray-600">{formData.fecha}</div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {!isViewMode && (
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
              >
                {isCreateMode ? 'Crear nuevo' : 'Guardar cambios'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium w-full"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
