// src/shared/components/courier/zona-tarifaria/ZonaFilterCourier.tsx
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

type Props = {
  ciudad: string;
  zona: string;
  ciudadesOptions: string[];
  zonasOptions: string[];
  onChange: (next: { ciudad: string; zona: string }) => void;
  onClear: () => void;
};

export default function ZonaFilterCourier({
  ciudad,
  zona,
  ciudadesOptions,
  zonasOptions,
  onChange,
  onClear,
}: Props) {
  return (
    <div
      className="
        relative bg-white p-5 rounded-md shadow-default border border-gray30
        after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0
        after:h-[6px] after:bg-gray90 after:rounded-b-md
      "
    >
      {/* cols = Ciudad | Zona | Botón, con buenas proporciones en desktop */}
      <div className="flex gap-5 items-end flex-wrap">
        {/* Ciudad */}
        <div className="w-[280px] sm:min-w-[140px] md:min-w-[140px]">
          <Selectx
            label="Ciudad"
            placeholder="Seleccionar ciudad"
            value={ciudad}
            onChange={(e) =>
              onChange({
                ciudad: (e.target as HTMLSelectElement).value,
                zona: "", // al cambiar ciudad, limpiamos zona
              })
            }
          >
            {ciudadesOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Selectx>
        </div>

        {/* Zona */}
        <div className="w-[280px] sm:min-w-[140px] md:min-w-[140px]">
          <Selectx
            label="Zona"
            placeholder="Seleccionar zona"
            value={zona}
            disabled={!ciudad}
            onChange={(e) =>
              onChange({
                ciudad,
                zona: (e.target as HTMLSelectElement).value,
              })
            }
          >
            {zonasOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Selectx>
        </div>

        {/* Limpiar filtros */}
        <div className="flex sm:justify-start">
          <Buttonx
            variant="outlined"
            icon="mynaui:delete"
            label="Limpiar Filtros"
            className="px-4 text-sm border"
            onClick={onClear}
          />
        </div>
      </div>
    </div>
  );
}
