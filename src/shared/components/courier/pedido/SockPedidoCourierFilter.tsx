import type { StockFilters } from '@/role/courier/pages/StockProducto';
import { useEffect, useState } from 'react';


type Option = { value: string; label: string };

export default function StockPedidoFilterCourier({
  filters,
  onChange,
  options,
  loading,
}: {
  filters: StockFilters;
  onChange: (f: StockFilters) => void;
  options: { almacenes: Option[]; categorias: Option[]; estados: Option[] };
  loading?: boolean;
}) {
  const [local, setLocal] = useState(filters);

  // debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 250);
    return () => clearTimeout(t);
  }, [local]);

  // Sincroniza cuando el padre resetea filtros
  useEffect(() => { setLocal(filters); }, [filters]);

  const disabled = !!loading;

  const handleReset = () => {
    const clean: StockFilters = {
      almacenId: '',
      categoriaId: '',
      estado: '',
      stockBajo: false,
      precioOrden: '',
      q: '',
    };
    setLocal(clean);
    onChange(clean);
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
      {/* Almacén */}
      <div>
        <label className="block mb-1 font-medium">Almacén</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={local.almacenId}
          onChange={(e) => setLocal({ ...local, almacenId: e.target.value })}
          disabled={disabled}
        >
          <option value="">Todos</option>
          {options.almacenes.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Categoría */}
      <div>
        <label className="block mb-1 font-medium">Categoría</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={local.categoriaId}
          onChange={(e) => setLocal({ ...local, categoriaId: e.target.value })}
          disabled={disabled}
        >
          <option value="">Todas</option>
          {options.categorias.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div>
        <label className="block mb-1 font-medium">Estado</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={local.estado}
          onChange={(e) => setLocal({ ...local, estado: e.target.value })}
          disabled={disabled}
        >
          <option value="">Todos</option>
          {options.estados.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Checkboxes y orden precio */}
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={local.stockBajo}
            onChange={(e) => setLocal({ ...local, stockBajo: e.target.checked })}
            disabled={disabled}
          />
          <span className="text-xs">Stock bajo</span>
        </label>

        <select
          className="border rounded px-2 py-2 text-xs"
          value={local.precioOrden}
          onChange={(e) => setLocal({ ...local, precioOrden: e.target.value as StockFilters['precioOrden'] })}
          disabled={disabled}
        >
          <option value="">Precio: --</option>
          <option value="asc">Precio: menor a mayor</option>
          <option value="desc">Precio: mayor a menor</option>
        </select>
      </div>

      {/* Buscador y botón */}
      <div className="col-span-full flex items-center gap-2">
        <input
          type="text"
          placeholder="Buscar productos por nombre, descripción o código"
          className="w-full border rounded px-3 py-2"
          value={local.q}
          onChange={(e) => setLocal({ ...local, q: e.target.value })}
          disabled={disabled}
        />
        <button
          type="button"
          className="border px-3 py-2 rounded hover:bg-gray-100 text-sm w-40"
          onClick={handleReset}
          disabled={disabled}
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}