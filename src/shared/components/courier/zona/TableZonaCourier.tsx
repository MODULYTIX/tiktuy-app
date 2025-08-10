import { useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import Paginator from '../../Paginator';

interface Zona {
  id: number;
  distrito: string;
  zona: number;
  tarifario: number;
  pagoMotorizado: number;
}

export default function TableZonaCourier() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const zonas: Zona[] = [
    { id: 1, distrito: "Characto", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
    { id: 2, distrito: "Cayma", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
    { id: 3, distrito: "Paucarpata", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
    { id: 4, distrito: "Paucarpata", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
    { id: 5, distrito: "Paucarpata", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
    { id: 6, distrito: "Paucarpata", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
    { id: 7, distrito: "Paucarpata", zona: 1, tarifario: 12.0, pagoMotorizado: 8.0 },
  ];

  const totalPages = Math.ceil(zonas.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentZonas = zonas.slice(indexOfFirst, indexOfLast);

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Distrito</th>
            <th className="px-4 py-3">Zona</th>
            <th className="px-4 py-3">Tarifario</th>
            <th className="px-4 py-3">Pago a Motorizado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentZonas.map((zona) => (
            <tr key={zona.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{zona.distrito}</td>
              <td className="px-4 py-3">{zona.zona}</td>
              <td className="px-4 py-3">
                S/.{" "}
                {zona.tarifario.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3">
                S/.{" "}
                {zona.pagoMotorizado.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3">
                <button className="text-orange-500 hover:text-orange-700">
                  <FaRegEdit />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación solo si hay más de itemsPerPage */}
      {totalPages > 1 && (
        <div className="border-t p-4">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
