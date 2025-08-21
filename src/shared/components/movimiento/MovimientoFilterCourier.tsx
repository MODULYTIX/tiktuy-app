// src/shared/components/movimiento/MovimientoFilterCourier.tsx
import { FiSearch } from 'react-icons/fi';

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
  return (
    <div className="bg-white p-3 rounded shadow-sm text-sm flex flex-col md:flex-row md:items-end gap-3">
      {/* Estado */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Estado</label>
        <select
          value={value.estado}
          onChange={(e) => onChange({ estado: e.target.value })}
          className="w-48 border rounded px-3 py-2"
        >
          <option value="">Todos</option>
          <option value="Activo">Activo</option>
          <option value="Proceso">Proceso</option>
          <option value="Observado">Observado</option>
          <option value="Inactivo">Inactivo</option>
          <option value="Validado">Validado</option>
        </select>
      </div>

      {/* Fecha generación */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Fec. Generación</label>
        <input
          type="date"
          value={value.fecha}
          onChange={(e) => onChange({ fecha: e.target.value })}
          className="w-48 border rounded px-3 py-2"
        />
      </div>

      {/* Buscador */}
      <div className="flex-1">
        <label className="sr-only">Buscar</label>
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={value.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Buscar por descripción u almacén"
            className="w-full border rounded pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Botón limpiar */}
      <div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-gray-100 text-sm whitespace-nowrap"
        >
          <FiSearch size={14} />
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
