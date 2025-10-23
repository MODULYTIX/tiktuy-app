import { Selectx } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';

export type Filtros = {
  ciudad: string;
  courier: string;
  estado: string;
};

type Props = {
  filtros: Filtros;
  ciudades: string[];
  couriersUnicos: string[];
  estados: string[];
  handleChangeFiltro: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  limpiarFiltros: () => void;
  className?: string;
};

export default function FilterPanelAdmin({
  filtros,
  ciudades,
  couriersUnicos,
  estados,
  handleChangeFiltro,
  limpiarFiltros,
  className,
}: Props) {
  return (
    <div
      className={[
        'bg-white p-5 rounded shadow-default',
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]',
        'gap-4 items-end border-b-4 border-gray90',
        className || '',
      ].join(' ')}
    >
      {/* Ciudad */}
      <Selectx
        id="f-ciudad"
        name="ciudad"
        label="Ciudad"
        value={filtros.ciudad}
        onChange={handleChangeFiltro}
        placeholder="Seleccionar Ciudad"
        className="w-full"
      >
        <option value="">Todas</option>
        {ciudades.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Selectx>

      {/* Courier */}
      <Selectx
        id="f-courier"
        name="courier"
        label="Courier"
        value={filtros.courier}
        onChange={handleChangeFiltro}
        placeholder="Seleccionar Courier"
        className="w-full"
      >
        <option value="">Todos</option>
        {couriersUnicos.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Selectx>

      {/* Estado */}
      <Selectx
        id="f-estado"
        name="estado"
        label="Estado"
        value={filtros.estado}
        onChange={handleChangeFiltro}
        placeholder="Seleccionar Estado"
        className="w-full"
      >
        <option value="">Todos</option>
        {estados.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </Selectx>

      {/* Limpiar */}
      <Buttonx
        onClick={limpiarFiltros}
        icon="mynaui:delete"
        label="Limpiar Filtros"
        variant="outlined"
      />
    </div>
  );
}
