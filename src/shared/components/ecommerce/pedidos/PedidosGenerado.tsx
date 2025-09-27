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

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setVerOpen(false);
    setEditarOpen(false);
  }, []);

  const handleUpdated = useCallback(() => {
    // refresca tabla tras editar
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <PedidosTableGenerado
        onVer={handleVer}
        onEditar={handleEditar}
        key={`table-${refreshKey}`}
        filtros={filtros}
      />

      {/* Modal Ver */}
      <VerPedidoModal
        open={verOpen}
        onClose={handleClose}
        pedidoId={selectedId}  // <- pasa number | null
      />

      {/* Modal Editar */}
      <EditarPedidoGeneradoModal
        open={editarOpen}
        onClose={handleClose}
        pedidoId={selectedId}  // <- pasa number | null
        onUpdated={handleUpdated}
      />
    </div>
  );
}
