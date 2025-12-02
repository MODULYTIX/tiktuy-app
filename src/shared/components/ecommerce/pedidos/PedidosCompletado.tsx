import { useState, useCallback } from 'react';
import PedidosTableCompletado from './table/PedidosTableCompletado';
import VerPedidoCompletadoModal from './Completado/VerPedidoModal';

type Filtros = {
  courier: string;
  producto: string;
  fechaInicio: string;
  fechaFin: string;
};

interface PedidosCompletadoProps {
  filtros: Filtros;
}

export default function PedidosCompletado({ filtros }: PedidosCompletadoProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [verOpen, setVerOpen] = useState(false);

  const handleVer = useCallback((id: number) => {
    setSelectedId(id);
    setVerOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setVerOpen(false);
  }, []);

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <PedidosTableCompletado
        filtros={filtros}
        onVer={handleVer}
      />

      <VerPedidoCompletadoModal
        isOpen={verOpen}
        onClose={handleClose}
        pedidoId={selectedId}
      />
    </div>
  );
}
