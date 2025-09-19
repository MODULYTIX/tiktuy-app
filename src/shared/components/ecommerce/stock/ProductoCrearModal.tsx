import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { HiOutlineViewGridAdd } from 'react-icons/hi';
import { crearProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Llama a esto para refrescar la tabla en el padre */
  onCreated?: (producto: Producto) => void;
};

type EstadoOption = { id: 'activo' | 'inactivo' | 'descontinuado'; nombre: string };
const ESTADO_OPCIONES: EstadoOption[] = [
  { id: 'activo', nombre: 'Activo' },
  { id: 'inactivo', nombre: 'Inactivo' },
  { id: 'descontinuado', nombre: 'Descontinuado' },
];

type CreateProductoDto = {
  categoria_id: number;
  almacenamiento_id: number;
  precio: number;
  stock: number;
  stock_minimo: number;
  peso: number;
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string;
  estado: 'activo' | 'inactivo' | 'descontinuado';
  fecha_registro: string; // ISO
};

// Genera un código amigable (hora + mes abreviado + año + char + minutos)
function generarCodigoConFecha(): string {
  const now = new Date();
  const hora = String(now.getHours()).padStart(2, '0');
  const minutos = String(now.getMinutes()).padStart(2, '0');
  const year = String(now.getFullYear()).slice(2);
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const mesAbrev = meses[now.getMonth()];
  const charset = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789';
  const aleatorio = charset[Math.floor(Math.random() * charset.length)];
  return `${hora}${mesAbrev}${year}${aleatorio}${minutos}`;
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
  estado: 'activo' | 'inactivo' | 'descontinuado';
  fecha_registro: string;
};

const getInitialForm = (): FormState => ({
  codigo_identificacion: generarCodigoConFecha(),
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

/* --------------------- Componente --------------------- */
export default function ProductoCrearModal({ open, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);

  const [saving, setSaving] = useState(false); // para “Creando…”
  const [form, setForm] = useState<FormState>(getInitialForm());

  // Cargar cat/almacén al abrir y tener token
  useEffect(() => {
    if (!token || !open) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
    fetchAlmacenes(token).then(setAlmacenes).catch(console.error);
  }, [token, open]);

  // Reset COMPLETO cada vez que se abre el modal
  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
    }
  }, [open]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    // limpia al cerrar para no arrastrar valores al siguiente open
    setForm(getInitialForm());
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;

    // Validaciones simples de selects
    if (!form.categoria_id || !form.almacenamiento_id) return;
    // Evitar NaN
    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock);
    const stock_minimo = parseInt(form.stock_minimo);
    const peso = parseFloat(form.peso);
    if (Number.isNaN(precio) || Number.isNaN(stock) || Number.isNaN(stock_minimo) || Number.isNaN(peso)) return;

    setSaving(true);
    const payload: CreateProductoDto = {
      categoria_id: Number(form.categoria_id),
      almacenamiento_id: Number(form.almacenamiento_id),
      precio,
      stock,
      stock_minimo,
      peso,
      codigo_identificacion: form.codigo_identificacion.trim(),
      nombre_producto: form.nombre_producto.trim(),
      descripcion: form.descripcion.trim(),
      estado: form.estado,
      fecha_registro: new Date(form.fecha_registro).toISOString(),
    };

    try {
      const producto = await crearProducto(payload as unknown as Partial<Producto>, token);
      onCreated?.(producto); // ← refresca tabla en el padre
      // reset completo para la próxima apertura
      setForm(getInitialForm());
      onClose();
    } catch (err) {
      console.error('Error al crear producto:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={handleClose} />
      <div className="w-full max-w-md bg-white shadow-lg h-full p-6 overflow-y-auto">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HiOutlineViewGridAdd />
          REGISTRAR NUEVO PRODUCTO
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Registra un nuevo producto en tu inventario especificando su información básica.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="codigo_identificacion"
              label="Código"
              value={form.codigo_identificacion}
              readOnly
              disabled={saving}
            />
            <Input
              name="nombre_producto"
              label="Nombre del Producto"
              value={form.nombre_producto}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>

          <Textarea
            name="descripcion"
            label="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            disabled={saving}
          />

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
            <Input
              name="precio"
              label="Precio"
              type="number"
              step="0.01"
              value={form.precio}
              onChange={handleChange}
              required
              disabled={saving}
            />
            <Input
              name="stock"
              label="Cantidad"
              type="number"
              value={form.stock}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="stock_minimo"
              label="Stock Mínimo"
              type="number"
              value={form.stock_minimo}
              onChange={handleChange}
              required
              disabled={saving}
            />
            <Input
              name="peso"
              label="Peso"
              type="number"
              step="0.01"
              value={form.peso}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="border px-4 py-2 text-sm rounded hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 text-sm rounded text-white ${saving ? 'bg-gray-600' : 'bg-black hover:opacity-90'}`}
            >
              {saving ? 'Creando…' : 'Crear nuevo'}
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
  value: 'activo' | 'inactivo' | 'descontinuado';
  options: EstadoOption[];
  disabled?: boolean;
  onChange: (id: 'activo' | 'inactivo' | 'descontinuado') => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
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
