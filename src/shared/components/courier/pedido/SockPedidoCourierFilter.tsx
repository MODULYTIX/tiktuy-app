import { useEffect, useState } from 'react';
import type React from 'react'; // <- para React.ChangeEvent tipado
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { FiSearch } from 'react-icons/fi';
import { Icon } from '@iconify/react';
import { Select } from '@/shared/components/Select';

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

/** Acepta event, string o {value,label} y devuelve string de forma segura */
type SelectChange = { target?: { value?: string } } | string | { value?: string; label?: string } | undefined | null;
const pickSelectValue = (e: SelectChange): string => {
  if (typeof e === 'string') return e;
  if (e && typeof (e as any).value === 'string') return (e as any).value;
  if (e && (e as any).target && typeof (e as any).target.value === 'string') return (e as any).target.value;
  return '';
};

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
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleCheckOrText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        {/* Ecommerce */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Ecommerce</div>
          <div className="relative w-full">
            <Select
              id="f-ecommerce"
              value={filters.almacenamiento_id}
              onChange={(e) =>
                setFilters((p) => ({ ...p, almacenamiento_id: pickSelectValue(e as SelectChange) }))
              }
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
              onChange={(e) =>
                setFilters((p) => ({ ...p, categoria_id: pickSelectValue(e as SelectChange) }))
              }
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
              onChange={(e) =>
                setFilters((p) => ({ ...p, estado: pickSelectValue(e as SelectChange) }))
              }
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
          <div className="h-10 flex items-center justify-center lg:justify-start gap-6">
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap cursor-pointer select-none">
              <input
                type="checkbox"
                name="stock_bajo"
                checked={filters.stock_bajo}
                onChange={handleCheckOrText}
                className="peer sr-only"
              />
              <span className="h-4 w-4 rounded-[3px] border border-gray-400 grid place-items-center peer-checked:bg-[#1A253D] peer-checked:border-[#1A253D] transition-colors">
                <Icon icon="mdi:check" className="text-white text-[12px] opacity-0 peer-checked:opacity-100" />
              </span>
              <span>Stock bajo</span>
            </label>

            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap cursor-pointer select-none">
              <input
                type="checkbox"
                name="precio_bajo"
                checked={filters.precio_bajo}
                onChange={handleCheckOrText}
                className="peer sr-only"
              />
              <span className="h-4 w-4 rounded-[3px] border border-gray-400 grid place-items-center peer-checked:bg-[#1A253D] peer-checked:border-[#1A253D] transition-colors">
                <Icon icon="mdi:check" className="text-white text-[12px] opacity-0 peer-checked:opacity-100" />
              </span>
              <span>Precios bajos</span>
            </label>

            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap cursor-pointer select-none">
              <input
                type="checkbox"
                name="precio_alto"
                checked={filters.precio_alto}
                onChange={handleCheckOrText}
                className="peer sr-only"
              />
              <span className="h-4 w-4 rounded-[3px] border border-gray-400 grid place-items-center peer-checked:bg-[#1A253D] peer-checked:border-[#1A253D] transition-colors">
                <Icon icon="mdi:check" className="text-white text-[12px] opacity-0 peer-checked:opacity-100" />
              </span>
              <span>Precios Altos</span>
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
              onChange={handleCheckOrText}
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
