// src/shared/components/ecommerce/pedidos/PedidosCompletado.tsx
import PedidosTableCompletado from './table/PedidosTableCompletado';

interface PedidosCompletadoProps {
  onVer: (pedidoId: number) => void;
}

export default function PedidosCompletado({ onVer }: PedidosCompletadoProps) {
  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <PedidosTableCompletado onVer={onVer} />
    </div>
  );
}
