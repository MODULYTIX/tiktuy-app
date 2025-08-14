import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { FiSearch } from 'react-icons/fi';
import { LiaPlusSquareSolid } from 'react-icons/lia';

export interface Filters {
  almacenamiento_id: string;
  categoria_id: string;
  estado: string;
  stock_bajo: boolean;
  precio_bajo: boolean;
  precio_alto: boolean;
  search: string;
}

type BooleanFilterKey = 'stock_bajo' | 'precio_bajo' | 'precio_alto';

interface Props {
  onFilterChange?: (filters: Filters) => void;
  onNuevoMovimientoClick?: () => void;
}

const booleanFilters: { name: BooleanFilterKey; label: string }[] = [
  { name: 'stock_bajo', label: 'Stock bajo' },
  { name: 'precio_bajo', label: 'Precios bajos' },
  { name: 'precio_alto', label: 'Precios altos' },
];

export default function MovimientoRegistroFilters({
  onFilterChange,
  onNuevoMovimientoClick,
}: Props) {
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
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;

    // ✅ Type narrowing para poder usar .checked sin error TS
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const name = target.name as BooleanFilterKey;

      // Opcional: hacerlos realmente exclusivos en UI
      if (name === 'precio_bajo' && target.checked) {
        setFilters((prev) => ({ ...prev, precio_bajo: true, precio_alto: false }));
        return;
      }
      if (name === 'precio_alto' && target.checked) {
        setFilters((prev) => ({ ...prev, precio_bajo: false, precio_alto: true }));
        return;
      }

      setFilters((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      const name = target.name as Exclude<keyof Filters, BooleanFilterKey>;
      setFilters((prev) => ({
        ...prev,
        [name]: target.value,
      }));
    }
  };

  const handleReset = () => {
    const reset: Filters = {
      almacenamiento_id: '',
      categoria_id: '',
      estado: '',
      stock_bajo: false,
      precio_bajo: false,
      precio_alto: false,
      search: '',
    };
    setFilters(reset);
    onFilterChange?.(reset);
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm text-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <option value="descontinuado">Descontinuado</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Filtros exclusivos</label>
          <div className="flex flex-wrap gap-3 mt-3">
            {booleanFilters.map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={name}
                  checked={filters[name]}
                  onChange={handleChange}
                />
                <span className="text-xs">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 mt-4">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Buscar productos por nombre"
            className="w-full border rounded pl-10 pr-4 py-2"
          />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="border px-4 py-2 rounded hover:bg-gray-100 text-sm whitespace-nowrap"
        >
          Limpiar Filtros
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={onNuevoMovimientoClick}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
          >
            <LiaPlusSquareSolid size={18} className="shrink-0" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>
    </div>
  );
}
