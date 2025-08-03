import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { MdClear } from "react-icons/md";

interface Filters {
  estado: string;
  fecha_generacion: string;
  search: string;
}

interface Props {
  onFilterChange?: (filters: Filters) => void;
}

export default function MovimientoValidacionFilters({ onFilterChange }: Props) {
  const [filters, setFilters] = useState<Filters>({
    estado: "",
    fecha_generacion: "",
    search: "",
  });

  useEffect(() => {
    if (onFilterChange) onFilterChange(filters);
  }, [filters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      estado: "",
      fecha_generacion: "",
      search: "",
    });
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
        {/* Estado */}
        <div>
          <label className="block mb-1 font-medium">Estado</label>
          <select
            name="estado"
            value={filters.estado}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Seleccionar estado</option>
            <option value="validado">Validado</option>
            <option value="proceso">Proceso</option>
            <option value="observado">Observado</option>
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="block mb-1 font-medium">Fec. Generación</label>
          <input
            type="date"
            name="fecha_generacion"
            value={filters.fecha_generacion}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <label className="block mb-1 font-medium invisible">Buscar</label>
          <FiSearch className="absolute left-3 top-[36px] text-gray-400" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Buscar productos por nombre de producto o almacén"
            className="w-full border rounded pl-10 pr-4 py-2"
          />
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="border flex items-center gap-1 px-4 py-2 rounded hover:bg-gray-100 text-sm h-fit"
          >
            <MdClear size={18} />
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
