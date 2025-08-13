import PedidosTableAsignado from './table/PedidosTableAsignado';

interface PedidosAsignadoProps {
  onEditar: (pedidoId: number) => void;
}

export default function PedidosAsignado({ onEditar }: PedidosAsignadoProps) {
  return (
    <div className="mt-6 bg-white rounded shadow p-4">
      <h2 className="text-lg font-semibold text-primaryDark">
        Pedidos Asignados
      </h2>
      <p className="text-sm text-gray-600">
        Los pedidos ya fueron asignados a un repartidor.
      </p>
      <PedidosTableAsignado onEditar={onEditar} />
    </div>
  );
}
