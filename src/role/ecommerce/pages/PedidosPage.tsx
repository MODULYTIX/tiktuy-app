import { useEffect, useState } from 'react';
import { LuClipboardCheck } from 'react-icons/lu';
import { MdOutlineAssignment } from 'react-icons/md';
import { RiAiGenerate } from 'react-icons/ri';
import { FiPlus } from 'react-icons/fi';

import PedidosGenerado from '@/shared/components/ecommerce/pedidos/PedidosGenerado';
import PedidosAsignado from '@/shared/components/ecommerce/pedidos/PedidosAsignado';
import PedidosCompletado from '@/shared/components/ecommerce/pedidos/PedidosCompletado';
import CrearPedidoModal from '@/shared/components/ecommerce/pedidos/CrearPedidoModal';

import { Icon } from '@iconify/react/dist/iconify.js';
import { Select } from '@/shared/components/Select';
import AnimatedExcelMenu from '@/shared/components/ecommerce/AnimatedExcelMenu';
import { useAuth } from '@/auth/context';
import ImportExcelPedidosFlow from '@/shared/components/ecommerce/excel/pedido/ImportExcelPedidosFlow';

// Modales para ASIGNADO (ya los tienes)
import EditarPedidoAsignadoModal from '@/shared/components/ecommerce/pedidos/Asignado/EditarPedidoAsignadoModal';
import VerPedidoModal from '@/shared/components/ecommerce/pedidos/Asignado/VerPedidoAsignadoModal';
import { Selectx, SelectxDate } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';

type Vista = 'generado' | 'asignado' | 'completado';

type Filtros = {
  courier: string;
  producto: string;
  fechaInicio: string;
  fechaFin: string;
};

