import { useState } from 'react';
import AlmacenCourierTable from '@/shared/components/courier/almacen/almacencourierTable';
import { Icon } from '@iconify/react';
import AlmacenFormModal from '@/shared/components/courier/almacen/AlmacenCourierFormModal';

export interface Almacen {
  id?: number;
  nombre: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  fecha?: string;
}

export default function AlmacenPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState<'ver' | 'editar' | 'registrar'>('registrar');
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<Almacen | null>(null);

  const handleNuevoAlmacen = () => {
    setModo('registrar');
    setAlmacenSeleccionado(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSave = (almacen: Almacen) => {
    // Aquí podrías hacer la petición POST/PUT al backend
    console.log('Guardando almacén:', almacen);
  };

  return (
    <section className="mt-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Almacén</h1>
            <p className="text-gray-500">Visualice su almacén y sus movimientos</p>
          </div>
          <div>
            <button
              className="flex items-center p-2 bg-primaryDark text-white rounded-sm gap-2"
              onClick={handleNuevoAlmacen}
            >
              <Icon icon="solar:garage-linear" width="22" height="22" />
              <span>Nuevo Almacén</span>
            </button>
          </div>
        </div>

        <div className="mt-8">
          <AlmacenCourierTable
            onVer={(almacen) => {
              setModo('ver');
              setAlmacenSeleccionado(almacen);
              setModalOpen(true);
            }}
            onEditar={(almacen) => {
              setModo('editar');
              setAlmacenSeleccionado(almacen);
              setModalOpen(true);
            }}
          />
        </div>
      </div>

      <AlmacenFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        modo={modo}
        almacen={almacenSeleccionado}
        onSave={handleSave}
      />
    </section>
  );
}
