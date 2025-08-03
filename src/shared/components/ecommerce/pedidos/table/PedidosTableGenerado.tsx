import { useAuth } from '@/auth/context';
import { fetchPedidos } from '@/services/ecommerce/pedidos/pedidos.api';
import type { Pedido } from '@/services/ecommerce/pedidos/pedidos.types';
import { useEffect, useState } from 'react';
import { FiEye } from 'react-icons/fi';

interface PedidosTableGeneradoProps {
  onEditar: (pedidoId: number) => void;
}

export default function PedidosTableGenerado({ onEditar }: PedidosTableGeneradoProps) {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPedidos(token)
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left rounded shadow-sm bg-white">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2">Fec. Entrega</th>
            <th className="px-4 py-2">Courier</th>
            <th className="px-4 py-2">Cliente</th>
            <th className="px-4 py-2">Producto</th>
            <th className="px-4 py-2">Cantidad</th>
            <th className="px-4 py-2">Monto</th>
            <th className="px-4 py-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse border-b">
                {Array.from({ length: 7 }).map((_, i) => (
                  <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : pedidos.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-4 text-center text-gray-500 italic">
                No hay pedidos registrados.
              </td>
            </tr>
          ) : (
            pedidos.map((pedido) => (
              <tr key={pedido.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  {new Date(pedido.fecha_creacion).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">{pedido.courier?.nombre_comercial}</td>
                <td className="px-4 py-2">{pedido.nombre_cliente}</td>
                <td className="px-4 py-2">
                  {pedido.detalles?.[0]?.producto?.nombre_producto ?? '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  {pedido.detalles?.[0]?.cantidad?.toString().padStart(2, '0')}
                </td>
                <td className="px-4 py-2">
                  S/.{' '}
                  {pedido.detalles
                    ?.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0)
                    .toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => onEditar(pedido.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Ver / Editar Pedido">
                    <FiEye className="inline-block w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
