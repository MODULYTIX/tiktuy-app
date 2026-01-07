import { useEffect, useState } from "react";
import { fetchCategorias } from "@/services/ecommerce/categoria/categoria.api";
import { fetchAlmacenesEcommerCourier } from "@/services/ecommerce/almacenamiento/almacenamiento.api";
import { useAuth } from "@/auth/context";
import type { Categoria } from "@/services/ecommerce/categoria/categoria.types";
import type { Almacenamiento } from "@/services/ecommerce/almacenamiento/almacenamiento.types";
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";
import { SearchInputx } from "@/shared/common/SearchInputx";

export interface Filters {
  almacenamiento_id: string;
  categoria_id: string;
  estado: string;
  nombre: string;
  stock_bajo: boolean;

  precio_bajo: boolean;
  precio_alto: boolean;

  search: string;
}

interface Props {
  onFilterChange?: (filters: Filters) => void;
  onNuevoMovimientoClick?: () => void; // opcional desde fuera
}

export default function MovimientoRegistroFilters({
  onFilterChange,
  onNuevoMovimientoClick,
}: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [filters, setFilters] = useState<Filters>({
    almacenamiento_id: "",
    categoria_id: "",
    estado: "",
    stock_bajo: false,
    nombre: "",
    precio_bajo: false,
    precio_alto: false,
    search: "",
  });

  useEffect(() => {
    if (!token) return;

    fetchCategorias(token).then(setCategorias).catch(console.error);

    fetchAlmacenesEcommerCourier(token)
      .then((resp) => {
        const all = [
          ...(resp.ecommerce ?? []),
          ...(resp.courier ?? []),
        ];
        setAlmacenes(all);
      })
      .catch(console.error);
  }, [token]);


  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, type, value } = e.target;
    if (type === "checkbox") {
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ comportamiento tipo tu modelo base: radio toggleable (si ya está marcado, lo desmarca)
  const togglePrecioOrden = (which: "precio_bajo" | "precio_alto") => {
    setFilters((prev) => {
      const isOn = prev[which];

      // si ya estaba activo => apágalo (queda ninguno)
      if (isOn) {
        return { ...prev, precio_bajo: false, precio_alto: false };
      }

      // si no => activa uno y apaga el otro
      return {
        ...prev,
        precio_bajo: which === "precio_bajo",
        precio_alto: which === "precio_alto",
      };
    });
  };

  const handleReset = () => {
    setFilters({
      almacenamiento_id: "",
      categoria_id: "",
      estado: "",
      nombre: "",
      stock_bajo: false,
      precio_bajo: false,
      precio_alto: false,
      search: "",
    });
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-default border-b-4 border-gray90">
      {/* xs: 1 col, sm: 2 cols, lg: 1fr 1fr 1fr auto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm items-end">
        {/* Almacén */}
        <Selectx
          label="Almacén"
          value={filters.almacenamiento_id}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilters((prev) => ({
              ...prev,
              almacenamiento_id: e.target.value,
            }))
          }
          placeholder="Seleccione almacén"
          className="w-full"
        >
          {almacenes.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.nombre_almacen}
              {a.courier_id ? " [COURIER]" : " [ECOM]"}
            </option>
          ))}

        </Selectx>

        {/* Categorías */}
        <Selectx
          label="Categorías"
          value={filters.categoria_id}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilters((prev) => ({ ...prev, categoria_id: e.target.value }))
          }
          placeholder="Seleccione categoría"
          className="w-full"
        >
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </Selectx>

        {/* Estado */}
        <Selectx
          label="Estado"
          value={filters.estado}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilters((prev) => ({ ...prev, estado: e.target.value }))
          }
          placeholder="Seleccione estado"
          className="w-full"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </Selectx>

        {/* Filtros exclusivos */}
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-700 mb-2 text-center">
            Filtros exclusivos
          </div>

          <div className="h-10 flex items-center justify-center lg:justify-start gap-4">
            {/* ✅ Stock bajo (checkbox) */}
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

            {/* ✅ Precios bajos (radio) */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="radio"
                name="precioOrden" // mismo name => solo 1
                className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={filters.precio_bajo}
                onChange={() => togglePrecioOrden("precio_bajo")}
              />
              <span>Precios bajos</span>
            </label>

            {/* ✅ Precios altos (radio) */}
            <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <input
                type="radio"
                name="precioOrden" // mismo name => solo 1
                className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                checked={filters.precio_alto}
                onChange={() => togglePrecioOrden("precio_alto")}
              />
              <span>Precios altos</span>
            </label>
          </div>
        </div>

        {/* Buscador + acciones */}
        <div className="col-span-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-2">
          {/* Buscador */}
          <SearchInputx
            value={filters.search}
            onChange={handleChange}
            placeholder="Buscar productos por nombre, descripción ó código."
            className="w-full pl-10"
            name="search"
          />

          {/* Acciones a la derecha */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <Buttonx
              label="Limpiar Filtros"
              icon="mynaui:delete"
              variant="outlined"
              onClick={handleReset}
              disabled={false}
            />

            {/* Línea divisoria */}
            <div className="hidden sm:block h-10 w-px bg-gray30" />

            {/* Botón azul para "Nuevo Movimiento" */}
            <Buttonx
              label="Nuevo Movimiento"
              icon="material-symbols:tab-new-right-outline-rounded"
              variant="secondary"
              onClick={() => onNuevoMovimientoClick?.()}
              disabled={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
