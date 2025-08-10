import { useAuth } from '@/auth/context/useAuth';
import { useEffect, useState } from 'react';
import {
  fetchEcommerceCourier,
  asociarCourier,
  desasociarCourier,
  crearRelacionCourier,
} from '@/services/ecommerce/ecommerceCourier.api';
import { FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import type { CourierAsociado } from '@/services/ecommerce/ecommerceCourier.types';

export default function EcommerceHomePage() {
  const { token } = useAuth();
  const [data, setData] = useState<CourierAsociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    ciudad: '',
    courier: '',
    estado: '',
  });

  const loadData = async () => {
    if (!token) return;
    try {
      const res = await fetchEcommerceCourier(token);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleChangeFiltro = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ ciudad: '', courier: '', estado: '' });
  };

  const handleAsociar = async (entry: CourierAsociado) => {
    if (!token) return;
    try {
      if (!entry.id_relacion) {
        await crearRelacionCourier({ courier_id: entry.id }, token);
      } else {
        await asociarCourier(entry.id_relacion, token);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al asociar courier');
    }
  };

  const handleDesasociar = async (entry: CourierAsociado) => {
    if (!token) return;
    try {
      if (entry.id_relacion) {
        await desasociarCourier(entry.id_relacion, token);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al desasociar courier');
    }
  };

  const verDetalle = (entry: CourierAsociado) => {
    alert(JSON.stringify(entry, null, 2));
  };

  const dataFiltrada = data.filter((entry) => {
    return (
      (!filtros.ciudad || entry.ciudad === filtros.ciudad) &&
      (!filtros.courier || entry.nombre_comercial === filtros.courier) &&
      (!filtros.estado || entry.estado_asociacion === filtros.estado)
    );
  });

  const ciudades = [...new Set(data.map((d) => d.ciudad))];
  const couriersUnicos = [...new Set(data.map((d) => d.nombre_comercial))];
  const estados = ['activo', 'inactivo', 'No Asociado'];

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-bold mb-1">Panel de Control</h1>
      <p className="mb-4 text-gray-600">
        Monitoreo de Asociación con couriers por ciudades
      </p>

      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end mb-6">
        <div className="flex flex-col text-sm">
          <label className="text-gray-700 font-medium mb-1 text-center">Ciudad</label>
          <select
            name="ciudad"
            value={filtros.ciudad}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm"
          >
            <option value="">Todas</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad} value={ciudad}>
                {ciudad}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col text-sm">
          <label className="text-gray-700 font-medium mb-1 text-center">Courier</label>
          <select
            name="courier"
            value={filtros.courier}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {couriersUnicos.map((courier) => (
              <option key={courier} value={courier}>
                {courier}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col text-sm">
          <label className="text-gray-700 font-medium mb-1 text-center">Estado</label>
          <select
            name="estado"
            value={filtros.estado}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={limpiarFiltros}
          className="ml-auto text-sm text-gray-600 border rounded px-4 py-2 hover:bg-gray-50 flex items-center gap-2 transition"
        >
          <FaTimes className="text-gray-500" />
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500">Cargando datos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded shadow-sm text-sm">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                {[
                  'Departamento',
                  'Ciudad',
                  'Dirección',
                  'Courier',
                  'Teléfono',
                  'Estado',
                  'Acciones',
                ].map((header) => (
                  <th key={header} className="px-4 py-3 text-left whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {dataFiltrada.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{entry.departamento}</td>
                  <td className="px-4 py-2">{entry.ciudad}</td>
                  <td className="px-4 py-2">{entry.direccion}</td>
                  <td className="px-4 py-2">{entry.nombre_comercial}</td>
                  <td className="px-4 py-2">{entry.telefono}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.estado_asociacion === 'activo'
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {entry.estado_asociacion}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex items-center gap-3">
                    <FaEye
                      onClick={() => verDetalle(entry)}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                    />
                    {entry.estado_asociacion === 'activo' ? (
                      <FaTimes
                        onClick={() => handleDesasociar(entry)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Desasociar"
                      />
                    ) : (
                      <FaCheck
                        onClick={() => handleAsociar(entry)}
                        className="text-green-500 hover:text-green-700 rotate-0 cursor-pointer"
                        title="Asociar"
                      />
                    )}
                  </td>
                </tr>
              ))}
              {dataFiltrada.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No se encontraron resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
