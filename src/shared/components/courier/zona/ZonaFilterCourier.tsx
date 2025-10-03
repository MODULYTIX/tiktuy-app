import { FiSearch } from "react-icons/fi";

type Props = {
  distrito: string;
  zona: string;
  distritosOptions: string[];
  zonasOptions: string[];
  onChange: (next: { distrito: string; zona: string }) => void;
  onClear: () => void;
};

export default function ZonaFilterCourier({
  distrito,
  zona,
  distritosOptions,
  zonasOptions,
  onChange,
  onClear,
}: Props) {
  return (
    <div className="bg-white p-3 rounded shadow-sm text-sm flex flex-col md:flex-row md:items-end gap-3">
      {/* Distrito */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Distrito</label>
        <select
          className="w-56 border rounded px-3 py-2"
          value={distrito}
          onChange={(e) => onChange({ distrito: e.target.value, zona })}
        >
          <option value="">Seleccionar distrito</option>
          {distritosOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Zona */}
      <div className="flex flex-col">
        <label className="block mb-1 font-medium">Zona</label>
        <select
          className="w-56 border rounded px-3 py-2"
          value={zona}
          onChange={(e) => onChange({ distrito, zona: e.target.value })}
        >
          <option value="">Seleccionar zona</option>
          {zonasOptions.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {/* Botón limpiar */}
      <div>
        <button
          type="button"
          className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-gray-100 text-sm whitespace-nowrap"
          onClick={onClear}
        >
          <FiSearch size={14} />
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
