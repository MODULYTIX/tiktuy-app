// src/shared/components/ecommerce/stock/ProductoEditarModal.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { actualizarProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import Tittlex from '@/shared/common/Tittlex';
import { Inputx, InputxNumber, InputxTextarea } from '@/shared/common/Inputx';
import { Selectx } from '@/shared/common/Selectx';
import Buttonx from '@/shared/common/Buttonx';

type Props = {
  open: boolean;
  onClose: () => void;
  initialData: Producto | null;
  onUpdated?: (producto: Producto) => void;
};

type EstadoId = 'activo' | 'inactivo' | 'descontinuado';
type EstadoOption = { id: EstadoId; nombre: string };

const ESTADO_OPCIONES: EstadoOption[] = [
  { id: 'activo', nombre: 'Activo' },
  { id: 'inactivo', nombre: 'Inactivo' },
  { id: 'descontinuado', nombre: 'Descontinuado' },
];

function normalizarEstado(value: unknown): EstadoId {
  if (!value) return 'activo';
  if (typeof value === 'string') {
    const k = value.toLowerCase().trim();
    if (k === 'activo' || k === 'inactivo' || k === 'descontinuado') return k as EstadoId;
  }
  if (typeof value === 'object' && value) {
    const v = value as any;
    if (typeof v.id === 'string') return normalizarEstado(v.id);
    if (typeof v.nombre === 'string') return normalizarEstado(v.nombre);
    if (typeof v.estado === 'string') return normalizarEstado(v.estado);
  }
  return 'activo';
}

type FormState = {
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string;
  categoria_id: string;
  almacenamiento_id: string;
  precio: string;
  stock: string;
  stock_minimo: string;
  peso: string;
  estado: EstadoId;
  fecha_registro: string;
};

