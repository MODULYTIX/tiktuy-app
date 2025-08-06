import { useState } from 'react';
import { FaEye } from 'react-icons/fa';

interface MotorizadoData {
  id: number;
  nombre: string;
  apellidos: string;
  dni_ci: string;
  telefono: string;
  zona: string;
  estado: 'activo' | 'inactivo';
  fecha_asociacion: string;
}

const dataMock: MotorizadoData[] = [
  {
    id: 1,
    nombre: 'Alvaro Jesus',
    apellidos: 'Maguíña Chilet',
    dni_ci: '47259841',
    telefono: '987 654 321',
    zona: 'Ñaña',
    estado: 'activo',
    fecha_asociacion: '28/07/2025',
  },
  {
    id: 2,
    nombre: 'Alvaro Jesus',
    apellidos: 'Maguíña Chilet',
    dni_ci: '47259841',
    telefono: '987 654 321',
    zona: 'Ñaña',
    estado: 'activo',
    fecha_asociacion: '28/07/2025',
  },
];

export default function PanelControlRepartidor() {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const totalPages = Math.ceil(dataMock.length / rowsPerPage);
  const currentData = dataMock.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleVerDetalle = (motorizado: MotorizadoData) => {
    alert(JSON.stringify(motorizado, null, 2));
  };

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow-sm text-sm">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Apellidos</th>
              <th className="px-4 py-3 text-left">DNI</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Zona</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">F. Asociación</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {currentData.map((entry) => (
              <tr key={entry.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{entry.nombre}</td>
                <td className="px-4 py-2">{entry.apellidos}</td>
                <td className="px-4 py-2">{entry.dni_ci}</td>
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
                <td className="px-4 py-2">{entry.zona}</td>
                <td className="px-4 py-2">
                  <span className="bg-black text-white text-xs px-2 py-1 rounded-full font-medium capitalize">
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
