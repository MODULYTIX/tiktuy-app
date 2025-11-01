import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { crearProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';

// 👇 ahora listamos SEDES
import { fetchSedes } from '@/services/ecommerce/almacenamiento/almacenamiento.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';
import type { Sede } from '@/services/ecommerce/almacenamiento/almacenamiento.types';

import { Inputx, InputxNumber, InputxTextarea } from '@/shared/common/Inputx';
import Tittlex from '@/shared/common/Tittlex';
import Buttonx from '@/shared/common/Buttonx';
import { SelectxCreatable, type CreatableOption } from '@/shared/common/SelectxCreatable';

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

type CreateProductoPayload =
  | ({
      categoria_id: number;
      categoria?: undefined;
    } & BasePayload)
  | ({
      categoria?: {
        nombre: string;
        descripcion?: string | null;
        es_global: true;
      };
      categoria_id?: undefined;
    } & BasePayload);

type BasePayload = {
  almacenamiento_id: number; // <- se mantiene igual para backend
  precio: number;
  stock: number;
  stock_minimo: number;
  peso: number;
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string;
  estado: 'activo' | 'inactivo' | 'descontinuado';
  fecha_registro: string;
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
  categoriaInput: string;
  categoriaSelectedId: string;
  almacenamiento_id: string; // <- id de la sede seleccionada
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
  categoriaInput: '',
  categoriaSelectedId: '',
  almacenamiento_id: '',
  precio: '',
  stock: '',
  stock_minimo: '',
  peso: '',
  estado: 'activo',
  fecha_registro: new Date().toISOString(),
});

function canonical(s: string) {
  return s.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
}

