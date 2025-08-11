import { useEffect, useState } from 'react';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

interface Filters {
  almacenamiento_id: string;
  categoria_id: string;
  estado: string;
  stock_bajo: boolean;
  precio_bajo: boolean;
  precio_alto: boolean;
  search: string;
}

interface Props {
  onFilterChange?: (filters: Filters) => void;
}

export default function StockFilters({ onFilterChange }: Props) {
  const { token } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
  });

  useEffect(() => {
    if (!token) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
    fetchAlmacenes(token).then(setAlmacenes).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (onFilterChange) onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value } = target;

    // Si es un checkbox
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFilters((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      // Si es un select o un input normal
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      almacenamiento_id: '',
      categoria_id: '',
      estado: '',
      stock_bajo: false,
      precio_bajo: false,
      precio_alto: false,
      search: '',
    };
    setFilters(resetFilters);
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
      <div>
        <label className="block mb-1 font-medium">Almacén</label>
        <select
          name="almacenamiento_id"
          value={filters.almacenamiento_id}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Seleccionar almacén</option>
          {almacenes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre_almacen}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">Categoría</label>
        <select
          name="categoria_id"
          value={filters.categoria_id}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Seleccionar categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.descripcion}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">Estado</label>
        <select
          name="estado"
          value={filters.estado}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Seleccionar estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="stock_bajo"
            checked={filters.stock_bajo}
            onChange={handleChange}
          />
          <span className="text-xs">Stock bajo</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="precio_bajo"
            checked={filters.precio_bajo}
            onChange={handleChange}
          />
          <span className="text-xs">Precios bajos</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="precio_alto"
            checked={filters.precio_alto}
            onChange={handleChange}
          />
          <span className="text-xs">Precios altos</span>
        </label>
      </div>

      <div className="col-span-full flex items-center gap-2">
        <input
          name="search"
          type="text"
          value={filters.search}
          onChange={handleChange}
          placeholder="Buscar productos por nombre, descripción ó código."
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={handleReset}
          className="border px-3 py-2 rounded hover:bg-gray-100 text-sm w-32"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
