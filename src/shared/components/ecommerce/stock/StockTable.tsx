import { useEffect, useState } from 'react';
import { FaEye, FaEdit } from 'react-icons/fa';
import Paginator from '../../Paginator';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import { useAuth } from '@/auth/context';
import type { Producto } from '@/services/ecommerce/producto/producto.types';

export default function StockTable() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchProductos(token)
      .then(setProductos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

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

  const renderEstadoStock = (stock: number, minimo: number) => {
    const bajo = stock < minimo;
    const bg = bajo
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';
    const texto = bajo ? 'Stock bajo' : 'Stock normal';
    return (
      <>
        <span
          className={`${bg} text-xs px-2 py-1 rounded inline-flex items-center gap-1`}>
          📦 {stock}
        </span>
        <div className="text-xs text-gray-500">{texto}</div>
      </>
    );
  };

  if (loading) return <div className="p-4">Cargando productos...</div>;

  if (!productos.length) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded shadow-sm">
        Aún no hay productos registrados.
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
          {productos.map((prod) => (
            <tr key={prod.uuid} className="border-t">
              <td className="p-3">
                <input type="checkbox" />
              </td>
              <td className="p-3">{prod.codigo_identificacion}</td>
              <td className="p-3">
                <div className="font-semibold">{prod.nombre_producto}</div>
                <div className="text-gray-500 text-xs">{prod.descripcion}</div>
              </td>
              <td className="p-3">{prod.almacenamiento.nombre_almacen}</td>
              <td className="p-3">
                {renderEstadoStock(prod.stock, prod.stock_minimo)}
              </td>
              <td className="text-right">
                S/ {Number(prod.precio).toFixed(2)}
              </td>
              <td className="p-3">
                <span className="text-white text-xs px-2 py-1 rounded bg-black">
                  {prod.estado}
                </span>
              </td>
              <td className="p-3 flex gap-3 mt-3">
                <button>
                  <FaEye className="text-blue-600" size={16} />
                </button>
                <button>
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
