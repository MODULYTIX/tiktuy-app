import { useState } from 'react';
import { CiUser } from 'react-icons/ci';
import PerfilesTable from '@/shared/components/ecommerce/perfiles/PerfilesTable';
import PerfilFormModal from '@/shared/components/ecommerce/perfiles/PerfilFormModal';

export default function PerfilesPage() {
  const [modalOpen, setModalOpen] = useState(false);

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
            className="flex gap-2 items-center bg-primaryDark text-white px-3 py-2 rounded-sm">
            <CiUser />
            <span>Nuevo Perfil</span>
          </button>
        </div>
      </div>

      <div>
        <PerfilesTable />
      </div>

      <PerfilFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
