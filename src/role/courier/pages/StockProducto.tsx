// shared/components/courier/pedido/SockPedidoCourierFilter.tsx
import type { Dispatch, SetStateAction } from 'react';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { Select } from '@/shared/components/Select';



export type StockFilters = {
  almacenId: string;      
  categoriaId: string;   
  estado: string;         
  stockBajo: boolean;    
  precioOrden: '' | 'asc' | 'desc';
  q: string;    

};

type Option = { value: string; label: string };

type Props = {
  filters: StockFilters;
  onChange: Dispatch<SetStateAction<StockFilters>>;
  options: {
    almacenes: Option[];
    categorias: Option[];
    estados: Option[];
  };
  loading?: boolean;
};

export default function StockPedidoFilterCourier({
  filters,
  onChange,
  options,
  loading,
}: Props) {
  const set = (patch: Partial<StockFilters>) =>
    onChange((prev) => ({ ...prev, ...patch }));

  // input styling (igual que el otro filtro)
  const field =
    'w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-900 ' +
    'placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-[#1A253D] transition-colors';

  return (
    <div className="bg-white p-5 rounded-md shadow-default border border-gray30">
      {/* xs: 1 col, sm: 2, lg: 1fr 1fr 1fr auto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm">

        {/* Almacén */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Ecommerce</div>
          <div className="relative w-full">
            <Select
              value={filters.almacenId}
              onChange={(e) => set({ almacenId: e.target.value })}
              options={[{ value: '', label: 'Seleccionar ecommerce' }, ...options.almacenes]}
              placeholder="Seleccionar ecommerce"
              disabled={loading}
            />
          </div>
        </div>

        {/* Categorías */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Categorías</div>
          <div className="relative w-full">
            <Select
              value={filters.categoriaId}
              onChange={(e) => set({ categoriaId: e.target.value })}
              options={[{ value: '', label: 'Seleccionar categoría' }, ...options.categorias]}
              placeholder="Seleccionar categoría"
              disabled={loading}
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <div className="text-center font-medium text-gray-700 mb-2">Estado</div>
          <div className="relative w-full">
            <Select
              value={filters.estado}
              onChange={(e) => set({ estado: e.target.value })}
              options={[{ value: '', label: 'Seleccionar estado' }, ...options.estados]}
              placeholder="Seleccionar estado"
              disabled={loading}
            />
          </div>
        </div>

        {/* Filtros exclusivos */}
        <div className="min-w-0">
          <div className="text-center font-medium text-gray-700 mb-2">Filtros exclusivos</div>

          {/* altura alineada a los selects */}
          <div className="h-10 flex items-center justify-center lg:justify-start gap-4">
            {/* Stock bajo */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={filters.stockBajo}
                onChange={(e) => set({ stockBajo: e.target.checked })}
                disabled={loading}
              />
              <span>Stock bajo</span>
            </label>

            {/* Orden de precio (low/high) como radios mutuamente excluyentes */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="radio"
                name="precioOrden"
                className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={filters.precioOrden === 'asc'}
                onChange={() => set({ precioOrden: filters.precioOrden === 'asc' ? '' : 'asc' })}
                disabled={loading}
              />
              <span>Precios bajos</span>
            </label>
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="radio"
                name="precioOrden"
                className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={filters.precioOrden === 'desc'}
                onChange={() => set({ precioOrden: filters.precioOrden === 'desc' ? '' : 'desc' })}
                disabled={loading}
              />
              <span>Precios Altos</span>
            </label>
          </div>
        </div>

        {/* Buscador + limpiar */}
        <div className="col-span-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 border border-gray60 rounded">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className={`${field} pl-10`}
              type="text"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Buscar productos por nombre, descripción ó código."
              disabled={loading}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              set({
                almacenId: '',
                categoriaId: '',
                estado: '',
                stockBajo: false,
                precioOrden: '',
                q: '',
              })
            }
            className="flex items-center gap-3 text-gray-700 bg-gray10 border border-gray60 hover:bg-gray-100 px-4 py-2 rounded sm:w-auto"
            disabled={loading}
          >
            <FiX />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>
    </div>
  );
}
