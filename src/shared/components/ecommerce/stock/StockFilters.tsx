import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes, fetchSedesConRepresentante } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

import Buttonx from '@/shared/common/Buttonx';
import { SearchInputx } from '@/shared/common/SearchInputx';
import { Selectx } from '@/shared/common/Selectx';

interface Filters {
  almacenamiento_id: string;
  categoria_id: string;
  estado: string;
  nombre: string;
  stock_bajo: boolean;
  precio_bajo: boolean;
  precio_alto: boolean;
  search: string;
  movimientos_sedes: string;
}

interface Props {
  onFilterChange?: (filters: Filters) => void;
}

/* Export para otros archivos */
export type StockFilterValue = Filters;
export type { Filters };

/* --- Helpers --- */
function toArray<T = unknown>(res: any): T[] {
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res?.data)) return res.data as T[];
  if (res && typeof res === 'object') return Object.values(res) as T[];
  return [];
}

export default function StockFilters({ onFilterChange }: Props) {
  const { token } = useAuth();

  /* Data */
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);

  /* UI state */
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingAlm, setLoadingAlm] = useState(false);
  const [errorCats, setErrorCats] = useState<string | null>(null);
  const [errorAlm, setErrorAlm] = useState<string | null>(null);

  /* Filtros controlados */
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: '',
    categoria_id: '',
    estado: '',
    nombre: '',
    stock_bajo: false,
    precio_bajo: false,
    precio_alto: false,
    search: '',
    movimientos_sedes: '',
  });

  /* Evitar setState en desmontaje */
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* Carga de datos */
  useEffect(() => {
    if (!token) return;

    setLoadingCats(true);
    setErrorCats(null);
    fetchCategorias(token)
      .then((res) => {
        if (!mountedRef.current) return;
        setCategorias(toArray<Categoria>(res));
      })
      .catch((err) => {
        console.error('Error al cargar categorías:', err);
        if (!mountedRef.current) return;
        setErrorCats('No se pudieron cargar las categorías');
        setCategorias([]); // defensivo
      })
      .finally(() => mountedRef.current && setLoadingCats(false));

    setLoadingAlm(true);
    setErrorAlm(null);
    fetchSedesConRepresentante(token)
      .then((res) => {
        if (!mountedRef.current) return;
        setAlmacenes(toArray<Almacenamiento>(res));
      })
      .catch((err) => {
        console.error('Error al cargar almacenes:', err);
        if (!mountedRef.current) return;
        setErrorAlm('No se pudieron cargar los almacenes');
        setAlmacenes([]); // defensivo
      })
      .finally(() => mountedRef.current && setLoadingAlm(false));
  }, [token]);

  /* Notificar cambios al padre (el padre ya hace debounce) */
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  /* Handlers */
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFilters((prev) => ({ ...prev, [name]: checked }));
    },
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setFilters({
      almacenamiento_id: '',
      categoria_id: '',
      estado: '',
      nombre: '',
      stock_bajo: false,
      precio_bajo: false,
      precio_alto: false,
      search: '',
      movimientos_sedes: '',
    });
  }, []);

  /* Opciones memoizadas */
  const disponibilidadAlmacenes = useMemo(
    () => (Array.isArray(almacenes) ? almacenes : []),
    [almacenes]
  );
  const disponibilidadCategorias = useMemo(
    () => (Array.isArray(categorias) ? categorias : []),
    [categorias]
  );

  /* === LÓGICA TIPO MODELO BASE PARA PRECIO === */
  // Solo uno activo entre precios bajos / altos
  const precioOrden: '' | 'asc' | 'desc' = filters.precio_bajo
    ? 'asc'
    : filters.precio_alto
      ? 'desc'
      : '';

  return (
    <div className="bg-white p-5 rounded-md shadow-default border-b-4 border-gray90 ">
      {/* xs: 1 col, sm: 2 cols, lg: 1fr 1fr 1fr auto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm ">

        {/* Ecommerce */}
        <Selectx
          label="Almacen"
          value={filters.movimientos_sedes}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              movimientos_sedes: e.target.value,
            }))
          }
          placeholder="Seleccionar sede"
          id="f-movsede"
          name="movimientos_sedes"
        >
          <option value="">Todos</option>
          {disponibilidadAlmacenes.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.nombre_almacen}
            </option>
          ))}
        </Selectx>
        {errorAlm && (
          <div className="text-xs text-red-600 col-span-full">{errorAlm}</div>
        )}

        {/* Categorías */}
        <Selectx
          label="Categorías"
          value={filters.categoria_id}
          onChange={handleInputChange}
          placeholder={loadingCats ? 'Cargando...' : 'Seleccionar categoría'}
          className="w-full"
          id="f-categoria"
          disabled={loadingCats}
          name="categoria_id"
        >
          <option value="">Todas</option>
          {disponibilidadCategorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </Selectx>
        {errorCats && (
          <div className="text-xs text-red-600 col-span-full">{errorCats}</div>
        )}

        {/* Estado */}
        <Selectx
          label="Estado"
          value={filters.estado}
          onChange={handleInputChange}
          placeholder="Seleccionar estado"
          className="w-full"
          id="f-estado"
          name="estado"
        >
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </Selectx>

        {/* Filtros exclusivos (MISMA LÓGICA Y ESTILO QUE MODELO BASE) */}
        <div className="min-w-0">
          <div className="text-center font-medium text-gray-700 mb-2">
            Filtros exclusivos
          </div>
          <div className="h-10 flex items-center justify-center lg:justify-start gap-4">
            {/* Stock bajo (independiente) */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                name="stock_bajo"
                checked={filters.stock_bajo}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
              />
              <span>Stock bajo</span>
            </label>

            {/* Precios bajos (exclusivo) */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="radio"
                name="precioOrden"
                className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={precioOrden === 'asc'}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    // si ya estaba en "asc", lo apago; si no, lo activo
                    precio_bajo: precioOrden === 'asc' ? false : true,
                    precio_alto: false,
                  }))
                }
              />
              <span>Precios bajos</span>
            </label>

            {/* Precios altos (exclusivo) */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="radio"
                name="precioOrden"
                className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={precioOrden === 'desc'}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    precio_alto: precioOrden === 'desc' ? false : true,
                    precio_bajo: false,
                  }))
                }
              />
              <span>Precios altos</span>
            </label>
          </div>
        </div>

        {/* Buscador + botón */}
        <div className="col-span-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <SearchInputx
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Buscar productos por nombre, código o descripción"
            className="w-full"
            name="search"
          />

          <Buttonx
            label="Limpiar Filtros"
            icon="mynaui:delete"
            variant="outlined"
            onClick={handleReset}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
