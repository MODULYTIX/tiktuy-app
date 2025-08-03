import { PiGarageLight } from 'react-icons/pi';
import { useState, useEffect } from 'react';
import Paginator from '@/shared/components/Paginator';
import { useAuth } from '@/auth/context/useAuth';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import CrearAlmacenModal from '@/shared/components/ecommerce/CrearAlmacenModal';
import { FaEdit } from 'react-icons/fa';

export default function AlmacenPage() {
  const { token } = useAuth();
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [almacenEditando, setAlmacenEditando] = useState<Almacenamiento | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const porPagina = 4;
  const totalPaginas = Math.ceil(almacenes.length / porPagina);
  const dataPaginada = almacenes.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );

  const loadData = async () => {
    if (!token) {
      console.warn('Token no disponible. No se puede cargar almacenes.');
      return;
    }

    try {
      setLoading(true);
      const data = await fetchAlmacenes(token);
      setAlmacenes(data);
    } catch (err) {
      console.error('Error al cargar almacenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const headers = [
    'Nom. Almacén',
    'Departamento',
    'Ciudad',
    'Dirección',
    'F. Creación',
    'Acciones',
  ];

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-primary">Almacén</h1>
        <button
          onClick={() => {
            setAlmacenEditando(null);
            setShowModal(true);
          }}
          className="text-white flex px-3 py-2 bg-[#1A253D] items-center gap-2 rounded-sm text-sm hover:opacity-90 transition">
          <PiGarageLight size={18} />
          <span>Nuevo Almacén</span>
        </button>
      </div>

      <p className="text-gray-600 mb-4">
        Visualice su almacén y sus movimientos.
      </p>

      <div className="overflow-x-auto rounded shadow border border-gray-200 border-b-[#1A253D] border-b-4">
        <table className="min-w-full text-sm text-left bg-white">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : dataPaginada.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No hay almacenes registrados
                </td>
              </tr>
            ) : (
              dataPaginada.map((alm) => (
                <tr
                  key={alm.uuid}
                  className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2">{alm.nombre_almacen}</td>
                  <td className="px-4 py-2">{alm.departamento}</td>
                  <td className="px-4 py-2">{alm.ciudad}</td>
                  <td className="px-4 py-2">{alm.direccion}</td>
                  <td className="px-4 py-2">
                    {new Date(alm.fecha_registro).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <FaEdit
                      size={16}
                      className="text-orange-500 hover:text-orange-700 cursor-pointer"
                      onClick={() => {
                        setAlmacenEditando(alm);
                        setShowModal(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <Paginator
            currentPage={paginaActual}
            totalPages={totalPaginas}
            onPageChange={setPaginaActual}
          />
        </div>
      </div>

      {showModal && token && (
        <CrearAlmacenModal
          token={token}
          almacen={almacenEditando}
          modo={almacenEditando ? 'editar' : 'crear'}
          onClose={() => {
            setShowModal(false);
            setAlmacenEditando(null);
          }}
          onSuccess={(nuevo) => {
            setAlmacenes((prev) => {
              const existe = prev.some((a) => a.uuid === nuevo.uuid);
              if (existe) {
                return prev.map((a) => (a.uuid === nuevo.uuid ? nuevo : a));
              }
              return [nuevo, ...prev];
            });
            setPaginaActual(1);
          }}
        />
      )}
    </section>
  );
}
