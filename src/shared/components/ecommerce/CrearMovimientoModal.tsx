// src/components/almacenamiento/CrearMovimientoModal.tsx
import { useEffect,  useState } from 'react';
import { createPortal } from 'react-dom';
import {
  fetchAlmacenes,
  fetchAlmacenesEcommerCourier,
  registrarMovimiento,
} from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { fetchProductos } from '@/services/ecommerce/producto/producto.api';
import { useAuth } from '@/auth/context';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import { useNotification } from '@/shared/context/notificacionesDeskop/useNotification';
import { Selectx } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';
import Tittlex from '@/shared/common/Tittlex';
import { Inputx, InputxTextarea } from '@/shared/common/Inputx';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedProducts?: string[]; // uuids
}

export default function CrearMovimientoModal({
  open,
  onClose,
  selectedProducts = [],
}: Props) {
  const { token } = useAuth();
  const { notify } = useNotification();

  const [almacenesOrigen, setAlmacenesOrigen] = useState<Almacenamiento[]>([]);
  const [almacenesDestino, setAlmacenesDestino] = useState<Almacenamiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [almacenOrigen, setAlmacenOrigen] = useState<string>('');
  const [almacenDestino, setAlmacenDestino] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !token) return;
    fetchAlmacenes(token).then(setAlmacenesOrigen).catch(console.error);
    fetchAlmacenesEcommerCourier(token).then(setAlmacenesDestino).catch(console.error);
    fetchProductos(token).then(setProductos).catch(console.error);
  }, [open, token]);

  useEffect(() => {
    if (selectedProducts.length > 0 && productos.length > 0) {
      const base = productos.find((p) => p.uuid === selectedProducts[0]);
      if (base?.almacenamiento_id) setAlmacenOrigen(String(base.almacenamiento_id));
    }
  }, [selectedProducts, productos]);

  const handleCantidadChange = (productoId: string, value: number, stock: number) => {
    const safe = Math.min(Math.max(0, value || 0), stock);
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };

  const handleSubmit = async () => {
    const almacenesProductos = productos
      .filter((p) => selectedProducts.includes(p.uuid))
      .map((p) => (p.almacenamiento_id != null ? String(p.almacenamiento_id) : ''))
      .filter(Boolean);

    const todosIguales =
      almacenesProductos.length > 0
        ? almacenesProductos.every((id) => id === almacenesProductos[0])
        : false;

    if (!todosIguales) return notify('Todos los productos deben pertenecer al mismo sede de origen.', 'error');
    if (!almacenOrigen || !almacenDestino || almacenOrigen === almacenDestino)
      return notify('Selecciona sede válidos.', 'error');

    const productosMov = selectedProducts
      .filter((uuid) => (cantidades[uuid] ?? 0) > 0)
      .map((uuid) => {
        const producto = productos.find((p) => p.uuid === uuid);
        if (!producto) return null;
        return { producto_id: producto.id, cantidad: cantidades[uuid] };
      })
      .filter((p): p is { producto_id: number; cantidad: number } => p !== null);

    if (productosMov.length === 0) return notify('Debes ingresar al menos una cantidad válida.', 'error');

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
      {/* Panel derecho / ancho fijo */}
      <div
        className="h-screen w-[700px] bg-white shadow-xl flex flex-col gap-5 px-5 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="REGISTRAR NUEVO MOVIMIENTO"
          description="Selecciona productos y completa los datos para registrar un movimiento."
        />

        {/* ========== Tabla con bordes redondeados correctos ========== */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full table-fixed text-sm border-separate border-spacing-0">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[24%]" />
              <col className="w-[34%]" />
              <col className="w-[20%]" />
            </colgroup>

            <thead className="bg-gray-100 text-gray-700">
              <tr className="h-12">
                <th className="px-4 text-left font-medium">Código</th>
                <th className="px-4 text-left font-medium">Producto</th>
                <th className="px-4 text-left font-medium">Descripción</th>
                <th className="px-4 text-right font-medium">Cantidad</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {productosSeleccionados.map((prod) => (
                <tr key={prod.uuid} className="border-t last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-4 align-middle whitespace-nowrap text-gray-900">
                    {prod.codigo_identificacion}
                  </td>
                  <td className="px-4 py-4 align-middle whitespace-nowrap text-gray-900">
                    {prod.nombre_producto}
                  </td>
                  <td className="px-4 py-4 align-middle text-gray-700">
                    <div className="line-clamp-2 leading-5 break-words">{prod.descripcion}</div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="ml-auto flex w-full justify-end items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={prod.stock}
                        value={
                          Number.isFinite(cantidades[prod.uuid])
                            ? cantidades[prod.uuid]
                            : ''
                        }
                        onChange={(e) =>
                          handleCantidadChange(prod.uuid, Number(e.target.value), prod.stock)
                        }
                        className="w-[64px] h-9 rounded-lg border border-gray-300 px-2
                                  text-center text-sm shadow-sm
                                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                                  appearance-auto"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        / {prod.stock}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Datos adicionales */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <Inputx
              label="Sede Origen"
              name="almacen_origen"
              // labelVariant="left"
              value={almacenOrigen} // Este es el valor que se selecciona
              onChange={(e) => setAlmacenOrigen(e.target.value)} // Actualiza el valor seleccionado
              placeholder="Seleccionar almacén"
            >
              {almacenesOrigen.map((almacen) => (
                <option key={almacen.id} value={almacen.id}>
                  {almacen.nombre_almacen}
                </option>
              ))}
            </Inputx>

            <Selectx
              label="Sede Destino"
              name="almacen_destino"
              labelVariant="left"
              value={almacenDestino ?? ''}
              onChange={(e) => setAlmacenDestino(e.target.value)}
              placeholder="Seleccionar sede"
            >
              {almacenesDestino.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.nombre_almacen}
                </option>
              ))}
            </Selectx>
          </div>

          <InputxTextarea
            name="descripcion"
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Motivo del movimiento..."
            autoResize
            minRows={3}
            maxRows={8}
          />
        </div>

        {/* Botones */}
        <div className="flex items-center gap-5">
          <Buttonx
            variant="quartery"
            disabled={loading}
            onClick={handleSubmit}
            label={loading ? 'Registrando...' : 'Crear nuevo'}
            icon={loading ? 'line-md:loading-twotone-loop' : undefined}
            className={`px-4 text-sm ${loading ? '[&_svg]:animate-spin' : ''}`}
          />
          <Buttonx
            variant="outlinedw"
            onClick={onClose}
            label="Cancelar"
            className="px-4 text-sm border"
            disabled={loading}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
