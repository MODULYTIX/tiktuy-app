import { useEffect, useState } from 'react';
import { FaCheck, FaEye } from 'react-icons/fa';
import { Skeleton } from '../../ui/Skeleton';
import { Badge } from '../../ui/Badge';
import Paginator from '../../Paginator';

interface CuadreSaldo {
  id: string;
  fecha_entrega: string;
  courier: string;
  ciudad: string;
  monto: number;
  concepto: string;
  estado: 'Validado' | 'Sin Validar';
}

export default function CuadreSaldoTable() {
  const [data, setData] = useState<CuadreSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Simular fetch con timeout
    setTimeout(() => {
      setData([
        {
          id: '1',
          fecha_entrega: '28/07/2025',
          courier: 'Olva Courier',
          ciudad: 'Arequipa',
          monto: 3200,
          concepto: 'Venta del día',
          estado: 'Validado',
        },
        {
          id: '2',
          fecha_entrega: '28/07/2025',
          courier: 'DHL Express',
          ciudad: 'Puno',
          monto: 6000,
          concepto: 'Transferencia de la courier',
          estado: 'Sin Validar',
        },
        // ...más datos
      ]);
      setLoading(false);
    }, 1000);
  }, [currentPage]);

  return (
    <div className="mt-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <select className="border rounded px-3 py-2">
          <option>Seleccionar courier</option>
          {/* Opciones dinámicas */}
        </select>
        <select className="border rounded px-3 py-2">
          <option>Seleccionar estado</option>
        </select>
        <input type="date" className="border rounded px-3 py-2" />
        <input type="date" className="border rounded px-3 py-2" />
        <button className="border px-3 py-2 rounded hover:bg-gray-100">
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3">Fec. Entrega</th>
              <th className="px-4 py-3">Courier</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-t">
                    {Array(7)
                      .fill(null)
                      .map((_, i) => (
                        <td key={i} className="px-4 py-2">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                  </tr>
                ))
              : data.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{item.fecha_entrega}</td>
                    <td className="px-4 py-3">{item.courier}</td>
                    <td className="px-4 py-3">{item.ciudad}</td>
                    <td className="px-4 py-3">S/ {item.monto.toFixed(2)}</td>
                    <td className="px-4 py-3">{item.concepto}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.estado === 'Validado' ? 'default' : 'secondary'
                        }>
                        {item.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-2 items-center">
                      {item.estado === 'Sin Validar' && (
                        <FaCheck className="text-green-500 cursor-pointer" />
                      )}
                      <FaEye className="text-blue-500 cursor-pointer" />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      <div className="mt-4">
        <Paginator
          currentPage={currentPage}
          totalPages={20}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
