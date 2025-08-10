import { FiSearch } from 'react-icons/fi';

export default function ZonaFilterCourier() {
  return (
    <div className="bg-white p-3 rounded shadow-sm text-sm flex flex-col md:flex-row md:items-end gap-3">

      {/* Distrito */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Distrito</label>
        <select className="w-56 border rounded px-3 py-2">
          <option value="">Seleccionar distrito</option>
          <option value="1">Distrito 1</option>
          <option value="2">Distrito 2</option>
        </select>
      </div>

      {/* Zona */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Zona</label>
        <select className="w-56 border rounded px-3 py-2">
          <option value="">Seleccionar zona</option>
          <option value="a">Zona A</option>
          <option value="b">Zona B</option>
        </select>
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
