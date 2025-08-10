import { useState } from "react";
import { FaEye } from "react-icons/fa";
import Paginator from '../../Paginator';

interface Pedido {
  id: number;
  fechaEntrega: string;
  ecommerce: string;
  cliente: string;
  direccion: string;
  cantidadProductos: number;
  monto: number;
}

export default function TablePedidoCourier() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const pedidos: Pedido[] = [
    { id: 1, fechaEntrega: "28/07/2025", ecommerce: "ComerciaGo", cliente: "Juan Perez", direccion: "Av. Ejército 123, Urb. Yanahuara", cantidadProductos: 1, monto: 3200 },
    { id: 2, fechaEntrega: "28/07/2025", ecommerce: "Logistyk", cliente: "Maria Chilet", direccion: "Calle Los Álamos 456, Cerro Colorado", cantidadProductos: 2, monto: 6000 },
    { id: 3, fechaEntrega: "29/07/2025", ecommerce: "FulloMarket", cliente: "Lucia Quispe", direccion: "Av. Venezuela 987, Umacollo", cantidadProductos: 3, monto: 450 },
    { id: 4, fechaEntrega: "30/07/2025", ecommerce: "Entregalo", cliente: "Ernesto Huamán", direccion: "Jr. Tacna y Arica 321, Cercado", cantidadProductos: 3, monto: 2200 },
    { id: 5, fechaEntrega: "31/07/2025", ecommerce: "Pakendi", cliente: "Gustavo Salazar", direccion: "Calle Independencia 753, Yanahuara", cantidadProductos: 2, monto: 980 },
    { id: 6, fechaEntrega: "01/08/2025", ecommerce: "QuickShop", cliente: "Rosa Huerta", direccion: "Av. Los Incas 111, Arequipa", cantidadProductos: 4, monto: 1500 },
    { id: 7, fechaEntrega: "02/08/2025", ecommerce: "TiendaPlus", cliente: "Pedro Gonzales", direccion: "Av. Lima 321, Arequipa", cantidadProductos: 1, monto: 300 },
  ];

  const totalPages = Math.ceil(pedidos.length / itemsPerPage);

  // Calcular elementos que se mostrarán en la página actual
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPedidos = pedidos.slice(indexOfFirst, indexOfLast);

  const toggleSelectAll = () => {
    if (selectedIds.length === currentPedidos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentPedidos.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={selectedIds.length === currentPedidos.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="px-4 py-3">Fec. Entrega</th>
            <th className="px-4 py-3">Ecommerce</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Dirección de Entrega</th>
            <th className="px-4 py-3">Cant. de productos</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentPedidos.map((pedido) => (
            <tr key={pedido.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(pedido.id)}
                  onChange={() => toggleSelectOne(pedido.id)}
                />
              </td>
              <td className="px-4 py-3">{pedido.fechaEntrega}</td>
              <td className="px-4 py-3">{pedido.ecommerce}</td>
              <td className="px-4 py-3">{pedido.cliente}</td>
              <td
                className="px-4 py-3 truncate max-w-[200px]"
                title={pedido.direccion}
              >
                {pedido.direccion}
              </td>
              <td className="px-4 py-3">
                {String(pedido.cantidadProductos).padStart(2, "0")}
              </td>
              <td className="px-4 py-3">
                S/.{" "}
                {pedido.monto.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
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
