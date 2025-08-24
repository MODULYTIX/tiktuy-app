import { useEffect, useState } from 'react';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { FiSearch } from 'react-icons/fi';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Select } from '@/shared/components/Select';

export interface Filters {
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
  onNuevoMovimientoClick?: () => void; // <— agregado para tu otra vista
}

export default function MovimientoRegistroFilters({ onFilterChange, onNuevoMovimientoClick }: Props) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, type, value } = e.target;
    if (type === 'checkbox') {
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
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
      {/* xs: 1 col, sm: 2 cols, lg: 1fr 1fr 1fr auto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm">
        {/* Almacén (solo cambia el label visual) */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Almacén</div>
          <div className="relative w-full">
            <Select
              id="f-ecommerce"
              value={filters.almacenamiento_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, almacenamiento_id: e.target.value }))
              }
              options={[
                { value: '', label: 'Seleccionar almacén' },
                ...almacenes.map((a) => ({
                  value: String(a.id),
                  label: a.nombre_almacen,
                })),
              ]}
              placeholder="Seleccionar almacén"
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
                setFilters((prev) => ({ ...prev, categoria_id: e.target.value }))
              }
              options={[
                { value: '', label: 'Seleccionar categoría' },
                ...categorias.map((c) => ({
                  value: String(c.id),
                  label: c.descripcion,
                })),
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
                setFilters((prev) => ({ ...prev, estado: e.target.value }))
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

        {/* Buscador + acciones */}
        <div className="col-span-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Buscador */}
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

          {/* Acciones a la derecha */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-3 text-gray-700 bg-gray10 border border-gray60 hover:bg-gray-100 px-4 py-2 rounded sm:w-auto"
            >
              <Icon icon="mynaui:delete" width="24" height="24" color="gray60" />
              <span>Limpiar Filtros</span>
            </button>

            {/* Línea divisoria a la izquierda del botón azul */}
            <div className="hidden sm:block h-10 w-px bg-gray30" />

            <button
              type="button"
              onClick={onNuevoMovimientoClick}
              className="flex items-center gap-2 px-4 h-10 rounded text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm"
            >
              <Icon icon="mdi:plus-box-outline" width="18" height="18" />
              <span>Nuevo Movimiento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
