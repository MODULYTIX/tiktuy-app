import { useAuth } from '@/auth/context/useAuth';
import { useEffect, useState } from 'react';
import {
  fetchEcommerceCourier,
  asociarCourier,
  desasociarCourier,
  crearRelacionCourier,
  type EcommerceCourier,
} from '@/services/ecommerce/ecommerceCourier.api';
import { FaEye, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';

export default function EcommerceHomePage() {
  const { token } = useAuth();
  const [data, setData] = useState<EcommerceCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    ciudad: '',
    courier: '',
    estado: '',
  });

  const loadData = async () => {
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
  }, []);

  const handleChangeFiltro = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ ciudad: '', courier: '', estado: '' });
  };

  const handleAsociar = async (id: number) => {
    await asociarCourier(id, token);
    loadData();
  };

  const handleDesasociar = async (id: number) => {
    await desasociarCourier(id, token);
    loadData();
  };

  const handleCrearRelacion = async () => {
    const input = prompt('Ingrese el ID del courier que desea asociar');
    const courier_id = Number(input);
    if (!courier_id) return alert('ID inválido');

    try {
      await crearRelacionCourier({ courier_id }, token);
      alert('Courier asociado correctamente');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al crear relación');
    }
  };

  const verDetalle = (entry: EcommerceCourier) => {
    alert(JSON.stringify(entry, null, 2));
  };

  const dataFiltrada = data.filter((entry) => {
    return (
      (!filtros.ciudad || entry.courier.ciudad === filtros.ciudad) &&
      (!filtros.courier || entry.courier.nombre_comercial === filtros.courier) &&
      (!filtros.estado || entry.estado === filtros.estado)
    );
  });
  

  const ciudades = [...new Set(data.map((d) => d.courier.ciudad))];
  const couriersUnicos = [
    ...new Map(data.map((d) => [d.courier.id, d.courier])).values()
  ];
  const estados = ['Asociado', 'No Asociado'];

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-bold mb-1">Panel de Control</h1>
      <p className="mb-4 text-gray-600">
        Monitoreo de Asociación con couriers por ciudades
      </p>

      {/* Botón para crear relación */}
      <div className="mb-4">
        <button
          onClick={handleCrearRelacion}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FaPlus /> Asociar nuevo courier
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end mb-6">
        {/* Filtro ciudad */}
        <div className="flex flex-col text-sm">
          <label className="text-gray-700 font-medium mb-1 text-center">Almacén</label>
          <select
            name="ciudad"
            value={filtros.ciudad}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 "
          >
            <option value="">Seleccionar almacén</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad} value={ciudad}>
                {ciudad}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro courier */}
        <div className="flex flex-col text-sm">
          <label className="text-gray-700 font-medium mb-1 text-center">Categorías</label>
          <select
            name="courier"
            value={filtros.courier}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 "
          >
            <option value="">Seleccionar categoría</option>
            {couriersUnicos.map((courier) => (
              <option key={courier.id} value={courier.nombre_comercial}>
                {courier.nombre_comercial}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro estado */}
        <div className="flex flex-col text-sm">
          <label className="text-gray-700 font-medium mb-1 text-center">Estado</label>
          <select
            name="estado"
            value={filtros.estado}
            onChange={handleChangeFiltro}
            className="border rounded px-3 py-2 min-w-82 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 "
          >
            <option value="">Seleccionar estado</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={limpiarFiltros}
          className="ml-auto text-sm text-gray-600 border rounded px-4 py-2 hover:bg-gray-50 hover:ring-1 hover:ring-gray-300 flex items-center gap-2 transition"
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
                  <td className="px-4 py-2">{entry.courier.departamento}</td>
                  <td className="px-4 py-2">{entry.courier.departamento}</td>
                  <td className="px-4 py-2">{entry.courier.direccion}</td>
                  <td className="px-4 py-2">{entry.courier.nombre_comercial}</td>
                  <td className="px-4 py-2">{entry.telefono}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.estado === 'Asociado'
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {entry.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex items-center gap-3">
                    <FaEye
                      onClick={() => verDetalle(entry)}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                    />
                    {entry.estado === 'Asociado' ? (
                      <FaTimes
                        onClick={() => handleDesasociar(entry.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    ) : (
                      <FaCheck
                        onClick={() => handleAsociar(entry.id)}
                        className="text-green-500 hover:text-green-700 cursor-pointer"
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
