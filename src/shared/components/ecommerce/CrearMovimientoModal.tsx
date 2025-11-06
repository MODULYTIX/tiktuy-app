import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  fetchSedesConRepresentante,
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
import { InputxTextarea } from '@/shared/common/Inputx';

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
  const { notify } = useNotification();

  const [sedesOrigen, setSedesOrigen] = useState<Almacenamiento[]>([]);
  const [sedesDestino, setSedesDestino] = useState<Almacenamiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [almacenOrigen, setAlmacenOrigen] = useState<string>('');   // id de sede origen
  const [almacenDestino, setAlmacenDestino] = useState<string>(''); // id de sede destino
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !token) return;

    // Sedes (mezcla: propias + asociadas al courier)
    fetchSedesConRepresentante(token)
      .then((data) => {
        const list: Almacenamiento[] = Array.isArray(data) ? data : [];
        setSedesOrigen(list);
        setSedesDestino(list);
      })
      .catch(console.error);

    // Productos (array plano o { data: [] })
    fetchProductos(token)
      .then((serverData: any) => {
        const list: Producto[] = Array.isArray(serverData)
          ? serverData
          : Array.isArray(serverData?.data)
          ? serverData.data
          : [];
        setProductos(list);
      })
      .catch(console.error);

    // Reset al abrir
    setCantidades({});
    setDescripcion('');
    setAlmacenDestino('');
    setAlmacenOrigen(''); // se autoinferirá si corresponde
  }, [open, token]);

  // Productos seleccionados
  const productosSeleccionados = useMemo(
    () => productos.filter((p) => selectedProducts.includes(p.uuid)),
    [productos, selectedProducts]
  );

  // Sede origen inferida por los productos seleccionados
  const origenInferido = useMemo(() => {
    const almacenesProductos = productosSeleccionados
      .map((p) => (p.almacenamiento_id != null ? String(p.almacenamiento_id) : ''))
      .filter(Boolean);
    if (almacenesProductos.length === 0) return '';
    const base = almacenesProductos[0];
    const todosIguales = almacenesProductos.every((id) => id === base);
    return todosIguales ? base : '';
  }, [productosSeleccionados]);

  // Prefijar origen cuando haya selección consistente
  useEffect(() => {
    if (origenInferido) {
      setAlmacenOrigen(origenInferido);
      // Si el destino coincide con el nuevo origen, límpialo
      setAlmacenDestino((dest) => (dest === origenInferido ? '' : dest));
    }
  }, [origenInferido]);

  // === DESTINO: solo sedes ASOCIADAS (courier), excluyendo la de ORIGEN ===
  const esSedeAsociada = (s: Almacenamiento) =>
    s?.entidad?.tipo === 'courier' || !!s?.courier_id;

  // Base de destinos: usa sedesDestino si hay; si no, sedesOrigen
  const destinosBase = useMemo(() => {
    const base = (sedesDestino?.length ? sedesDestino : sedesOrigen) || [];
    return base.filter(esSedeAsociada); // SOLO asociadas
  }, [sedesDestino, sedesOrigen]);

  // Filtradas: excluye el ORIGEN (si hay)
  const destinosFiltrados = useMemo(() => {
    if (!destinosBase.length) return [];
    if (!almacenOrigen) return destinosBase;
    return destinosBase.filter((s) => String(s.id) !== String(almacenOrigen));
  }, [destinosBase, almacenOrigen]);

  const handleCantidadChange = (productoId: string, value: number, stock: number) => {
    const n = Number.isFinite(value) ? value : 0;
    const safe = Math.min(Math.max(0, Math.trunc(n)), stock); // enteros [0..stock]
    setCantidades((prev) => ({ ...prev, [productoId]: safe }));
  };

  const validarAntesDeEnviar = (): boolean => {
    // 1) Productos deben pertenecer a la misma sede
    if (!origenInferido) {
      notify('Todos los productos deben pertenecer a la misma sede de origen.', 'error');
      return false;
    }
    // 2) Sedes válidas
    if (!almacenOrigen || !almacenDestino || almacenOrigen === almacenDestino) {
      notify('Selecciona sedes válidas (origen y destino distintos).', 'error');
      return false;
    }
    // 3) Origen seleccionado debe coincidir con el inferido
    if (almacenOrigen !== origenInferido) {
      notify('La sede de origen no coincide con los productos seleccionados.', 'error');
      return false;
    }
    // 4) Cantidades válidas
    const productosMov = productosSeleccionados
      .filter((p) => (cantidades[p.uuid] ?? 0) > 0)
      .map((p) => ({ id: p.id, uuid: p.uuid, stock: p.stock, q: cantidades[p.uuid] }));

    if (productosMov.length === 0) {
      notify('Debes ingresar al menos una cantidad válida.', 'error');
      return false;
    }
    const fueraDeRango = productosMov.find((x) => x.q < 0 || x.q > x.stock);
    if (fueraDeRango) {
      notify('Hay cantidades fuera de rango respecto al stock.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validarAntesDeEnviar()) return;

    const productosMov = productosSeleccionados
      .filter((p) => (cantidades[p.uuid] ?? 0) > 0)
      .map((p) => ({ producto_id: p.id, cantidad: cantidades[p.uuid] }));

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
      // Reset suave tras éxito
      setCantidades({});
      setDescripcion('');
      setAlmacenDestino('');
      setAlmacenOrigen('');
      onClose();
    } catch (err) {
      console.error(err);
      notify('Error al registrar el movimiento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Etiqueta legible para sede (incluye origen de entidad si viene)
  const renderSedeLabel = (s: Almacenamiento) => {
    const rep = s.representante
      ? ` — ${s.representante.nombres} ${s.representante.apellidos}`
      : '';
    const tag =
      s.entidad?.tipo === 'ecommerce'
        ? ' [ECOM]'
        : s.entidad?.tipo === 'courier'
        ? ' [COURIER]'
        : '';
    return `${s.nombre_almacen}${rep}${tag}`;
  };

  if (!open) return null;

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

        {/* Tabla */}
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
                  <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                    {prod.codigo_identificacion}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                    {prod.nombre_producto}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <div className="line-clamp-2 leading-5 break-words">{prod.descripcion}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="ml-auto flex w-full justify-end items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        step={1}
                        min={0}
                        max={prod.stock}
                        value={Number.isFinite(cantidades[prod.uuid]) ? cantidades[prod.uuid] : ''}
                        onChange={(e) =>
                          handleCantidadChange(prod.uuid, Number(e.target.value), prod.stock)
                        }
                        className="w-[64px] h-9 rounded-lg border border-gray-300 px-2 text-center text-sm shadow-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">/ {prod.stock}</span>
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
            <Selectx
              label="Sede Origen"
              name="almacen_origen"
              labelVariant="left"
              value={almacenOrigen ?? ''}
              onChange={(e) => setAlmacenOrigen(e.target.value)}
              placeholder="Seleccionar sede"
              // disabled={Boolean(origenInferido)} // si quieres impedir cambiarla cuando está inferida
            >
              <option value="">Seleccionar sede</option>
              {sedesOrigen.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {renderSedeLabel(s)}
                </option>
              ))}
            </Selectx>

            <Selectx
              label="Sede Destino"
              name="almacen_destino"
              labelVariant="left"
              value={almacenDestino ?? ''}
              onChange={(e) => setAlmacenDestino(e.target.value)}
              placeholder="Seleccionar sede"
            >
              <option value="">Seleccionar sede</option>
              {destinosFiltrados.length === 0 ? (
                <option value="" disabled>
                  {almacenOrigen
                    ? 'No hay sedes asociadas del courier distintas del origen.'
                    : 'No hay sedes asociadas disponibles.'}
                </option>
              ) : (
                destinosFiltrados.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {renderSedeLabel(s)}
                  </option>
                ))
              )}
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
            disabled={
              loading ||
              !origenInferido || // debe existir un origen consistente
              !almacenOrigen ||
              !almacenDestino ||
              almacenOrigen === almacenDestino
            }
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
