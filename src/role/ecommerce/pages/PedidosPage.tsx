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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

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

  const handleNuevoPedido = () => {
    setPedidoId(null);
    setModalAbierto(true);
  };
  const handleEditar = (id: number) => {
    setPedidoId(id);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setPedidoId(null);
  };
  const handleVer = (id: number) => {
    setPedidoId(id);
    setModalAbierto(true);
  };

  const refetchPedidos = () => {
    handleCerrarModal();
    setRefreshKey((k) => k + 1);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      courier: '',
      producto: '',
      fechaInicio: '',
      fechaFin: '',
    });
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
        <div className="flex flex-col gap-1">
          <h1 className="text-[1.75rem] font-bold text-primary">
            Panel de Pedidos
          </h1>
          <p className="text-gray60">
            Administra y visualiza el estado de tus pedidos en cada etapa del proceso.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setVista('generado')}
            className={`flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium ${vista === 'generado'
                ? 'bg-primaryDark text-white'
                : 'bg-gray20 text-primaryDark hover:shadow-default'
              }`}>
            <RiAiGenerate size={18} />
            Generado
          </button>

          <span className="w-[1px] h-10 bg-gray40" />

          <button
            onClick={() => setVista('asignado')}
            className={`flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium ${vista === 'asignado'
                ? 'bg-primaryDark text-white'
                : 'bg-gray20 text-primaryDark hover:shadow-default'
              }`}>
            <MdOutlineAssignment size={18} />
            Asignado
          </button>

          <span className="w-[1px] h-10 bg-gray40" />

          <button
            onClick={() => setVista('completado')}
            className={`flex items-center gap-2 px-3 py-[0.625rem] rounded-sm text-sm font-medium ${vista === 'completado'
                ? 'bg-primaryDark text-white'
                : 'bg-gray20 text-primaryDark hover:shadow-default'
              }`}>
            <LuClipboardCheck size={18} />
            Completado
          </button>
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
          <p className="text-sm text-black font-regular">
            {descripcionVista[vista]}
          </p>
        </div>

        {/* Botones solo en generado */}
        {vista === 'generado' && (
          <div className="flex gap-2">
            <ImportExcelPedidosFlow
              token={token ?? ''}
              onImported={handleImported}>
              {(openPicker) => (
                <AnimatedExcelMenu
                  onTemplateClick={handleDescargarPlantilla}
                  onImportClick={openPicker}
                />
              )}
            </ImportExcelPedidosFlow>

            <button
              onClick={handleNuevoPedido}
              className="bg-primaryLight text-white px-[0.75rem] py-[0.5625rem] rounded flex items-center gap-2 hover:bg-blue-700">
              <FiPlus className="w-4 h-4" />
              Nuevo Pedido
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default flex flex-wrap gap-4 items-end border-b-4 border-gray90">
        {/* Courier */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label className="text-sm font-medium text-black block">
            Courier
          </label>
          <div className="relative w-full">
            <Select
              value={filtros.courier}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, courier: e.target.value }))
              }
              options={[
                { value: '', label: 'Todos' },
                { value: '1', label: 'Courier 1' },
                { value: '2', label: 'Courier 2' },
              ]}
              placeholder="Seleccionar courier"
            />
          </div>
        </div>

        {/* Producto */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label className="text-sm font-medium text-black block">
            Producto
          </label>
          <div className="relative w-full">
            <Select
              value={filtros.producto}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, producto: e.target.value }))
              }
              options={[
                { value: '', label: 'Todos' },
                { value: 'p1', label: 'Producto 1' },
                { value: 'p2', label: 'Producto 2' },
              ]}
              placeholder="Seleccionar producto"
            />
          </div>
        </div>

        {/* Fecha Inicio */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label className="text-sm font-medium text-black block">
            Fecha Inicio
          </label>
          <input
            type="date"
            className="border border-gray40 rounded px-3 py-2 text-sm w-full text-gray60"
            value={filtros.fechaInicio}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))
            }
          />
        </div>

        {/* Fecha Fin */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
          <label className="text-sm font-medium text-black block">
            Fecha Fin
          </label>
          <input
            type="date"
            className="border border-gray40 rounded px-3 py-2 text-sm w-full text-gray60"
            value={filtros.fechaFin}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))
            }
          />
        </div>

        <button
          onClick={handleLimpiarFiltros}
          className="flex items-center gap-2 bg-gray10 border border-gray60 px-3 py-2 rounded text-gray60 text-sm hover:bg-gray-100">
          <Icon icon="mynaui:delete" width="24" height="24" color="gray60" />
          Limpiar Filtros
        </button>
      </div>

      {/* Vistas */}
      {vista === 'generado' && <PedidosGenerado key={`gen-${refreshKey}`} />}
      {vista === 'asignado' && (
        <PedidosAsignado key={`asi-${refreshKey}`} onEditar={handleEditar} />
      )}
      {vista === 'completado' && (
        <PedidosCompletado key={`comp-${refreshKey}`} onVer={handleVer} />
      )}

      {/* Modal */}
      {modalAbierto && (
        <CrearPedidoModal
          isOpen={modalAbierto}
          onClose={handleCerrarModal}
          onPedidoCreado={refetchPedidos}
          pedidoId={pedidoId ?? undefined}
          modo={pedidoId ? 'editar' : 'crear'}
        />
      )}
    </section>
  );
}
