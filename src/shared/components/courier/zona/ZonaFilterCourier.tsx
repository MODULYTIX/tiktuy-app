// src/shared/components/courier/zona/ZonaFilterCourier.tsx
import { Selectx } from "@/shared/common/Selectx";
import Buttonx from "@/shared/common/Buttonx";

type Props = {
  distrito: string;
  zona: string;
  distritosOptions: string[];
  zonasOptions: string[];
  onChange: (next: { distrito: string; zona: string }) => void;
  onClear: () => void;
};

export default function ZonaFilterCourier({
  distrito,
  zona,
  distritosOptions,
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
      {/* cols = Distrito | Zona | Botón, con buenas proporciones en desktop */}
      <div className="flex gap-5 items-end">
        {/* Distrito */}
        <div className="w-[280px] sm:min-w-[140px] md:min-w-[140px]">
          <Selectx
            label="Distrito"
            placeholder="Seleccionar distrito"
            value={distrito}
            onChange={(e) =>
              onChange({
                distrito: (e.target as HTMLSelectElement).value,
                zona: "", // al cambiar distrito, limpiamos zona
              })
            }
          >
            {distritosOptions.map((d) => (
              <option key={d} value={d}>
                {d}
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
            disabled={!distrito}
            onChange={(e) =>
              onChange({
                distrito,
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
