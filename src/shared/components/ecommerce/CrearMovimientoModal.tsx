import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  fetchAlmacenes,
  registrarMovimiento,
} from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import { useAuth } from '@/auth/context';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import { HiOutlineViewGridAdd } from 'react-icons/hi';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedProducts?: string[];
}

export default function CrearMovimientoModal({
  open,
  onClose,
  selectedProducts = [],
}: Props) {
  const { token } = useAuth();
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<{ [id: string]: number }>({});
  const [almacenOrigen, setAlmacenOrigen] = useState('');
  const [almacenDestino, setAlmacenDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    fetchAlmacenes(token).then(setAlmacenes).catch(console.error);
    fetchProductos(token).then(setProductos).catch(console.error);
  }, [open, token]);

  const handleCantidadChange = (
    productoId: string,
    value: number,
    stock: number
  ) => {
    setCantidades((prev) => ({
      ...prev,
      [productoId]: Math.min(Math.max(0, value), stock),
    }));
  };

  const handleSubmit = async () => {
    if (!almacenOrigen || !almacenDestino || almacenOrigen === almacenDestino) {
      alert('Selecciona almacenes válidos.');
      return;
    }
  
    const productosMov = selectedProducts
      .filter((uuid) => cantidades[uuid] > 0)
      .map((uuid) => {
        const producto = productos.find((p) => p.uuid === uuid);
        if (!producto) {
          console.warn(`Producto con UUID ${uuid} no encontrado`);
          return null;
        }
        return {
          producto_id: producto.id,
          cantidad: cantidades[uuid],
        };
      })
      .filter((p): p is { producto_id: number; cantidad: number } => p !== null);
  
    if (productosMov.length === 0) {
      alert('Debes ingresar al menos una cantidad válida.');
      return;
    }
  
    setLoading(true);
    try {
      await registrarMovimiento(
        {
          almacen_origen_id: Number(almacenOrigen),
          almacen_destino_id: Number(almacenDestino),
          descripcion,
          productos: productosMov,
        },
        token!
      );
  
      // limpiar formulario
      setCantidades({});
      setDescripcion('');
      setAlmacenOrigen('');
      setAlmacenDestino('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al registrar el movimiento.');
    } finally {
      setLoading(false);
    }
  };
  

  if (!open) return null;

  const productosSeleccionados = productos.filter((p) =>
    selectedProducts.includes(p.uuid)
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <HiOutlineViewGridAdd size={20} className="text-primaryDark" />
          REGISTRAR NUEVO MOVIMIENTO
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Selecciona productos y completa los datos para registrar un
          movimiento.
        </p>

        <div
          className={`border rounded overflow-hidden mb-6 ${
            productosSeleccionados.length > 5 ? 'max-h-72 overflow-y-auto' : ''
          }`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Código</th>
                <th className="p-2">Producto</th>
                <th className="p-2">Descripción</th>
                <th className="p-2 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {productosSeleccionados.map((prod) => (
                <tr key={prod.uuid} className="border-t">
                  <td className="p-2">{prod.codigo_identificacion}</td>
                  <td className="p-2">{prod.nombre_producto}</td>
                  <td className="p-2 text-gray-500 truncate">
                    {prod.descripcion}
                  </td>
                  <td className="p-2 text-right flex justify-end items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={prod.stock}
                      value={cantidades[prod.uuid] || ''}
                      onChange={(e) =>
                        handleCantidadChange(
                          prod.uuid,
                          Number(e.target.value),
                          prod.stock
                        )
                      }
                      className="w-16 border rounded px-2 py-1 text-right"
                    />
                    <span className="text-xs text-gray-400">
                      / {prod.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Almacenes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Almacén Origen
            </label>
            <select
              value={almacenOrigen}
              onChange={(e) => setAlmacenOrigen(e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Seleccionar almacén</option>
              {almacenes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_almacen}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Almacén Destino
            </label>
            <select
              value={almacenDestino}
              onChange={(e) => setAlmacenDestino(e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Seleccionar almacén</option>
              {almacenes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_almacen}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Motivo del movimiento..."
            className="w-full border rounded px-3 py-2 resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
            {loading ? 'Registrando...' : 'Crear nuevo'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
