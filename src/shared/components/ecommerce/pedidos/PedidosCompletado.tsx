import PedidosTableCompletado from './table/PedidosTableCompletado';

export default function PedidosCompletado() {
    return (
      <div className="mt-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold text-primaryDark">Pedidos Completados</h2>
        <p className="text-sm text-gray-600">Pedidos en su estado final.</p>

        <PedidosTableCompletado />
      </div>
    );
  }
  