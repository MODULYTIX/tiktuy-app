import { FiSearch } from 'react-icons/fi';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Select } from '@/shared/components/Select';

export interface MovimientoCourierFilters {
  estado: string; // 'Activo' | 'Inactivo' | 'Proceso' | 'Observado' | ''
  fecha: string;  // 'YYYY-MM-DD' | ''
  q: string;      // texto libre
}

interface Props {
  value: MovimientoCourierFilters;
  onChange: (next: Partial<MovimientoCourierFilters>) => void;
  onClear: () => void;
}

export default function MovimientoFilterCourier({ value, onChange, onClear }: Props) {
  const field =
    'w-full h-10 px-3 rounded-md border rounded border-gray40 bg-gray-20 text-gray-900 ' +
    'placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors';

  return (
    <div className="bg-white p-5 rounded-md shadow-default border border-gray30 flex flex-col md:flex-row md:items-end gap-4 text-sm">
      {/* Estado */}
      <div className="flex flex-col w-48">
        <label className="block mb-1 font-medium text-gray-700">Estado</label>
        <Select
          id="f-estado"
          value={value.estado}
          onChange={(e) => onChange({ estado: e.target.value })}
          options={[
            { value: '', label: 'Todos' },
            { value: 'Activo', label: 'Activo' },
            { value: 'Proceso', label: 'Proceso' },
            { value: 'Observado', label: 'Observado' },
            { value: 'Inactivo', label: 'Inactivo' },
            { value: 'Validado', label: 'Validado' },
          ]}
          placeholder="Seleccionar estado"
        />
      </div>

      {/* Fecha generación */}
      <div className="flex flex-col w-48 ">
        <label className="block mb-1 font-medium text-gray-700 ">Fec. Generación</label>
        <input
          type="date"
          value={value.fecha}
          onChange={(e) => onChange({ fecha: e.target.value })}
          className={field}
        />
      </div>

      {/* Buscador */}
      <div className="flex-1">
        <label className="sr-only">Buscar</label>
        <div className="relative border border-gray10 rounded">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={value.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Buscar por descripción u almacén"
            className={`${field} pl-10`}
          />
        </div>
      </div>

      {/* Botón limpiar */}
      <div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-3 text-gray-700 bg-gray10 border border-gray60 hover:bg-gray-100 px-4 py-2 rounded sm:w-auto"
        >
          <Icon icon="mynaui:delete" width="20" height="20" color="gray60" />
          <span>Limpiar Filtros</span>
        </button>
      </div>
    </div>
  );
}
