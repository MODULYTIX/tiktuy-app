import PedidosTableAsignado from './table/PedidosTableAsignado';

interface Props {
  onVer: (pedidoId: number) => void;
  onEditar: (pedidoId: number) => void;
}

export default function PedidosAsignado({ onVer, onEditar }: Props) {
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <PedidosTableAsignado onVer={onVer} onEditar={onEditar} />
    </div>
  );
}
