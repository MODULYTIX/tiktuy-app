import { useEffect, useState, useContext } from 'react';
import { LuClipboardCheck } from 'react-icons/lu';
import { MdOutlineAssignment } from 'react-icons/md';
import { RiAiGenerate } from 'react-icons/ri';
import { FiPlus, FiXCircle } from 'react-icons/fi';

import PedidosGenerado from '@/shared/components/ecommerce/pedidos/PedidosGenerado';
import PedidosAsignado from '@/shared/components/ecommerce/pedidos/PedidosAsignado';
import PedidosCompletado from '@/shared/components/ecommerce/pedidos/PedidosCompletado';
import CrearPedidoModal from '@/shared/components/ecommerce/pedidos/CrearPedidoModal';
import { AuthContext } from '@/auth/context/AuthContext';

type Vista = 'generado' | 'asignado' | 'completado';

export default function PedidosPage() {
  const [vista, setVista] = useState<Vista>(
    () => (localStorage.getItem('ventas_vista') as Vista) || 'generado'
  );
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    localStorage.setItem('ventas_vista', vista);
  }, [vista]);

  const handleNuevoPedido = () => {
    setPedidoId(null); // Modo creación
    setModalAbierto(true);
  };

  const handleEditarPedido = (id: number) => {
    setPedidoId(id); // Modo edición
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setPedidoId(null);
  };

  const refetchPedidos = () => {
    // Aquí va la lógica para recargar la tabla si la manejas por estado o SWR/query
    handleCerrarModal();
  };

  const handleLimpiarFiltros = () => console.log('Limpiar filtros ejecutado');

  return (
    <section className="mt-8 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            Panel de Pedidos
          </h1>
          <p className="text-gray-500">
            Administra y visualiza el estado de tus pedidos en cada etapa del proceso.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setVista('generado')}
            className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium ${
              vista === 'generado'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}>
            <RiAiGenerate size={18} />
            Generado
          </button>

          <span className="w-[1px] h-8 bg-primary" />

          <button
            onClick={() => setVista('asignado')}
            className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium ${
              vista === 'asignado'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}>
            <MdOutlineAssignment size={18} />
            Asignado
          </button>

          <span className="w-[1px] h-8 bg-primary" />

          <button
            onClick={() => setVista('completado')}
            className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium ${
              vista === 'completado'
                ? 'bg-primaryDark text-white'
                : 'bg-gray-100 text-primaryDark hover:bg-gray-200'
            }`}>
            <LuClipboardCheck size={18} />
            Completado
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-primaryDark">
            Pedidos Generados
          </h2>
          <p className="text-sm text-gray-600">
            Consulta los pedidos registrados recientemente.
          </p>
        </div>

        <button
          onClick={handleNuevoPedido}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-600">Courier</label>
          <select className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar courier</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-600">Producto</label>
          <select className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar producto</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">Fecha Inicio</label>
          <input type="date" className="border rounded px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">Fecha Fin</label>
          <input type="date" className="border rounded px-3 py-2 text-sm" />
        </div>
        <button
          onClick={handleLimpiarFiltros}
          className="flex items-center gap-2 border px-3 py-2 rounded text-gray-600 hover:bg-gray-100">
          <FiXCircle className="w-4 h-4" />
          Limpiar Filtros
        </button>
      </div>

      {vista === 'generado' && <PedidosGenerado onEditar={handleEditarPedido} />}
      {vista === 'asignado' && <PedidosAsignado />}
      {vista === 'completado' && <PedidosCompletado />}

      {modalAbierto && token && (
        <CrearPedidoModal
          isOpen={modalAbierto}
          onClose={handleCerrarModal}
          onPedidoCreado={refetchPedidos}
          pedidoId={pedidoId}
          modo={pedidoId ? 'editar' : 'crear'}
          token={token}
        />
      )}
    </section>
  );
}
