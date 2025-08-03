import { useEffect, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useAuth } from '@/auth/context';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import Paginator from '../../Paginator';

interface Props {
  onSelectProducts: (productos: Producto[]) => void;
}

export default function MovimientoRegistroTable({ onSelectProducts }: Props) {
  const { token } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchProductos(token)
      .then(setProductos)
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    const seleccionados = productos.filter((p) => selectedIds.includes(p.uuid));
    onSelectProducts(seleccionados);
  }, [selectedIds, productos, onSelectProducts]);

  const toggleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uuid) => uuid !== id) : [...prev, id]
    );
  };

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
            <th className="p-3">#</th>
            {['Código', 'Producto', 'Almacén', 'Stock', 'Precio', 'Estado', 'Acciones'].map((h) => (
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {productos.map((prod) => (
            <tr key={prod.uuid} className="border-t">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(prod.uuid)}
                  onChange={() => toggleCheckbox(prod.uuid)}
                />
              </td>
              <td className="p-3">{prod.codigo_identificacion}</td>
              <td className="p-3">
                <div className="font-semibold">{prod.nombre_producto}</div>
                <div className="text-gray-500 text-xs">{prod.descripcion}</div>
              </td>
              <td className="p-3">{prod.almacenamiento?.nombre_almacen}</td>
              <td className="p-3">{prod.stock}</td>
              <td className="p-3 text-right">S/ {Number(prod.precio).toFixed(2)}</td>
              <td className="p-3">
                <span className="text-xs px-2 py-1 rounded bg-black text-white">
                  {prod.estado}
                </span>
              </td>
              <td className="p-3">
                <FaEye size={16} className="text-blue-600" />
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
