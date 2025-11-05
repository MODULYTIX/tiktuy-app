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
  onVer: (pedidoId: number) => void;     // (se conserva la firma)
  onEditar: (pedidoId: number) => void;  // (se conserva la firma)
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

  // Abrir Editar desde Ver sin perder el id
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
    // refresca tabla tras editar
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="bg-white rounded-md overflow-hidden shadow-default">
      <PedidosTableAsignado
        key={`asi-table-${refreshKey}`}
        onVer={handleVer}
        onEditar={handleEditar}
        filtros={filtros}
      />

      {/* Modal Ver (Asignado) */}
      <VerPedidoModal
        isOpen={verOpen}
        onClose={handleClose}
        pedidoId={selectedId}
        onEditar={handleEditarDesdeVer} // botón Editar en el footer (derecha)
        />

      {/* Modal Editar (Asignado) */}
      <EditarPedidoAsignadoModal
        isOpen={editarOpen}
        onClose={handleClose}
        pedidoId={selectedId}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
