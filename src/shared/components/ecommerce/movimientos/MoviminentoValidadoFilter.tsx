// src/shared/components/ecommerce/movimientos/MovimientoValidadoFilter.tsx

import { Selectx, SelectxDate } from "@/shared/common/Selectx";
import { SearchInputx } from "@/shared/common/SearchInputx";
import Buttonx from "@/shared/common/Buttonx";

export interface MovimientoEcommerceFilters {
    estado: string; // 'Registrado' | 'Proceso' | 'Observado' | 'Validado' | ''
    fecha: string;  // 'YYYY-MM-DD' | ''
    q: string;      // texto libre
}

interface Props {
    value: MovimientoEcommerceFilters;
    onChange: (next: Partial<MovimientoEcommerceFilters>) => void;
    onClear: () => void;
}

export default function MovimientoValidadoFilter({ value, onChange, onClear }: Props) {
    return (
        <div className="px-0 py-0 mb-5">
            <div className="bg-white p-5 rounded shadow-default flex flex-wrap items-end gap-4 border-b-4 border-gray90">

                {/* Estado */}
                <div className="flex-1 min-w-[200px]">
                    <Selectx
                        label="Estado"
                        value={value.estado}
                        onChange={(e) =>
                            onChange({ estado: (e.target as HTMLSelectElement).value })
                        }
                        placeholder="Seleccionar estado"
                    >
                        <option value="">Todos</option>
                        <option value="Proceso">Proceso</option>
                        <option value="Observado">Observado</option>
                        <option value="Validado">Validado</option>
                    </Selectx>
                </div>

                {/* Fecha */}
                <div className="flex-1 min-w-[200px]">
                    <SelectxDate
                        label="Fecha Movimiento"
                        value={value.fecha}
                        onChange={(e) => onChange({ fecha: (e.target as HTMLInputElement).value })}
                    />
                </div>

                {/* Buscador */}
                <div className="flex-[1.4] min-w-[260px]">
                    <SearchInputx
                        placeholder="Buscar por descripción, almacén o producto"
                        value={value.q}
                        onChange={(e) => onChange({ q: e.target.value })}
                    />
                </div>

                {/* Limpiar */}
                <div className="shrink-0">
                    <Buttonx
                        variant="outlined"
                        icon="mynaui:delete"
                        label="Limpiar Filtros"
                        onClick={onClear}
                        className="px-4 text-sm border"
                    />
                </div>

            </div>
        </div>
    );
}
