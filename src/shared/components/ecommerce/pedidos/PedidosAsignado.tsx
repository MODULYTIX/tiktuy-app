import PedidosTableAsignado from './table/PedidosTableAsignado';

interface PedidosAsignadoProps {
  onEditar: (pedidoId: number) => void;
}

export default function PedidosAsignado({ onEditar }: PedidosAsignadoProps) {
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <PedidosTableAsignado onEditar={onEditar} />
    </div>
  );
}
