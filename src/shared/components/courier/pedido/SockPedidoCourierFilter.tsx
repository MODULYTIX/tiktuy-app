// shared/components/courier/pedido/SockPedidoCourierFilter.tsx
import { useState, type Dispatch, type SetStateAction } from "react";
import { Selectx } from "@/shared/common/Selectx";
import { SearchInputx } from "@/shared/common/SearchInputx";
import Buttonx from "@/shared/common/Buttonx";

export type StockFilters = {
  almacenId: string;
  sedeId: string;          // antes: almacenId
  categoriaId: string;
  estado: string;
  nombre: string;
  stockBajo: boolean;
  precioOrden: "" | "asc" | "desc";
  q: string;
};

type Option = { value: string; label: string };

type Props = {
  filters?: StockFilters;
  onChange?: Dispatch<SetStateAction<StockFilters>>;
  options?: {
    almacenes: Option[];  
    categorias: Option[];
    estados: Option[];
  };
  loading?: boolean;
};

const DEFAULT_FILTERS: StockFilters = {
  sedeId: "",
  almacenId: "",
  categoriaId: "",
  estado: "",
  nombre: "",
  stockBajo: false,
  precioOrden: "",
  q: "",
};

export default function StockPedidoFilterCourier({
  filters,
  onChange,
  options = { almacenes: [], categorias: [], estados: [] },
  loading = false,
}: Props) {
  // estado interno si el padre no controla
  const [internal, setInternal] = useState<StockFilters>(DEFAULT_FILTERS);

  // fuente de lectura
  const view = filters ?? internal;

  // setter que escribe en el padre si existe; si no, al interno
  const set = (patch: Partial<StockFilters>) => {
    if (onChange) {
      onChange((prev) => ({ ...(prev ?? DEFAULT_FILTERS), ...patch }));
    } else {
      setInternal((prev) => ({ ...prev, ...patch }));
    }
  };

  const handleClear = () =>
    set({
      sedeId: "",
      categoriaId: "",
      estado: "",
      stockBajo: false,
      precioOrden: "",
      q: "",
    });

  return (
    <div className="px-0 py-0 mb-5">
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90">
        {/* Layout responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm items-end">
          {/* Sede */}
          <div className="flex-1 min-w-[200px]">
            <Selectx
              label="Sede"
              name="sedeId"
              value={view.sedeId}
              onChange={(e) => set({ sedeId: e.target.value })}
              placeholder="Seleccionar sede"
              disabled={loading}
            >
              {options.almacenes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Selectx>
          </div>

          {/* Categorías */}
          <div className="flex-1 min-w-[200px]">
            <Selectx
              label="Categorías"
              name="categoriaId"
              value={view.categoriaId}
              onChange={(e) => set({ categoriaId: e.target.value })}
              placeholder="Seleccionar categoría"
              disabled={loading}
            >
              {options.categorias.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Selectx>
          </div>

          {/* Estado */}
          <div className="flex-1 min-w-[200px]">
            <Selectx
              label="Estado"
              name="estado"
              value={view.estado}
              onChange={(e) => set({ estado: e.target.value })}
              placeholder="Seleccionar estado"
              disabled={loading}
            >
              {options.estados.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Selectx>
          </div>

          {/* Filtros exclusivos */}
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-700 mb-2 text-center">
              Filtros exclusivos
            </div>
            <div className="h-10 flex items-center justify-center lg:justify-start gap-4">
              {/* Stock bajo */}
              <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                  checked={view.stockBajo}
                  onChange={(e) => set({ stockBajo: e.target.checked })}
                  disabled={loading}
                />
                <span>Stock bajo</span>
              </label>

              {/* Orden de precio */}
              <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <input
                  type="radio"
                  name="precioOrden"
                  className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                  checked={view.precioOrden === "asc"}
                  onChange={() =>
                    set({ precioOrden: view.precioOrden === "asc" ? "" : "asc" })
                  }
                  disabled={loading}
                />
                <span>Precios bajos</span>
              </label>
              <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <input
                  type="radio"
                  name="precioOrden"
                  className="h-4 w-4 border-gray-400 text-[#1A253D] focus:ring-2 focus:ring-[#1A253D]"
                  checked={view.precioOrden === "desc"}
                  onChange={() =>
                    set({ precioOrden: view.precioOrden === "desc" ? "" : "desc" })
                  }
                  disabled={loading}
                />
                <span>Precios altos</span>
              </label>
            </div>
          </div>

          {/* Buscador + Limpiar */}
          <div className="col-span-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-2">
            <SearchInputx
              placeholder="Buscar productos por nombre, descripción ó código."
              value={view.q}
              onChange={(e) => set({ q: e.target.value })}
            />

            <Buttonx
              variant="outlined"
              onClick={handleClear}
              label="Limpiar Filtros"
              icon="mynaui:delete"
              className="flex items-center gap-3 text-gray-700 bg-gray10 border border-gray60 hover:bg-gray-100 px-4 py-2 rounded sm:w-auto"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
