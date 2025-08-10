import { useState } from "react";
import { FaEye, FaCheck } from "react-icons/fa";
import Paginator from '../../Paginator';

interface Movimiento {
  id: number;
  codigo: string;
  desde: string;
  hacia: string;
  descripcion: string;
  fechaGeneracion: string;
  estado: "Validado" | "Proceso" | "Observado";
}

export default function TableMovimientoCourier() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const movimientos: Movimiento[] = [
    { id: 1, codigo: "28JUL25Z23", desde: "Almacén Central", hacia: "Camaná", descripcion: "Se enviaron productos para reponer stock", fechaGeneracion: "28/07/2025", estado: "Validado" },
    { id: 2, codigo: "18AGO25Z21", desde: "Almacén Central", hacia: "Arequipa", descripcion: "Se regresa producto que no sale", fechaGeneracion: "18/08/2025", estado: "Proceso" },
    { id: 3, codigo: "01JUN25Z15", desde: "Lima", hacia: "Almacén Central TechCorp", descripcion: "Almacén Central TechCorp", fechaGeneracion: "01/07/2025", estado: "Observado" },
    { id: 4, codigo: "28JUL25Z23", desde: "Almacén Central", hacia: "Camaná", descripcion: "Se enviaron productos para reponer stock", fechaGeneracion: "28/07/2025", estado: "Validado" },
    { id: 5, codigo: "28JUL25Z23", desde: "Almacén Central", hacia: "Camaná", descripcion: "Se enviaron productos para reponer stock", fechaGeneracion: "28/07/2025", estado: "Validado" },
    { id: 6, codigo: "28JUL25Z23", desde: "Almacén Central", hacia: "Camaná", descripcion: "Se enviaron productos para reponer stock", fechaGeneracion: "28/07/2025", estado: "Validado" },
  ];

  const totalPages = Math.ceil(movimientos.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMovimientos = movimientos.slice(indexOfFirst, indexOfLast);

  const renderEstado = (estado: Movimiento["estado"]) => {
    switch (estado) {
      case "Validado":
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">Validado</span>;
      case "Proceso":
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-600">Proceso</span>;
      case "Observado":
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-600">Observado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Desde</th>
            <th className="px-4 py-3">Hacia</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3">Fec. Generación</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentMovimientos.map((mov) => (
            <tr key={mov.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{mov.codigo}</td>
              <td className="px-4 py-3">{mov.desde}</td>
              <td className="px-4 py-3">{mov.hacia}</td>
              <td className="px-4 py-3">{mov.descripcion}</td>
              <td className="px-4 py-3">{mov.fechaGeneracion}</td>
              <td className="px-4 py-3">{renderEstado(mov.estado)}</td>
              <td className="px-4 py-3 flex items-center gap-2">
                {mov.estado === "Proceso" && (
                  <button className="text-green-500 hover:text-green-700">
                    <FaCheck />
                  </button>
                )}
                <button className="text-blue-500 hover:text-blue-700">
                  <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
