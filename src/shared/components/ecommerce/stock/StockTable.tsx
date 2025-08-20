import { FaEye, FaEdit } from 'react-icons/fa';
import Paginator from '../../Paginator';
import type { Producto } from '@/services/ecommerce/producto/producto.types';

interface Props {
  productos: Producto[];
  onVer: (producto: Producto) => void;
  onEditar: (producto: Producto) => void;
  // Prop opcional para controlar si se filtran productos inactivos
  filtrarInactivos?: boolean;
}

export default function StockTable({ productos, onVer, onEditar, filtrarInactivos = true }: Props) {
  // Filtrar productos inactivos y con stock cero si la opción está activada
  const productosFiltrados = filtrarInactivos
    ? productos.filter(p => 
        p.estado?.nombre !== 'Inactivo' && 
        (p.stock !== undefined && p.stock > 0)
      )
    : productos;

  const headers = [
    '',
    'Código',
    'Producto',
    'Almacén',
    'Stock',
    'Precio',
    'Estado',
    'Acciones',
  ];

  const renderEstadoStock = (stock?: number, minimo?: number) => {
    const isInvalid = stock === undefined || minimo === undefined;
    if (isInvalid) {
      return (
        <span className="text-xs text-red-500">
          Datos no disponibles
        </span>
      );
    }

    const bajo = stock < minimo;
    const bg = bajo
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';
    const texto = bajo ? 'Stock bajo' : 'Stock normal';

    return (
      <>
        <span className={`${bg} text-xs px-2 py-1 rounded inline-flex items-center gap-1`}>
          📦 {stock}
        </span>
        <div className="text-xs text-gray-500">{texto}</div>
      </>
    );
  };

  if (!productosFiltrados.length) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded shadow-sm">
        No hay productos activos con stock disponible.
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-3">
                {i === 0 ? <input type="checkbox" /> : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((prod) => (
            <tr key={prod.uuid} className="border-t">
              <td className="p-3">
                <input type="checkbox" />
              </td>
              <td className="p-3">{prod.codigo_identificacion}</td>
              <td className="p-3">
                <div className="font-semibold">{prod.nombre_producto}</div>
                <div className="text-gray-500 text-xs">{prod.descripcion}</div>
              </td>
              <td className="p-3">
                {prod.almacenamiento?.nombre_almacen || (
                  <span className="text-gray-400 italic">No asignado</span>
                )}
              </td>
              <td className="p-3">
                {renderEstadoStock(prod.stock, prod.stock_minimo)}
              </td>
              <td className="text-right p-3">
                S/ {Number(prod.precio).toFixed(2)}
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  prod.estado?.nombre === 'Inactivo' 
                    ? 'bg-gray-400 text-white' 
                    : 'bg-black text-white'
                }`}>
                  {prod.estado?.nombre || 'Desconocido'}
                </span>
              </td>
              <td className="p-3 flex gap-3">
                <button onClick={() => onVer(prod)} title="Ver producto">
                  <FaEye className="text-blue-600" size={16} />
                </button>
                <button onClick={() => onEditar(prod)} title="Editar producto">
                  <FaEdit className="text-yellow-600" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 border-t flex justify-end">
        <Paginator totalPages={1} currentPage={1} onPageChange={() => {}} />
      </div>
    </div>
  );
}