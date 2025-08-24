// src/app/(courier)/perfiles/page.tsx
import { useEffect, useState } from 'react';
import { CiUser } from 'react-icons/ci';
import { useAuth } from '@/auth/context';
import { fetchPerfilTrabajadores } from '@/services/ecommerce/perfiles/perfilesTrabajador.api';
import type { PerfilTrabajador } from '@/services/ecommerce/perfiles/perfilesTrabajador.types';
import PerfilesCourierTable from '@/shared/components/courier/perfiles/PerfilesCourierTable';
import PerfilesCourierModal from '@/shared/components/courier/perfiles/PerfilerCourierModal';

export default function PerfilesPage() {
  const { token } = useAuth();
  const [data, setData] = useState<PerfilTrabajador[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const loadPerfiles = async () => {
    if (!token) return;
    try {
      const res = await fetchPerfilTrabajadores(token);
      setData(res || []);
    } catch (e) {
      console.error('Error al cargar perfiles courier', e);
    }
  };

  useEffect(() => {
    loadPerfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Perfiles</h1>
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

      <PerfilesCourierTable data={data} onReload={loadPerfiles} />

      <PerfilesCourierModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadPerfiles}
      />
    </section>
  );
}
