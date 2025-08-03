import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { crearProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';
import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { HiOutlineViewGridAdd } from 'react-icons/hi';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (producto: Producto) => void;
  initialData?: Producto | null;
}

// Generador de código con fecha y hora (10 dígitos) + aleatorio (5 dígitos)
function generarCodigoConFecha(): string {
  const now = new Date();

  const hora = String(now.getHours()).padStart(2, '0');     // 23
  const minutos = String(now.getMinutes()).padStart(2, '0'); // 21
  const year = String(now.getFullYear()).slice(2);           // 25

  const meses = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];
  const mesAbrev = meses[now.getMonth()]; // JUL

  const charset = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789';
  const aleatorio = charset[Math.floor(Math.random() * charset.length)];

  return `${hora}${mesAbrev}${year}${aleatorio}${minutos}`;
}


export default function ProductoFormModal({
  open,
  onClose,
  onCreated,
  initialData,
}: Props) {
  const { token } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacenamiento[]>([]);

  const [form, setForm] = useState({
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
    if (initialData) {
      setForm({
        codigo_identificacion: initialData.codigo_identificacion,
        nombre_producto: initialData.nombre_producto,
        descripcion: initialData.descripcion ?? '',
        categoria_id: String(initialData.categoria_id),
        almacenamiento_id: String(initialData.almacenamiento_id),
        precio: String(initialData.precio),
        stock: String(initialData.stock),
        stock_minimo: String(initialData.stock_minimo),
        peso: String(initialData.peso),
        estado: initialData.estado,
        fecha_registro: initialData.fecha_registro,
      });
    } else {
      setForm((prev) => ({
        ...prev,
        codigo_identificacion: generarCodigoConFecha(),
      }));
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!token) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
    fetchAlmacenes(token).then(setAlmacenes).catch(console.error);
  }, [token]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      categoria_id: Number(form.categoria_id),
      almacenamiento_id: Number(form.almacenamiento_id),
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock),
      stock_minimo: parseInt(form.stock_minimo),
      peso: parseFloat(form.peso),
    };

    try {
      const producto = await crearProducto(data, token!);
      onCreated(producto);
      onClose();
    } catch (error) {
      console.error('Error al crear producto:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div className="w-full max-w-md bg-white shadow-lg h-full p-6 overflow-y-auto transition-transform duration-300">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HiOutlineViewGridAdd />
          <span>{initialData ? 'EDITAR PRODUCTO' : 'REGISTRAR NUEVO PRODUCTO'}</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {initialData
            ? 'Modifica la información del producto existente en tu inventario.'
            : 'Registra un nuevo producto en tu inventario especificando su información básica, ubicación en almacén y condiciones de stock.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="codigo_identificacion"
              label="Código"
              value={form.codigo_identificacion}
              onChange={handleChange}
              placeholder="Auto-generado"
              required
              readOnly={!initialData}
            />
            <Input
              name="nombre_producto"
              label="Nombre del Producto"
              value={form.nombre_producto}
              onChange={handleChange}
              placeholder="Ej. Zapatos de Cuero"
              required
            />
          </div>

          <Textarea
            name="descripcion"
            label="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Ej. Zapato de vestir, tipo Oxford"
          />

          <Select<Categoria, 'descripcion'>
            name="categoria_id"
            label="Categoría"
            value={form.categoria_id}
            onChange={handleChange}
            options={categorias}
            optionLabel="descripcion"
            required
          />

          <Select<Almacenamiento, 'nombre_almacen'>
            name="almacenamiento_id"
            label="Almacén"
            value={form.almacenamiento_id}
            onChange={handleChange}
            options={almacenes}
            optionLabel="nombre_almacen"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="precio"
              label="Precio"
              type="number"
              step="0.01"
              value={form.precio}
              onChange={handleChange}
              placeholder="Ej. 50.20"
              required
            />
            <Input
              name="stock"
              label="Cantidad"
              type="number"
              value={form.stock}
              onChange={handleChange}
              placeholder="Ej. 50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              name="stock_minimo"
              label="Stock Mínimo"
              type="number"
              value={form.stock_minimo}
              onChange={handleChange}
              placeholder="Ej. 10"
              required
            />
            <Input
              name="peso"
              label="Peso"
              type="number"
              step="0.01"
              value={form.peso}
              onChange={handleChange}
              placeholder="Ej. 450 gr."
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 text-sm rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 text-sm rounded hover:opacity-90"
            >
              {initialData ? 'Guardar cambios' : 'Crear nuevo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Input reusable
function Input({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        {...rest}
        className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// Textarea reusable
function Textarea({
  label,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <textarea
        {...rest}
        className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// Select reusable
function Select<T extends { id: number }, K extends keyof T>({
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
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <select
        {...rest}
        className="border border-gray-300 px-3 py-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Seleccionar</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {String(opt[optionLabel])}
          </option>
        ))}
      </select>
    </div>
  );
}