export default function ProductoCrearModal({ open, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(getInitialForm());
  const formRef = useRef<HTMLFormElement | null>(null);

  // Imagen local (frontend only)
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !open) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
    // 👇 ahora listamos SEDES desde /almacenes
    fetchSedes(token).then(setSedes).catch(console.error);
  }, [token, open]);

  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
      setImagenFile(null);
      setImagenPreview(null);
    }
  }, [open]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm(getInitialForm());
    setImagenFile(null);
    setImagenPreview(null);
    onClose();
  };

  const catOptions: CreatableOption[] = categorias
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    .map(c => ({ id: c.id, label: c.nombre }));

  function onCategoriaInputChange(v: string) {
    setForm(p => {
      const match = catOptions.find(o => canonical(o.label) === canonical(v));
      return { ...p, categoriaInput: v, categoriaSelectedId: match ? String(match.id) : '' };
    });
  }

  function onCategoriaSelect(opt: CreatableOption) {
    setForm(p => ({ ...p, categoriaInput: opt.label, categoriaSelectedId: String(opt.id) }));
  }

  function onCategoriaCreate(value: string) {
    setForm(p => ({ ...p, categoriaInput: value, categoriaSelectedId: '' }));
  }

  function onImagenChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImagenFile(f);
    const url = URL.createObjectURL(f);
    setImagenPreview(url);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;
    if (!form.almacenamiento_id) return;

    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock);
    const stock_minimo = parseInt(form.stock_minimo);
    const peso = parseFloat(form.peso);
    if ([precio, stock, stock_minimo, peso].some(n => Number.isNaN(n))) return;

    let payload: CreateProductoPayload;

    if (form.categoriaSelectedId) {
      payload = {
        categoria_id: Number(form.categoriaSelectedId),
        almacenamiento_id: Number(form.almacenamiento_id), // <- id de Sede
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
    } else {
      if (!form.categoriaInput.trim()) return;
      payload = {
        categoria: {
          nombre: form.categoriaInput.trim(),
          descripcion: null,
          es_global: true as const,
        },
        almacenamiento_id: Number(form.almacenamiento_id), // <- id de Sede
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
    }

    setSaving(true);
    try {
      // (La imagen NO se envía aún; solo preview local)
      const producto = await crearProducto(payload as unknown as Partial<Producto>, token);
      if (!form.categoriaSelectedId && (producto as any)?.categoria) {
        const nueva = (producto as any).categoria as Categoria;
        setCategorias(prev => {
          const dup = prev.some(c => canonical(c.nombre) === canonical(nueva.nombre));
          return dup ? prev : [...prev, nueva];
        });
      }
      onCreated?.(producto);
      setForm(getInitialForm());
      setImagenFile(null);
      setImagenPreview(null);
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
      {/* Contenedor lateral: habilitamos scroll del contenido */}
      <div className="w-full max-w-md bg-white shadow-lg h-full flex flex-col px-5 py-5">
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="REGISTRAR NUEVO PRODUCTO"
          description="Registra un nuevo producto en tu inventario especificando su información básica, ubicación en almacén y condiciones de stock."
        />

        {/* Área con scroll */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-5 overflow-y-auto min-h-0"
        >
          <div className="flex flex-col gap-5">
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

            <SelectxCreatable
              label="Categoría"
              labelVariant="left"
              placeholder="Escribe para buscar o crear…"
              inputValue={form.categoriaInput}
              selectedId={form.categoriaSelectedId}
              options={catOptions}
              disabled={saving}
              required
              onInputChange={onCategoriaInputChange}
              onSelectOption={onCategoriaSelect}
              onCreateFromInput={onCategoriaCreate}
            />

            {/* ---- Sede ---- */}
            <div>
              <label className="block text-base font-normal text-gray90 text-left">Sede</label>
              <div className="relative">
                <select
                  name="almacenamiento_id"
                  value={form.almacenamiento_id}
                  onChange={(e) => setForm(p => ({ ...p, almacenamiento_id: e.target.value }))}
                  className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white
                    ${!form.almacenamiento_id ? 'text-gray-500' : 'text-gray90'}
                    placeholder:text-gray-300 font-roboto text-sm appearance-none pr-9
                    focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-gray-300`}
                  required
                  disabled={saving}
                >
                  <option value="" disabled hidden>
                    Seleccionar sede
                  </option>
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre_sede}{s.es_principal ? ' (Principal)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ---- Estado + Imagen (mitad y mitad) ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Col 1: Estado */}
              <div>
                <label className="block text-base font-normal text-gray90 text-left">Estado</label>
                <div className="relative">
                  <select
                    value={form.estado}
                    onChange={(e) => setForm(p => ({ ...p, estado: e.target.value as EstadoId }))}
                    className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white
                      ${!form.estado ? 'text-gray-500' : 'text-gray90'}
                      placeholder:text-gray-300 font-roboto text-sm appearance-none pr-9
                      focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-gray-300`}
                    disabled={saving}
                  >
                    {ESTADO_OPCIONES.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Col 2: Imagen local (frontend) */}
              <div>
                <label className="block text-base font-normal text-gray90 text-left">Imagen</label>
                <div className="border border-gray-300 rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      id="file-imagen-producto"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onImagenChange}
                      disabled={saving}
                    />
                    <label
                      htmlFor="file-imagen-producto"
                      className="inline-flex items-center gap-2 px-3 h-9 rounded-md bg-gray-100 text-sm cursor-pointer hover:bg-gray-200"
                    >
                      <span className="i-tabler-upload w-4 h-4" />
                      Subir imagen
                    </label>

                    {imagenFile ? (
                      <span className="text-xs text-gray-600 truncate">
                        {imagenFile.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">PNG, JPG…</span>
                    )}
                  </div>

                  {/* Preview */}
                  {imagenPreview && (
                    <div className="mt-3">
                      <img
                        src={imagenPreview}
                        alt="Vista previa"
                        className="w-full h-40 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Números ---- */}
            <div className="flex flex-col-2 gap-5">
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

            <div className="flex flex-col-2 gap-5">
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

          {/* ---- BOTONES (zona fija abajo, fuera del scroll) ---- */}
          <div className="sticky bottom-0 bg-white pt-2 pb-0 flex items-center gap-5">
            <Buttonx
              type="submit"
              variant="quartery"
              disabled={saving}
              label={saving ? 'Creando…' : 'Crear nuevo'}
              icon={saving ? 'line-md:loading-twotone-loop' : 'tabler:cube-plus'}
              className={`px-4 text-sm ${saving ? '[&_svg]:animate-spin' : ''}`}
            />
            <Buttonx
              type="button"
              variant="tertiary"
              onClick={handleClose}
              disabled={saving}
              label="Salir"
              icon=""
              className="px-4 text-sm text-gray-600 bg-gray-200 "
            />
          </div>
        </form>
      </div>
    </div>
  );
}
