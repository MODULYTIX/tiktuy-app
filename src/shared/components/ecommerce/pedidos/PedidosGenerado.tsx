import PedidosTableGenerado from './table/PedidosTableGenerado';

export default function PedidosGenerado() {
    return (
      <div className="bg-white rounded-md overflow-hidden shadow-default">
        <PedidosTableGenerado onEditar={PedidosGenerado} />
      </div>
    );
  }
  