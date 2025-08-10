import { FiSearch } from 'react-icons/fi';

export default function MovimientoFilterCourier() {
  return (
    <div className="bg-white p-3 rounded shadow-sm text-sm flex flex-col md:flex-row md:items-end gap-3">

      {/* Estado */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Estado</label>
        <select className="w-48 border rounded px-3 py-2">
          <option value="">Seleccionar estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* Fecha generación */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Fec. Generación</label>
        <input
          type="date"
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
            placeholder="Buscar productos por nombre de producto o almacén"
            className="w-full border rounded pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Botón limpiar */}
      <div>
        <button
          type="button"
          className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-gray-100 text-sm whitespace-nowrap"
        >
          <FiSearch size={14} />
          Limpiar Filtros
        </button>
      </div>

    </div>
  );
}
