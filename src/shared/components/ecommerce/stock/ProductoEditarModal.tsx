// src/shared/components/ecommerce/stock/ProductoEditarModal.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { HiOutlinePencil } from 'react-icons/hi';
import { actualizarProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

type Props = {
  open: boolean;
  onClose: () => void;
  initialData: Producto | null;
  onUpdated?: (producto: Producto) => void;
};

type EstadoKey = 'activo' | 'inactivo' | 'descontinuado';
type EstadoOption = { id: EstadoKey; nombre: string };

const ESTADO_OPCIONES: EstadoOption[] = [
  { id: 'activo', nombre: 'Activo' },
  { id: 'inactivo', nombre: 'Inactivo' },
  { id: 'descontinuado', nombre: 'Descontinuado' },
];

function normalizarEstado(value: unknown): EstadoKey {
  if (!value) return 'activo';
  if (typeof value === 'string') {
    const k = value.toLowerCase().trim();
    if (k === 'activo' || k === 'inactivo' || k === 'descontinuado') return k as EstadoKey;
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
  estado: EstadoKey;
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
      estado?: EstadoKey;
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
      <div className="w-full max-w-md bg-white shadow-lg h-full p-6 overflow-y-auto">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HiOutlinePencil />
          EDITAR PRODUCTO
        </h2>
        <p className="text-sm text-gray-500 mt-1">Modifica la información del producto existente.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input name="codigo_identificacion" label="Código" value={form.codigo_identificacion} readOnly disabled={saving} />
            <Input name="nombre_producto" label="Nombre del Producto" value={form.nombre_producto} onChange={handleChange} required disabled={saving} />
          </div>

          <Textarea name="descripcion" label="Descripción" value={form.descripcion} onChange={handleChange} disabled={saving} />

          <SelectNative<Categoria, 'descripcion'>
            name="categoria_id"
            label="Categoría"
            value={form.categoria_id}
            onChange={handleChange}
            options={categorias}
            optionLabel="descripcion"
            required
            disabled={saving}
          />

          <SelectNative<Almacenamiento, 'nombre_almacen'>
            name="almacenamiento_id"
            label="Almacén"
            value={form.almacenamiento_id}
            onChange={handleChange}
            options={almacenes}
            optionLabel="nombre_almacen"
            required
            disabled={saving}
          />

          <EstadoSelect
            label="Estado"
            value={form.estado}
            options={ESTADO_OPCIONES}
            onChange={(estadoId) => setForm((p) => ({ ...p, estado: estadoId }))}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input name="precio" label="Precio" type="number" step="0.01" value={form.precio} onChange={handleChange} required disabled={saving} />
            <Input name="stock" label="Cantidad" type="number" value={form.stock} onChange={handleChange} required disabled={saving} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input name="stock_minimo" label="Stock Mínimo" type="number" value={form.stock_minimo} onChange={handleChange} required disabled={saving} />
            <Input name="peso" label="Peso" type="number" step="0.01" value={form.peso} onChange={handleChange} required disabled={saving} />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={handleClose} className="border px-4 py-2 text-sm rounded hover:bg-gray-50" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={`px-4 py-2 text-sm rounded text-white ${saving ? 'bg-gray-600' : 'bg-black hover:opacity-90'}`}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------ Reusables ------------- */

function Input({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input {...rest} className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}

function Textarea({
  label,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <textarea {...rest} className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}

function SelectNative<
  T extends { id: number },
  K extends keyof T & string
>({
  label,
  options,
  optionLabel,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: T[];
  optionLabel: K;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select {...rest} className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary">
        <option value="">Seleccionar</option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>
            {String(opt[optionLabel] ?? '')}
          </option>
        ))}
      </select>
    </div>
  );
}

function EstadoSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: EstadoKey;
  options: EstadoOption[];
  disabled?: boolean;
  onChange: (id: EstadoKey) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as EstadoKey)}
        disabled={disabled}
        className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((op) => (
          <option key={op.id} value={op.id}>
            {op.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
