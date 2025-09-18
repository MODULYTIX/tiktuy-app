import { useState, useCallback } from 'react';
import { CiUser } from 'react-icons/ci';
import PerfilesTable from '@/shared/components/ecommerce/perfiles/PerfilesTable';
import PerfilFormModal from '@/shared/components/ecommerce/perfiles/PerfilFormModal';
import PerfilEditModal from '@/shared/components/ecommerce/perfiles/PerfilEditModal';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';

export default function PerfilesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PerfilTrabajador | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 🔄 dispara recarga de la tabla
  const reloadTable = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Perfiles</h1>
          <p className="text-gray-500">
            Aqui podras registrar los encargados especificos por modulo.
          </p>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setModalOpen(true)}
            className="flex gap-2 items-center bg-primaryDark text-white px-3 py-2 rounded-sm"
          >
            <CiUser />
            <span>Nuevo Perfil</span>
          </button>
        </div>
      </div>

      <div>
        {/* pasamos reloadKey para forzar recarga cuando se actualiza */}
        <PerfilesTable
          key={reloadKey}
          onEdit={(perfil) => {
            setSelected(perfil);
            setEditOpen(true);
          }}
        />
      </div>

      {/* Modal de crear */}
      <PerfilFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reloadTable}
      />

      {/* Modal de editar */}
      <PerfilEditModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        trabajador={selected}
        onUpdated={reloadTable}
      />
    </section>
  );
}