export default function PedidosPage() {
  const { token } = useAuth();

  const [vista, setVista] = useState<Vista>(
    () => (localStorage.getItem('pedidos_vista') as Vista) || 'generado'
  );

  // crear/editar genérico (tu modal actual)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

  // modales ASIGNADO (ya estaban)
  const [verAsignadoOpen, setVerAsignadoOpen] = useState(false);
  const [editarAsignadoOpen, setEditarAsignadoOpen] = useState(false);
  const [pedidoAsignadoId, setPedidoAsignadoId] = useState<number | null>(null);

  // NUEVO: modal para VER en COMPLETADO (solo lectura)
  const [verCompletadoOpen, setVerCompletadoOpen] = useState(false);
  const [pedidoCompletadoId, setPedidoCompletadoId] = useState<number | null>(null);

  const [filtros, setFiltros] = useState<Filtros>({
    courier: '',
    producto: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const handleImported = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    localStorage.setItem('pedidos_vista', vista);
  }, [vista]);

  // Crear (Generado)
  const handleNuevoPedido = () => {
    setPedidoId(null);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setPedidoId(null);
  };

  // ASIGNADO: Ver / Editar
  const handleVerAsignado = (id: number) => {
    setPedidoAsignadoId(id);
    setVerAsignadoOpen(true);
  };
  const handleEditarAsignado = (id: number) => {
    setPedidoAsignadoId(id);
    setEditarAsignadoOpen(true);
  };

  // COMPLETADO: Ver (solo lectura)
  const handleVerCompletado = (id: number) => {
    setPedidoCompletadoId(id);
    setVerCompletadoOpen(true);
  };

  const refetchPedidos = () => {
    // cierra cualquier modal y refresca
    setModalAbierto(false);
    setVerAsignadoOpen(false);
    setEditarAsignadoOpen(false);
    setVerCompletadoOpen(false);
    setPedidoId(null);
    setPedidoAsignadoId(null);
    setPedidoCompletadoId(null);
    setRefreshKey((k) => k + 1);
  };


  const handleDescargarPlantilla = () => {
    const a = document.createElement('a');
    a.href = '../../../assets/template/template_ventas.xlsx';
    a.download = 'plantilla-ventas.xlsx';
    a.click();
  };

  const descripcionVista = {
    generado: 'Consulta los pedidos registrados recientemente.',
    asignado: 'Los pedidos ya fueron asignados a un repartidor.',
    completado: 'Pedidos en su estado final.',
  } as const;

  return (
    <section className="mt-8 flex flex-col gap-[1.25rem]">
      {/* Tabs */}
      <div className="flex justify-between items-end pb-5 border-b border-gray30">
        <Tittlex
          title="Panel de Pedidos"
          description="Administra y visualiza el estado de tus pedidos en cada etapa del proceso"
        />

        <div className="flex gap-3 items-center">
          <Buttonx
            label="Generado"
            icon="ri:ai-generate" // Icono correspondiente
            variant={vista === 'generado' ? 'secondary' : 'tertiary'} // Usamos "secondary" cuando está activo
            onClick={() => setVista('generado')}
            disabled={false}
          />

          <span className="w-[1px] h-10 bg-gray40" />

          <Buttonx
            label="Asignado"
            icon="solar:bill-list-broken" // Icono correspondiente
            variant={vista === 'asignado' ? 'secondary' : 'tertiary'} // Usamos "secondary" cuando está activo
            onClick={() => setVista('asignado')}
            disabled={false}
          />

          <span className="w-[1px] h-10 bg-gray40" />

          <Buttonx
            label="Completado"
            icon="carbon:task-complete" // Icono correspondiente
            variant={vista === 'completado' ? 'secondary' : 'tertiary'} // Usamos "secondary" cuando está activo
            onClick={() => setVista('completado')}
            disabled={false}
          />
        </div>
      </div>

      {/* Título y descripción */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-primaryDark">
            {vista === 'generado'
              ? 'Pedidos Generados'
              : vista === 'asignado'
                ? 'Pedidos Asignados'
                : 'Pedidos Completados'}
          </h2>
          <p className="text-sm text-black font-regular">{descripcionVista[vista]}</p>
        </div>

        {/* Botones solo en generado */}
        {vista === 'generado' && (
          <div className="flex gap-2 items-center">
            <div className="h-10 flex items-stretch">
              <ImportExcelPedidosFlow token={token ?? ''} onImported={handleImported}>
                {(openPicker) => (
                  <AnimatedExcelMenu onTemplateClick={handleDescargarPlantilla} onImportClick={openPicker} />
                )}
              </ImportExcelPedidosFlow>
            </div>

            <button
              onClick={handleNuevoPedido}
              className="h-10 px-3 rounded-sm text-sm bg-primaryLight text-white flex items-center gap-2 hover:bg-blue-700"
            >
              <FiPlus className="w-4 h-4" />
              <span>Nuevo Pedido</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
        <Selectx
          id="f-courier"
          label="Courier"
          value={filtros.courier}
          onChange={(e) =>
            setFiltros((prev) => ({ ...prev, courier: e.target.value }))
          }
          placeholder="Seleccionar courier"
          className="w-full"
        >
          <option value="1">Courier 1</option>
          <option value="2">Courier 2</option>
        </Selectx>

        <Selectx
          id="f-producto"
          label="Producto"
          value={filtros.producto}
          onChange={(e) =>
            setFiltros((prev) => ({ ...prev, producto: e.target.value }))
          }
          placeholder="Seleccionar producto"
          className="w-full"
        >
          <option value="p1">Producto 1</option>
          <option value="p2">Producto 2</option>
        </Selectx>

        <SelectxDate
          id="f-fecha-inicio"
          label="Fecha Inicio"
          value={filtros.fechaInicio}
          onChange={(e) =>
            setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))
          }
          placeholder="dd/mm/aaaa"
          className="w-full"
        />

        <SelectxDate
          id="f-fecha-fin"
          label="Fecha Fin"
          value={filtros.fechaFin}
          onChange={(e) =>
            setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))
          }
          placeholder="dd/mm/aaaa"
          className="w-full"
        />

        <button
          onClick={() => {
            setFiltros({ courier: '', producto: '', fechaInicio: '', fechaFin: '' });
            setRefreshKey((k) => k + 1);
          }}
          className="w-155 h-10 flex items-center gap-2 bg-gray10 border border-gray60 px-3 py-2 rounded text-gray60 text-sm hover:bg-gray-100"
        >
          <Icon icon="mynaui:delete" width="24" height="24" />
          Limpiar Filtros
        </button>
      </div>

      {/* Vistas */}
      {vista === 'generado' && <PedidosGenerado key={`gen-${refreshKey}`} />}

      {vista === 'asignado' && (
        <PedidosAsignado
          key={`asi-${refreshKey}`}
          onVer={handleVerAsignado}
          onEditar={handleEditarAsignado}
        />
      )}

      {vista === 'completado' && (
        <PedidosCompletado
          key={`comp-${refreshKey}`}
          onVer={handleVerCompletado}  // <-- usa modal de VER, no el de crear/editar
        />
      )}

      {/* Modal crear/editar genérico (tu modal existente) */}
      {modalAbierto && (
        <CrearPedidoModal
          isOpen={modalAbierto}
          onClose={handleCerrarModal}
          onPedidoCreado={refetchPedidos}
          pedidoId={pedidoId ?? undefined}
          modo={pedidoId ? 'editar' : 'crear'}
        />
      )}

      {/* Modales de ASIGNADO */}
      {verAsignadoOpen && (
        <VerPedidoModal
          isOpen={verAsignadoOpen}
          onClose={() => setVerAsignadoOpen(false)}
          pedidoId={pedidoAsignadoId}
        />
      )}

      {editarAsignadoOpen && (
        <EditarPedidoAsignadoModal
          isOpen={editarAsignadoOpen}
          onClose={() => setEditarAsignadoOpen(false)}
          pedidoId={pedidoAsignadoId}
          onUpdated={refetchPedidos}
        />
      )}

      {/* Modal de VER para COMPLETADO (reusa VerPedidoModal) */}
      {verCompletadoOpen && (
        <VerPedidoModal
          isOpen={verCompletadoOpen}
          onClose={() => setVerCompletadoOpen(false)}
          pedidoId={pedidoCompletadoId}
        />
      )}
    </section>
  );
}
