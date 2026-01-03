import { useState, type Dispatch, type SetStateAction } from "react";
import { Selectx } from "@/shared/common/Selectx";
import { SearchInputx } from "@/shared/common/SearchInputx";
import Buttonx from "@/shared/common/Buttonx";

/* ======================================================
   TIPOS LIMPIOS (solo lo que se usa)
====================================================== */
export type StockFilters = {
  ecommerceOrigenId: string;
  categoriaId: string;
  estado: string;
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
  ecommerceOrigenId: "",
  categoriaId: "",
  estado: "",
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

  // setter unificado
  const set = (patch: Partial<StockFilters>) => {
    if (onChange) {
      onChange((prev) => ({ ...(prev ?? DEFAULT_FILTERS), ...patch }));
    } else {
      setInternal((prev) => ({ ...prev, ...patch }));
    }
  };

  const handleClear = () =>
    set({
      ecommerceOrigenId: "",
      categoriaId: "",
      estado: "",
      stockBajo: false,
      precioOrden: "",
      q: "",
    });

  return (
    <div className="mb-5">
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 text-sm items-end">
          {/* =======================
              SEDE (Courier)
          ======================= */}
          <Selectx
            label="Ecommerce"
            name="ecommerceOrigenId"
            value={view.ecommerceOrigenId}
            onChange={(e) => {
              set({ ecommerceOrigenId: e.target.value });
            }}
            placeholder="Seleccionar ecommerce"
            disabled={loading || options.almacenes.length === 0}
          >
            {options.almacenes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Selectx>

          {/* =======================
              CATEGORÍA
          ======================= */}
          <Selectx
            label="Categoría"
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

          {/* =======================
              ESTADO
          ======================= */}
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

          {/* =======================
    FILTROS EXCLUSIVOS
======================= */}
          <div className="min-w-0">
            <div className="text-center font-medium text-gray-700 mb-2">
              Filtros exclusivos
            </div>

            <div className="h-10 flex items-center justify-center lg:justify-start gap-4">
              {/* Stock bajo */}
              <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={view.stockBajo}
                  onChange={(e) => set({ stockBajo: e.target.checked })}
                  disabled={loading}
                  className="h-4 w-4 rounded-[3px] border border-gray-400 text-[#1A253D]"
                />
                <span>Stock bajo</span>
              </label>

              {/* Precio */}
              <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <input
                  type="radio"
                  name="precioOrden"
                  checked={view.precioOrden === "desc"}
                  onChange={() =>
                    set({
                      precioOrden: view.precioOrden === "desc" ? "" : "desc",
                    })
                  }
                  className="h-4 w-4"
                  disabled={loading}
                />
                <span>Precios bajos</span>
              </label>

              <label className="inline-flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <input
                  type="radio"
                  name="precioOrden"
                  checked={view.precioOrden === "asc"}
                  onChange={() =>
                    set({
                      precioOrden: view.precioOrden === "asc" ? "" : "asc",
                    })
                  }
                  className="h-4 w-4"
                  disabled={loading}
                />
                <span>Precios altos</span>
              </label>
            </div>
          </div>

          {/* =======================
              BUSCADOR + LIMPIAR
          ======================= */}
          <div className="col-span-full flex flex-col sm:flex-row gap-3 mt-2">
            <SearchInputx
              placeholder="Buscar por nombre, descripción o código"
              value={view.q}
              onChange={(e) => set({ q: e.target.value })}
            />

            <Buttonx
              variant="outlined"
              onClick={handleClear}
              label="Limpiar"
              icon="mynaui:delete"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
