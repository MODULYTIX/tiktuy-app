import { useState, useCallback } from 'react';
import PedidosTableAsignado from './table/PedidosTableAsignado';
import VerPedidoModal from './Asignado/VerPedidoAsignadoModal';
import EditarPedidoAsignadoModal from './Asignado/EditarPedidoAsignadoModal';

type Filtros = {
  courier: string;
  producto: string;
  fechaInicio: string;
  fechaFin: string;
};

interface Props {
  filtros: Filtros;
  onVer: (pedidoId: number) => void;
  onEditar: (pedidoId: number) => void;
}

export default function PedidosAsignado({ filtros }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [verOpen, setVerOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVer = useCallback((id: number) => {
    setSelectedId(id);
    setVerOpen(true);
  }, []);

  const handleEditar = useCallback((id: number) => {
    setSelectedId(id);
    setEditarOpen(true);
  }, []);

  const handleEditarDesdeVer = useCallback((id: number) => {
    setSelectedId(id);
    setVerOpen(false);
    setEditarOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setVerOpen(false);
    setEditarOpen(false);
  }, []);

  const handleUpdated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">

      <PedidosTableAsignado
        key={`asi-table-${refreshKey}`}
        filtros={filtros}
        onVer={handleVer}
        onEditar={handleEditar}
        refreshKey={refreshKey}
      />

      <VerPedidoModal
        isOpen={verOpen}
        onClose={handleClose}
        pedidoId={selectedId}
        onEditar={handleEditarDesdeVer}
      />

      <EditarPedidoAsignadoModal
        isOpen={editarOpen}
        onClose={handleClose}
        pedidoId={selectedId}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
