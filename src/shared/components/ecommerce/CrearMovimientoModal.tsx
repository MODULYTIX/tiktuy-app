// src/shared/components/ecommerce/movimientos/CrearMovimientoModal.tsx
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
  const [almacenOrigen, setAlmacenOrigen] = useState<string>('');
  const [almacenDestino, setAlmacenDestino] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !token) return;

    fetchSedesConRepresentante(token)
      .then((data) => {
        const list: Almacenamiento[] = Array.isArray(data) ? data : [];
        setSedesOrigen(list);
        setSedesDestino(list);
      })
      .catch(console.error);

    fetchProductos(token)
      .then((rows: any) => {
        const list: Producto[] = Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : [];
        setProductos(list);
      })
      .catch(console.error);

    setCantidades({});
    setDescripcion('');
    setAlmacenDestino('');
    setAlmacenOrigen('');
  }, [open, token]);

  const productosSeleccionados = useMemo(
    () => productos.filter((p) => selectedProducts.includes(p.uuid)),
    [productos, selectedProducts]
  );

  const origenInferido = useMemo(() => {
    const almacenIds = productosSeleccionados
      .map((p) => (p.almacenamiento_id != null ? String(p.almacenamiento_id) : ''))
      .filter(Boolean);
    if (almacenIds.length === 0) return '';
    const first = almacenIds[0];
    return almacenIds.every((id) => id === first) ? first : '';
  }, [productosSeleccionados]);

  useEffect(() => {
    if (origenInferido) {
      setAlmacenOrigen(origenInferido);
      setAlmacenDestino((d) => (d === origenInferido ? '' : d));
    }
  }, [origenInferido]);

  const esSedeAsociada = (s: Almacenamiento) => s?.entidad?.tipo === 'courier' || !!s?.courier_id;

  const destinosBase = useMemo(() => {
    const base = (sedesDestino?.length ? sedesDestino : sedesOrigen) || [];
    return base.filter(esSedeAsociada);
  }, [sedesDestino, sedesOrigen]);

  const destinosFiltrados = useMemo(() => {
    if (!destinosBase.length) return [];
    if (!almacenOrigen) return destinosBase;
    return destinosBase.filter((s) => String(s.id) !== String(almacenOrigen));
  }, [destinosBase, almacenOrigen]);

  const handleCantidadChange = (uuid: string, value: number, stock: number) => {
    const n = Number.isFinite(value) ? value : 0;
    const safe = Math.min(Math.max(0, Math.trunc(n)), stock);
    setCantidades((prev) => ({ ...prev, [uuid]: safe }));
  };

  const validarAntesDeEnviar = () => {
    if (!origenInferido) {
      notify('Todos los productos deben pertenecer a la misma sede de origen.', 'error');
      return false;
    }
    if (!almacenOrigen || !almacenDestino || almacenOrigen === almacenDestino) {
      notify('Selecciona sedes válidas (origen y destino distintos).', 'error');
      return false;
    }
    if (almacenOrigen !== origenInferido) {
      notify('La sede de origen no coincide con los productos seleccionados.', 'error');
      return false;
    }
    const prods = productosSeleccionados
      .filter((p) => (cantidades[p.uuid] ?? 0) > 0)
      .map((p) => ({ id: p.id, q: cantidades[p.uuid], stock: p.stock }));
    if (prods.length === 0) {
      notify('Debes ingresar al menos una cantidad válida.', 'error');
      return false;
    }
    if (prods.find((x) => x.q < 0 || x.q > x.stock)) {
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
      setCantidades({});
      setDescripcion('');
      setAlmacenDestino('');
      setAlmacenOrigen('');
      onClose();
    } catch (e) {
      console.error(e);
      notify('Error al registrar el movimiento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderSedeLabel = (s: Almacenamiento) => {
    const rep = s.representante ? ` — ${s.representante.nombres} ${s.representante.apellidos}` : '';
    const tag = s.entidad?.tipo === 'ecommerce' ? ' [ECOM]' : s.entidad?.tipo === 'courier' ? ' [COURIER]' : '';
    return `${s.nombre_almacen}${rep}${tag}`;
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
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

        {/* ===== Tabla única (header + body juntos) ===== */}
        <div className="rounded-md border border-gray-200 overflow-x-auto bg-white">
          <table className="min-w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[28%]" />
              <col className="w-[34%]" />
              <col className="w-[20%]" />
            </colgroup>

            <thead className="bg-[#E5E7EB]">
              <tr className="text-gray-700 font-roboto font-medium">
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {productosSeleccionados.map((p) => (
                <tr key={p.uuid} className="hover:bg-gray-50 transition-colors">
                  {/* Código */}
                  <td className="px-4 py-4 text-gray-900 whitespace-nowrap">
                    {p.codigo_identificacion}
                  </td>

                  {/* Producto — 1 línea con “…” */}
                  <td className="px-4 py-4 text-gray-900">
                    <div className="min-w-0">
                      <span
                        className="w-full overflow-hidden text-ellipsis line-clamp-1"
                        title={p.nombre_producto ?? undefined}
                      >
                        {p.nombre_producto ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Descripción — 1 línea con “…” */}
                  <td className="px-4 py-4 text-gray-700">
                    <div className="min-w-0">
                      <span
                        className="w-full overflow-hidden text-ellipsis line-clamp-1"
                        title={p.descripcion ?? undefined}
                      >
                        {p.descripcion ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="px-4 py-4">
                    <div className="ml-auto flex w-full justify-center items-center gap-2">
                      <input
                        aria-label={`Cantidad para ${p.nombre_producto ?? 'producto'}`}
                        type="number"
                        inputMode="numeric"
                        step={1}
                        min={0}
                        max={p.stock}
                        value={Number.isFinite(cantidades[p.uuid]) ? cantidades[p.uuid] : ''}
                        onChange={(e) => handleCantidadChange(p.uuid, Number(e.target.value), p.stock)}
                        className="w-[64px] h-9 rounded-lg border border-gray-300 px-2 text-center text-sm shadow-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                      <span className="text-sm text-gray-600 whitespace-nowrap">/ {p.stock}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {productosSeleccionados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                    No hay productos seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Datos adicionales ===== */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <Selectx
              label="Sede Origen"
              name="almacen_origen"
              labelVariant="left"
              value={almacenOrigen ?? ''}
              onChange={(e) => setAlmacenOrigen(e.target.value)}
              placeholder="Seleccionar sede"
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
              !origenInferido ||
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
