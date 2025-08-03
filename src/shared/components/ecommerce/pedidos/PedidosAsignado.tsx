import PedidosTableAsignado from './table/PedidosTableAsignado';

export default function PedidosAsignado() {
  return (
    <div className="mt-6 bg-white rounded shadow p-4">
      <h2 className="text-lg font-semibold text-primaryDark">
        Pedidos Asignadas
      </h2>
      <p className="text-sm text-gray-600">
        Los pedidos ya fueron asignados a un repartidor.
      </p>
      <PedidosTableAsignado />
    </div>
  );
}
