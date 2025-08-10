import { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa";
import Paginator from '../../Paginator';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  marca: string;
  almacen: string;
  stock: number;
  precio: number;
  estado: "Activo" | "Descontinuado";
}

export default function TableStockProductoCourier() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const productos: Producto[] = [
    {
      id: 1,
      codigo: "lap001",
      nombre: "Zapatos",
      descripcion: "1 Billetera Billetera de cuero marrón marca Renso",
      marca: "Renso",
      almacen: "Almacén Central TechCorp",
      stock: 50,
      precio: 30.0,
      estado: "Activo",
    },
    {
      id: 2,
      codigo: "lap001",
      nombre: "Zapatos",
      descripcion: "1 Billetera Billetera de cuero marrón marca Renso",
      marca: "Renso",
      almacen: "Almacén Central TechCorp",
      stock: 50,
      precio: 30.0,
      estado: "Activo",
    },
    {
      id: 3,
      codigo: "lap001",
      nombre: "Zapatos",
      descripcion: "1 Billetera Billetera de cuero marrón marca Renso",
      marca: "Renso",
      almacen: "Almacén Central TechCorp",
      stock: 50,
      precio: 30.0,
      estado: "Descontinuado",
    },
  ];

  const totalPages = Math.ceil(productos.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProductos = productos.slice(indexOfFirst, indexOfLast);

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Almacén</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentProductos.map((producto) => (
            <tr key={producto.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{producto.codigo}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{producto.nombre}</div>
                <div className="text-xs text-gray-500">{producto.descripcion}</div>
                <div className="text-xs text-gray-400">Marca: {producto.marca}</div>
              </td>
              <td className="px-4 py-3">{producto.almacen}</td>
              <td className="px-4 py-3 flex items-center gap-1 text-green-600">
                <FaBoxOpen />
                {producto.stock}
                <span className="text-xs text-gray-500 ml-1">Stock normal</span>
              </td>
              <td className="px-4 py-3">
                S/.{" "}
                {producto.precio.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="px-4 py-3">
                {producto.estado === "Activo" ? (
                  <span className="px-2 py-1 text-xs rounded bg-black text-white">
                    Activo
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded bg-gray-500 text-white">
                    Descontinuado
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <button className="text-blue-500 hover:text-blue-700">
                  <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mostrar paginación solo si hay más de itemsPerPage */}
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
