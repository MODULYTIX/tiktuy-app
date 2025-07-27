import { useAuth } from '@/auth/context/useAuth';
import { useEffect, useState } from 'react';
import {
  fetchEcommerceCourier,
  asociarCourier,
  desasociarCourier,
  type EcommerceCourier,
} from '@/services/ecommerceCourier.api';
import { FaEye, FaCheck, FaTimes } from 'react-icons/fa';

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

  const verDetalle = (entry: EcommerceCourier) => {
    alert(JSON.stringify(entry, null, 2));
  };

  const dataFiltrada = data.filter((entry) => {
    return (
      (!filtros.ciudad || entry.ciudad === filtros.ciudad) &&
      (!filtros.courier || entry.courier === filtros.courier) &&
      (!filtros.estado || entry.estado === filtros.estado)
    );
  });

  const ciudades = [...new Set(data.map((d) => d.ciudad))];
  const couriers = [...new Set(data.map((d) => d.courier))];
  const estados = ['Asociado', 'No Asociado'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Panel de Control</h1>
      <p className="mb-4 text-gray-600">
        Monitoreo de Asociación con couriers por ciudades
      </p>

      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end mb-6">
        {[
          { label: 'Ciudad', name: 'ciudad', options: ciudades },
          { label: 'Courier', name: 'courier', options: couriers },
          { label: 'Estado', name: 'estado', options: estados },
        ].map(({ label, name, options }) => (
          <div key={name} className="flex flex-col">
            <label className="text-sm text-gray-700">{label}:</label>
            <select
              name={name}
              value={(filtros as any)[name]}
              onChange={handleChangeFiltro}
              className="border px-3 py-2 rounded min-w-[140px]">
              <option value="">Todos</option>
              {options.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={limpiarFiltros}
          className="ml-auto border px-4 py-2 rounded text-gray-600 hover:bg-gray-100 flex items-center gap-2">
          <FaTimes /> Limpiar Filtros
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500">Cargando datos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded shadow">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                {[
                  'Departamento',
                  'Ciudad',
                  'Dirección',
                  'Courier',
                  'Teléfono',
                  'Estado',
                  'Acciones',
                ].map((header, i) => (
                  <th key={i} className="p-3 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {dataFiltrada.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{entry.departamento}</td>
                  <td className="p-3">{entry.ciudad}</td>
                  <td className="p-3">{entry.direccion}</td>
                  <td className="p-3">{entry.courier}</td>
                  <td className="p-3">{entry.telefono}</td>
                  <td
                    className={`p-3 font-medium ${
                      entry.estado === 'Asociado'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}>
                    {entry.estado}
                  </td>
                  <td className="p-3 flex items-center gap-3">
                    <FaEye
                      className="text-gray-600 hover:text-blue-600 cursor-pointer"
                      onClick={() => verDetalle(entry)}
                    />
                    {entry.estado === 'Asociado' ? (
                      <FaTimes
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        onClick={() => handleDesasociar(entry.id)}
                      />
                    ) : (
                      <FaCheck
                        className="text-green-500 hover:text-green-700 cursor-pointer"
                        onClick={() => handleAsociar(entry.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {dataFiltrada.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-gray-500">
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
