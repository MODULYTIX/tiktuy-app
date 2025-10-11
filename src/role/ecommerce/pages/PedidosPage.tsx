import { useEffect, useMemo, useState } from 'react';

import PedidosGenerado from '@/shared/components/ecommerce/pedidos/PedidosGenerado';
import PedidosAsignado from '@/shared/components/ecommerce/pedidos/PedidosAsignado';
import PedidosCompletado from '@/shared/components/ecommerce/pedidos/PedidosCompletado';
import CrearPedidoModal from '@/shared/components/ecommerce/pedidos/CrearPedidoModal';

import { Icon } from '@iconify/react/dist/iconify.js';
import AnimatedExcelMenu from '@/shared/components/ecommerce/AnimatedExcelMenu';
import { useAuth } from '@/auth/context';
import ImportExcelPedidosFlow from '@/shared/components/ecommerce/excel/pedido/ImportExcelPedidosFlow';

// Opciones dinámicas de filtros
import { fetchPedidos } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';

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

  // crear/editar (modal genérico)
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

  // =========================
  // Opciones dinámicas para filtros
  // =========================
  const [pedidosForFilters, setPedidosForFilters] = useState<Pedido[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingFilters(true);
    fetchPedidos(token)
      .then((res) => setPedidosForFilters(res || []))
      .catch(() => setPedidosForFilters([]))
      .finally(() => setLoadingFilters(false));
  }, [token, refreshKey]);

  const courierOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of pedidosForFilters) {
      const id = (p as any).courier_id ?? p.courier?.id;
      const name = p.courier?.nombre_comercial;
      if (id != null && name) map.set(Number(id), name);
    }
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id: String(id), nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [pedidosForFilters]);

  const productoOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of pedidosForFilters) {
      for (const d of p.detalles || []) {
        const prod = d.producto;
        if (prod?.id != null) {
          const nombre = prod.nombre_producto || `Producto ${prod.id}`;
          if (!map.has(prod.id)) map.set(prod.id, nombre);
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id: String(id), nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [pedidosForFilters]);

  // Crear (Generado)
  const handleNuevoPedido = () => {
    setPedidoId(null);
    setModalAbierto(true);
  };
  const handleCerrarModal = () => {
    setModalAbierto(false);
    setPedidoId(null);
  };

  // Refrescar tablas luego de crear/editar/importar
  const refetchPedidos = () => {
    setModalAbierto(false);
    setPedidoId(null);
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
            icon="ri:ai-generate"
            variant={vista === 'generado' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('generado')}
            disabled={false}
          />

          <span className="w-[1px] h-10 bg-gray40" />

          <Buttonx
            label="Asignado"
            icon="solar:bill-list-broken"
            variant={vista === 'asignado' ? 'secondary' : 'tertiary'}
            onClick={() => setVista('asignado')}
            disabled={false}
          />

          <span className="w-[1px] h-10 bg-gray40" />

          <Buttonx
            label="Completado"
            icon="carbon:task-complete"
            variant={vista === 'completado' ? 'secondary' : 'tertiary'}
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
          <p className="text-sm text-black font-regular">
            {descripcionVista[vista]}
          </p>
        </div>

        {/* Botones solo en generado */}
        {vista === 'generado' && (
          <div className="flex gap-2 items-center">
            <div className="h-10 flex items-stretch">
              <ImportExcelPedidosFlow token={token ?? ''} onImported={handleImported}>
                {(openPicker) => (
                  <AnimatedExcelMenu
                    onTemplateClick={handleDescargarPlantilla}
                    onImportClick={openPicker}
                  />
                )}
              </ImportExcelPedidosFlow>
            </div>


            <Buttonx
              label="Nuevo Pedido"
              icon="iconoir:new-tab"
              variant="primary"
              onClick={handleNuevoPedido}
              className='font-light'
            />
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded shadow-default border-b-4 border-gray90 flex items-end gap-4">
        <Selectx
          id="f-courier"
          label="Courier"
          value={filtros.courier}
          onChange={(e) => setFiltros((prev) => ({ ...prev, courier: e.target.value }))}
          placeholder="Seleccionar courier"
          className="w-full"
        >
          <option value="">— Seleccionar courier —</option>
          {loadingFilters ? (
            <option value="" disabled>Cargando…</option>
          ) : (
            courierOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))
          )}
        </Selectx>

        <Selectx
          id="f-producto"
          label="Producto"
          value={filtros.producto}
          onChange={(e) => setFiltros((prev) => ({ ...prev, producto: e.target.value }))}
          placeholder="Seleccionar producto"
          className="w-full"
        >
          <option value="">— Seleccionar producto —</option>
          {loadingFilters ? (
            <option value="" disabled>Cargando…</option>
          ) : (
            productoOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))
          )}
        </Selectx>

        <SelectxDate
          id="f-fecha-inicio"
          label="Fecha Inicio"
          value={filtros.fechaInicio}
          onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
          placeholder="dd/mm/aaaa"
          className="w-full"
        />

        <SelectxDate
          id="f-fecha-fin"
          label="Fecha Fin"
          value={filtros.fechaFin}
          onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
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
      {vista === 'generado' && (
        <PedidosGenerado key={`gen-${refreshKey}`} filtros={filtros} />
      )}

      {vista === 'asignado' && (
        <PedidosAsignado
          key={`asi-${refreshKey}`}
          filtros={filtros}
          onVer={() => { }}
          onEditar={() => { }}
        />
      )}

      {vista === 'completado' && (
        <PedidosCompletado
          key={`comp-${refreshKey}`}
          filtros={filtros}
        />
      )}

      {/* Modal crear/editar genérico */}
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
