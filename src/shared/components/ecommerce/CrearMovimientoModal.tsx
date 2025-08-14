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
import { FaEye } from 'react-icons/fa';
import { useNotification } from '@/shared/context/notificaciones/useNotification';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedProducts?: string[];        // uuids de productos
  modo?: 'crear' | 'ver';
}

export default function CrearMovimientoModal({
  open,
  onClose,
  selectedProducts = [],
  modo = 'crear',
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [almacenOrigen, setAlmacenOrigen] = useState<string>('');
  const [almacenDestino, setAlmacenDestino] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !token) return;
    fetchAlmacenes(token).then(setAlmacenes).catch(console.error);
    fetchProductos(token).then(setProductos).catch(console.error);
  }, [open, token]);

  // auto origen por 1er producto seleccionado
  useEffect(() => {
    if (selectedProducts.length > 0 && productos.length > 0) {
      const base = productos.find((p) => p.uuid === selectedProducts[0]);
      if (base?.almacenamiento_id) {
        setAlmacenOrigen(String(base.almacenamiento_id));
      }
    }
  }, [selectedProducts, productos]);

  const handleCantidadChange = (productoId: string, value: number, stock: number) => {
    const safe = Math.min(Math.max(0, value), stock);
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };

  const handleSubmit = async () => {
    // validar mismo almacén entre seleccionados
    const almacenesProductos = productos
      .filter((p) => selectedProducts.includes(p.uuid))
      .map((p) => (p.almacenamiento_id != null ? String(p.almacenamiento_id) : '') )
      .filter(Boolean);

    const todosIguales = almacenesProductos.length > 0
      ? almacenesProductos.every((id) => id === almacenesProductos[0])
      : false;

    if (!todosIguales) {
      notify('Todos los productos deben pertenecer al mismo almacén de origen.', 'error');
      return;
    }

    if (!almacenOrigen || !almacenDestino || almacenOrigen === almacenDestino) {
      notify('Selecciona almacenes válidos.', 'error');
      return;
    }

    const productosMov = selectedProducts
      .filter((uuid) => (cantidades[uuid] ?? 0) > 0)
      .map((uuid) => {
        const producto = productos.find((p) => p.uuid === uuid);
        if (!producto) return null;
        return { producto_id: producto.id, cantidad: cantidades[uuid] };
      })
      .filter((p): p is { producto_id: number; cantidad: number } => p !== null);

    if (productosMov.length === 0) {
      notify('Debes ingresar al menos una cantidad válida.', 'error');
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
      notify('Movimiento registrado correctamente.', 'success');

      // reset simple
      setCantidades({});
      setDescripcion('');
      setAlmacenOrigen('');
      setAlmacenDestino('');
      onClose();
    } catch (err) {
      console.error(err);
      notify('Error al registrar el movimiento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const productosSeleccionados = productos.filter((p) => selectedProducts.includes(p.uuid));

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          {modo === 'crear' ? (
            <>
              <HiOutlineViewGridAdd size={20} className="text-primaryDark" />
              REGISTRAR NUEVO MOVIMIENTO
            </>
          ) : (
            <>
              <FaEye size={20} className="text-blue-600" />
              DETALLE DE MOVIMIENTO
            </>
          )}
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          {modo === 'crear'
            ? 'Selecciona productos y completa los datos para registrar un movimiento.'
            : 'Visualiza la información del movimiento.'}
        </p>

        <div className={`border rounded overflow-hidden mb-6 ${productosSeleccionados.length > 5 ? 'max-h-72 overflow-y-auto' : ''}`}>
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
                  <td className="p-2 text-gray-500 truncate">{prod.descripcion}</td>
                  <td className="p-2 text-right flex justify-end items-center gap-1">
                    {modo === 'crear' ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          max={prod.stock}
                          value={Number.isFinite(cantidades[prod.uuid]) ? cantidades[prod.uuid] : ''}
                          onChange={(e) => handleCantidadChange(prod.uuid, Number(e.target.value), prod.stock)}
                          className="w-16 border rounded px-2 py-1 text-right"
                        />
                        <span className="text-xs text-gray-400">/ {prod.stock}</span>
                      </>
                    ) : (
                      <span>{(cantidades[prod.uuid] ?? 0)} / {prod.stock}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Almacenes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Almacén Origen</label>
            {modo === 'crear' ? (
              <select
                value={almacenOrigen}
                onChange={(e) => setAlmacenOrigen(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccionar almacén</option>
                {almacenes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre_almacen}</option>
                ))}
              </select>
            ) : (
              <p>{almacenes.find((a) => String(a.id) === almacenOrigen)?.nombre_almacen || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Almacén Destino</label>
            {modo === 'crear' ? (
              <select
                value={almacenDestino}
                onChange={(e) => setAlmacenDestino(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccionar almacén</option>
                {almacenes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre_almacen}</option>
                ))}
              </select>
            ) : (
              <p>{almacenes.find((a) => String(a.id) === almacenDestino)?.nombre_almacen || '-'}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          {modo === 'crear' ? (
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Motivo del movimiento..."
              className="w-full border rounded px-3 py-2 resize-none"
            />
          ) : (
            <p>{descripcion || 'Sin descripción'}</p>
          )}
        </div>

        {/* Botones */}
        {modo === 'crear' && (
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              {loading ? 'Registrando...' : 'Crear nuevo'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