export default function ProductoEditarModal({ open, onClose, initialData, onUpdated }: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    codigo_identificacion: '',
    nombre_producto: '',
    descripcion: '',
    categoria_id: '',
    almacenamiento_id: '',
    precio: '',
    stock: '',
    stock_minimo: '',
    peso: '',
    estado: 'activo',
    fecha_registro: new Date().toISOString(),
  });

  useEffect(() => {
    if (!token || !open) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
    fetchAlmacenes(token).then(setAlmacenes).catch(console.error);
  }, [token, open]);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        codigo_identificacion: String((initialData as any).codigo_identificacion ?? ''),
        nombre_producto: String((initialData as any).nombre_producto ?? ''),
        descripcion: String((initialData as any).descripcion ?? ''),
        categoria_id: String((initialData as any).categoria_id ?? ''),
        almacenamiento_id: String((initialData as any).almacenamiento_id ?? ''),
        precio: String((initialData as any).precio ?? ''),
        stock: String((initialData as any).stock ?? ''),
        stock_minimo: String((initialData as any).stock_minimo ?? ''),
        peso: String((initialData as any).peso ?? ''),
        estado: normalizarEstado((initialData as any).estado?.nombre ?? (initialData as any).estado),
        fecha_registro: String((initialData as any).fecha_registro ?? new Date().toISOString()),
      });
    }
  }, [initialData, open]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => onClose();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !initialData || saving) return;

    const precio = form.precio === '' ? undefined : parseFloat(form.precio);
    const stock = form.stock === '' ? undefined : parseInt(form.stock);
    const stock_minimo = form.stock_minimo === '' ? undefined : parseInt(form.stock_minimo);
    const peso = form.peso === '' ? undefined : parseFloat(form.peso);

    setSaving(true);

    // Omitimos campos conflictivos y definimos los que sí enviamos
    type Payload = Omit<
      Partial<Producto>,
      'estado' | 'categoria_id' | 'almacenamiento_id' | 'precio' | 'stock' | 'stock_minimo' | 'peso' | 'fecha_registro'
    > & {
      estado?: EstadoId;
      categoria_id?: number;
      almacenamiento_id?: number;
      precio?: number;
      stock?: number;
      stock_minimo?: number;
      peso?: number;
      fecha_registro?: string;
    };

    const payload: Payload = {
      nombre_producto: form.nombre_producto?.trim(),
      descripcion: form.descripcion?.trim(),
      codigo_identificacion: form.codigo_identificacion?.trim(),
      categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined,
      almacenamiento_id: form.almacenamiento_id ? Number(form.almacenamiento_id) : undefined,
      precio: typeof precio === 'number' && !Number.isNaN(precio) ? precio : undefined,
      stock: typeof stock === 'number' && !Number.isNaN(stock) ? stock : undefined,
      stock_minimo: typeof stock_minimo === 'number' && !Number.isNaN(stock_minimo) ? stock_minimo : undefined,
      peso: typeof peso === 'number' && !Number.isNaN(peso) ? peso : undefined,
      estado: form.estado,
      // fecha_registro: new Date(form.fecha_registro).toISOString(), // habilítalo si se edita la fecha
    };

    try {
      // Cast puntual para cumplir la firma sin tocar tu API ni la lógica
      const producto = await actualizarProducto(
        (initialData as any).uuid,
        (payload as unknown as Partial<Producto>),
        token
      );
      onUpdated?.(producto);
      onClose();
    } catch (err) {
      console.error('Error al actualizar producto:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !initialData) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={handleClose} />
      <div className="w-full max-w-md bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5">
        <Tittlex
          variant="modal"
          icon="mdi:pencil-outline"
          title="EDITAR PRODUCTO"
          description="Actualiza la información de un producto existente en tu inventario modificando sus datos básicos, ubicación en almacén y condiciones de stock."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
          <div className="h-full flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-5">
              <Inputx
                name="codigo_identificacion"
                label="Código"
                value={form.codigo_identificacion}
                readOnly
                disabled={saving}
                type="text"
              />

              <Inputx
                name="nombre_producto"
                label="Nombre del Producto"
                placeholder="Ejem. Zapatos de Cuero"
                value={form.nombre_producto}
                onChange={handleChange}
                required
                disabled={saving}
                type="text"
              />
            </div>

            <InputxTextarea
              name="descripcion"
              label="Descripción"
              value={form.descripcion}
              onChange={handleChange}
              disabled={saving}
              placeholder="Describe el producto…"
              autoResize
              minRows={3}
              maxRows={8}
            />

            <Selectx
              label="Categoría"
              name="categoria_id"
              labelVariant="left"
              value={form.categoria_id}
              onChange={handleChange}
              placeholder="Seleccionar categoría"
              required
              disabled={saving}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.descripcion}
                </option>
              ))}
            </Selectx>

            <Selectx
              label="Almacén"
              name="almacenamiento_id"
              labelVariant="left"
              value={form.almacenamiento_id}
              onChange={handleChange}
              placeholder="Seleccionar almacén"
              required
              disabled={saving}
            >
              {almacenes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_almacen}
                </option>
              ))}
            </Selectx>

            <Selectx
              label="Estado"
              labelVariant="left"
              value={form.estado}
              onChange={(e) =>
                setForm((p) => ({ ...p, estado: e.target.value as EstadoId }))
              }
              placeholder="Seleccionar estado"
              disabled={saving}
            >
              {ESTADO_OPCIONES.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre}
                </option>
              ))}
            </Selectx>

            <div className="grid grid-cols-2 gap-5">
              <InputxNumber
                label="Precio"
                name="precio"
                value={form.precio}
                onChange={handleChange}
                decimals={2}
                step={0.01}
                min={0}
                placeholder="0.00"
                disabled={saving}
              />

              <InputxNumber
                label="Cantidad"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                decimals={0}
                step={1}
                min={0}
                placeholder="0"
                inputMode="numeric"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <InputxNumber
                label="Stock Mínimo"
                name="stock_minimo"
                value={form.stock_minimo}
                onChange={handleChange}
                decimals={0}
                step={1}
                min={0}
                placeholder="0"
                inputMode="numeric"
                disabled={saving}
              />

              <InputxNumber
                label="Peso (kg)"
                name="peso"
                value={form.peso}
                onChange={handleChange}
                decimals={3}
                step={0.001}
                min={0}
                placeholder="0.000"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Buttonx
              variant="quartery"
              disabled={saving}
              onClick={() => { }}
              label={saving ? "Guardando…" : "Guardar cambios"}
              icon={saving ? "line-md:loading-twotone-loop" : undefined}
              className={`px-4 text-sm ${saving ? "[&_svg]:animate-spin" : ""}`}
            />

            <Buttonx
              variant="outlinedw"
              onClick={handleClose}
              label="Cancelar"
              className="px-4 text-sm border"
              disabled={saving}
            />
          </div>

        </form>
      </div>
    </div>
  );
}