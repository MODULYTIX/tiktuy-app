import { useState, useCallback } from 'react';
import PedidosTableGenerado from './table/PedidosTableGenerado';
import VerPedidoModal from './Generado/VerPedidoModal';
import EditarPedidoGeneradoModal from './Generado/EditarPedidoGeneradoModal';

type Filtros = {
  courier: string;
  producto: string;
  fechaInicio: string;
  fechaFin: string;
};

export default function PedidosGenerado({ filtros }: { filtros: Filtros }) {
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
      <PedidosTableGenerado
        key={`table-${refreshKey}`}
        filtros={filtros}
        onVer={handleVer}
        onEditar={handleEditar}
        refreshKey={refreshKey}  
      />

      <VerPedidoModal
        open={verOpen}
        onClose={handleClose}
        pedidoId={selectedId}
        onEditar={handleEditarDesdeVer}
      />

      <EditarPedidoGeneradoModal
        open={editarOpen}
        onClose={handleClose}
        pedidoId={selectedId}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
