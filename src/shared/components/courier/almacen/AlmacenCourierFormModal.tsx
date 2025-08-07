import { useEffect, useState } from 'react';
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
  onSave?: (almacen: Almacen) => void;
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

  useEffect(() => {
    if (almacen && (isViewMode || isEditMode)) {
      setFormData(almacen);
    } else if (isCreateMode) {
      setFormData({
        nombre: '',
        departamento: '',
        ciudad: '',
        direccion: '',
      });
    }
  }, [almacen, modo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (onSave) onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-backgroundModal bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl p-6 overflow-y-auto animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <Icon icon="mdi:warehouse" width={24} />
            {modo === 'registrar'
              ? 'Registrar Nuevo Almacén'
              : modo === 'editar'
              ? 'Editar Almacén'
              : 'Detalle del Almacén'}
          </h2>
          <button onClick={onClose}>
            <Icon icon="ic:round-close" width="24" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {modo === 'ver'
            ? 'Visualiza la información del almacén.'
            : 'Complete la información para registrar o editar un almacén.'}
        </p>

        <div className="space-y-4">
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
            >
              <option value="">Seleccionar departamento</option>
              <option value="Lima">Lima</option>
              <option value="Arequipa">Arequipa</option>
              <option value="Cusco">Cusco</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad</label>
            <select
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              disabled={isViewMode}
              className="mt-1 w-full border px-3 py-2 rounded-md text-sm bg-white"
            >
              <option value="">Seleccionar ciudad</option>
              <option value="Lima">Lima</option>
              <option value="Miraflores">Miraflores</option>
              <option value="Camaná">Camaná</option>
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
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between gap-2">
          {!isViewMode && (
            <button
              onClick={handleSubmit}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
            >
              {modo === 'registrar' ? 'Crear nuevo' : 'Guardar cambios'}
            </button>
          )}
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
