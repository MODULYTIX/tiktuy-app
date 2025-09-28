import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { crearProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { fetchAlmacenes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Almacenamiento } from '@/services/ecommerce/almacenamiento/almacenamiento.types';
import { Inputx, InputxNumber, InputxTextarea } from '@/shared/common/Inputx';
import { Selectx } from '@/shared/common/Selectx';
import Tittlex from '@/shared/common/Tittlex';
import Buttonx from '@/shared/common/Buttonx';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Llama a esto para refrescar la tabla en el padre */
  onCreated?: (producto: Producto) => void;
};

type EstadoId = 'activo' | 'inactivo' | 'descontinuado';
type EstadoOption = { id: EstadoId; nombre: string };

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
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
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
      <div className="w-full max-w-md bg-white shadow-lg h-full flex flex-col gap-5 px-5 py-5">
        <Tittlex
          variant="modal"
          icon="vaadin:stock" // pon aquí el nombre del ícono de Iconify que prefieras
          title="REGISTRAR NUEVO PRODUCTO"
          description="Registra un nuevo producto en tu inventario especificando su información básica, ubicación en almacén y condiciones de stock."
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
              value={form.estado || ""} // 👈 "" para que se vea el placeholder si no hay selección
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

            <div className="flex flex-col-2 gap-5">
              {/* Precio: 2 decimales */}
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

              {/* Cantidad: entero */}
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

            <div className="flex flex-col-2 gap-5">
              {/* Stock mínimo: entero */}
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

              {/* Peso: 3 decimales */}
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
              onClick={() => { }} // mantiene el submit por estar dentro del <form>
              label={saving ? "Creando…" : "Crear nuevo"}
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