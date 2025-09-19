import { useEffect, useRef, useState } from 'react';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { FiSearch } from 'react-icons/fi';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Select } from '@/shared/components/Select';

// Exporta para usar en la página
export interface StockFilterValue {
  almacenamiento_id: string;
  categoria_id: string;
  estado: '' | 'activo' | 'inactivo';
  stock_bajo: boolean;
  precio_bajo: boolean;
  precio_alto: boolean;
  search: string;
}

interface Props {
  onFilterChange?: (filters: StockFilterValue) => void;
  searchDebounceMs?: number;
}

export default function StockFilters({ onFilterChange, searchDebounceMs = 300 }: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [filters, setFilters] = useState<StockFilterValue>({
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

  // Emitir inmediatamente cuando cambian campos que no son "search"
  const prevNoSearch = useRef<Omit<StockFilterValue, 'search'>>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
  });
  useEffect(() => {
    const { ...noSearch } = filters;
    if (JSON.stringify(prevNoSearch.current) !== JSON.stringify(noSearch)) {
      prevNoSearch.current = noSearch;
      onFilterChange?.(filters);
    }
  }, [
    filters.almacenamiento_id,
    filters.categoria_id,
    filters.estado,
    filters.stock_bajo,
    filters.precio_bajo,
    filters.precio_alto,
  ]); // eslint-disable-line

  // Debounce sólo para search
  useEffect(() => {
    const t = setTimeout(() => onFilterChange?.(filters), searchDebounceMs);
    return () => clearTimeout(t);
  }, [filters.search, onFilterChange, searchDebounceMs]);

  // Select acepta evento o value directo
  const fromSelect = (eOrValue: any) =>
    typeof eOrValue === 'string' || typeof eOrValue === 'number'
      ? String(eOrValue)
      : String(eOrValue?.target?.value ?? '');

  const handleSelect = (name: keyof StockFilterValue) => (eOrValue: any) => {
    if (name === 'estado') {
      const raw = fromSelect(eOrValue);
      const value = raw === 'activo' || raw === 'inactivo' ? raw : '';
      setFilters((prev) => ({ ...prev, estado: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: fromSelect(eOrValue) }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, type, value } = e.target;
    if (type === 'checkbox') {
      if (name === 'stock_bajo') {
        setFilters((p) => ({ ...p, stock_bajo: checked, precio_bajo: false, precio_alto: false }));
      } else if (name === 'precio_bajo') {
        setFilters((p) => ({ ...p, precio_bajo: checked, stock_bajo: false, precio_alto: false }));
      } else if (name === 'precio_alto') {
        setFilters((p) => ({ ...p, precio_alto: checked, stock_bajo: false, precio_bajo: false }));
      } else {
        setFilters((prev) => ({ ...prev, [name]: checked } as any));
      }
    } else {
      setFilters((prev) => ({ ...prev, [name]: value } as any));
    }
  };

  const handleReset = () => {
    setFilters({
      almacenamiento_id: '',
      categoria_id: '',
      estado: '',
      stock_bajo: false,
      precio_bajo: false,
      precio_alto: false,
      search: '',
    });
  };

  const field =
    'w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 ' +
    'placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors';

  return (
    <div className="bg-white p-5 rounded-md shadow-default border border-gray30">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm">
        {/* Ecommerce / Almacén */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Ecommerce</div>
          <div className="relative w-full">
            <Select
              id="f-ecommerce"
              value={filters.almacenamiento_id}
              onChange={handleSelect('almacenamiento_id')}
              options={[
                { value: '', label: 'Seleccionar ecommerce' },
                ...almacenes.map((a) => ({ value: String(a.id), label: a.nombre_almacen })),
              ]}
              placeholder="Seleccionar ecommerce"
            />
          </div>
        </div>

        {/* Categorías */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Categorías</div>
          <div className="relative w-full">
            <Select
              id="f-categoria"
              value={filters.categoria_id}
              onChange={handleSelect('categoria_id')}
              options={[
                { value: '', label: 'Seleccionar categoría' },
                ...categorias.map((c) => ({ value: String(c.id), label: c.descripcion })),
              ]}
              placeholder="Seleccionar categoría"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Estado</div>
          <div className="relative w-full">
            <Select
              id="f-estado"
              value={filters.estado}
              onChange={handleSelect('estado')}
              options={[
                { value: '', label: 'Seleccionar estado' },
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' },
              ]}
              placeholder="Seleccionar estado"
            />
          </div>
        </div>

        {/* Filtros exclusivos */}
        <div className="min-w-0">
          <div className="text-center font-medium text-gray-700 mb-2">Filtros exclusivos</div>
          <div className="h-10 flex items-center justify-center lg:justify-start gap-4">
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                name="stock_bajo"
                checked={filters.stock_bajo}
                onChange={handleChange}
                className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
              />
              <span>Stock bajo</span>
            </label>
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                name="precio_bajo"
                checked={filters.precio_bajo}
                onChange={handleChange}
                className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
              />
              <span>Precios bajos</span>
            </label>
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                name="precio_alto"
                checked={filters.precio_alto}
                onChange={handleChange}
                className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
              />
              <span>Precios altos</span>
            </label>
          </div>
        </div>

        {/* Buscador + botón */}
        <div className="col-span-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 border border-gray60 rounded">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              type="text"
              value={filters.search}
              onChange={handleChange}
              placeholder="Buscar productos por nombre, descripción ó código."
              className={`${field} pl-10`}
            />
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-3 text-gray-700 bg-gray10 border border-gray60 hover:bg-gray-100 px-4 py-2 rounded sm:w-auto"
          >
            <Icon icon="mynaui:delete" width="24" height="24" color="gray60" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>
    </div>
  );
}
