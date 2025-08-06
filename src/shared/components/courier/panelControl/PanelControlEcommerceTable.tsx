import { useState } from 'react';
import { FaEye } from 'react-icons/fa';

interface EcommerceData {
  id: number;
  nombre_comercial: string;
  ruc: string;
  ciudad: string;
  telefono: string;
  estado: 'activo' | 'pendiente';
  fecha_asociacion: string;
}

const dataMock: EcommerceData[] = [
  {
    id: 1,
    nombre_comercial: 'ElectroHouse',
    ruc: '10234567891',
    ciudad: 'Arequipa',
    telefono: '987 654 321',
    estado: 'activo',
    fecha_asociacion: '28/07/2025',
  },
  {
    id: 2,
    nombre_comercial: 'DHL Express',
    ruc: '10234567891',
    ciudad: 'Huancavelica',
    telefono: '987 654 321',
    estado: 'activo',
    fecha_asociacion: '28/07/2025',
  },
  {
    id: 3,
    nombre_comercial: 'Urbano',
    ruc: '10234567891',
    ciudad: 'Cajamarca',
    telefono: '987 654 321',
    estado: 'activo',
    fecha_asociacion: '29/07/2025',
  },
  {
    id: 4,
    nombre_comercial: 'Izipay Courier',
    ruc: '10234567891',
    ciudad: 'Tacna',
    telefono: '987 654 321',
    estado: 'activo',
    fecha_asociacion: '30/07/2025',
  },
  {
    id: 5,
    nombre_comercial: 'Rappi Courier',
    ruc: '10234567891',
    ciudad: 'Moquegua',
    telefono: '987 654 321',
    estado: 'activo',
    fecha_asociacion: '31/07/2025',
  },
];

export default function PanelControlTable() {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const totalPages = Math.ceil(dataMock.length / rowsPerPage);
  const currentData = dataMock.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleVerDetalle = (ecommerce: EcommerceData) => {
    alert(JSON.stringify(ecommerce, null, 2));
  };

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow-sm text-sm">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Nombre Comercial</th>
              <th className="px-4 py-3 text-left">RUC</th>
              <th className="px-4 py-3 text-left">Ciudad</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">F. Asociación</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {currentData.map((entry) => (
              <tr key={entry.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{entry.nombre_comercial}</td>
                <td className="px-4 py-2">{entry.ruc}</td>
                <td className="px-4 py-2">{entry.ciudad}</td>
                <td className="px-4 py-2 flex items-center gap-2">
                  {entry.telefono}
                  <button
                    onClick={() => navigator.clipboard.writeText(entry.telefono)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="Copiar teléfono"
                  >
                    📋
                  </button>
                </td>
                <td className="px-4 py-2">
                  <span className="bg-black text-white text-xs px-2 py-1 rounded-full font-medium">
                    {entry.estado}
                  </span>
                </td>
                <td className="px-4 py-2">{entry.fecha_asociacion}</td>
                <td className="px-4 py-2">
                  <FaEye
                    onClick={() => handleVerDetalle(entry)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-end items-center gap-2 mt-4 text-sm">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i + 1}
            className={`w-8 h-8 flex items-center justify-center border rounded ${
              page === i + 1 ? 'bg-orange-500 text-white' : 'text-gray-700'
            }`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
