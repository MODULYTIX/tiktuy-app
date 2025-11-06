// src/shared/components/ecommerce/stock/ProductoEditarModal.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { actualizarProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';

import Tittlex from '@/shared/common/Tittlex';
import { Inputx, InputxNumber, InputxTextarea } from '@/shared/common/Inputx';
import Buttonx from '@/shared/common/Buttonx';
import {
  SelectxCreatable,
  type CreatableOption,
} from '@/shared/common/SelectxCreatable';
import { Icon } from '@iconify/react';

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

function canonical(s: string) {
  return s.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
}

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

  categoriaInput: string;     // texto libre
  categoriaSelectedId: string; // id seleccionado (si no se creará)

  precio: string;
  stock: string;
  stock_minimo: string;
  peso: string;
  estado: EstadoId;
  fecha_registro: string;

  // imagen
  imagen_url: string | null;  // la que ya tiene el producto (si hay)
};

function parseNum(input: string, decimals = 2): number | undefined {
  if (input === '' || input == null) return undefined;
  const n = Number(String(input).replace(',', '.'));
  if (!Number.isFinite(n)) return undefined;
  return Number(n.toFixed(decimals));
}

export default function ProductoEditarModal({
  open,
  onClose,
  initialData,
  onUpdated,
}: Props) {
  const { token } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [saving, setSaving] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  // Imagen (UI local)
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    codigo_identificacion: '',
    nombre_producto: '',
    descripcion: '',

    categoriaInput: '',
    categoriaSelectedId: '',

    precio: '',
    stock: '',
    stock_minimo: '',
    peso: '',
    estado: 'activo',
    fecha_registro: new Date().toISOString(),

    imagen_url: null,
  });

  // Cargar categorías cuando abre
  useEffect(() => {
    if (!token || !open) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
  }, [token, open]);

  // Hydrate con initialData al abrir
  useEffect(() => {
    if (!open || !initialData) return;

    setForm({
      codigo_identificacion: String(initialData.codigo_identificacion ?? ''),
      nombre_producto: String(initialData.nombre_producto ?? ''),
      descripcion: String(initialData.descripcion ?? ''),

      // si hay include categoria, hidratar ambos campos
      categoriaInput: initialData.categoria?.nombre ?? '',
      categoriaSelectedId: initialData.categoria_id ? String(initialData.categoria_id) : '',

      precio: initialData.precio != null ? String(initialData.precio) : '',
      stock: initialData.stock != null ? String(initialData.stock) : '',
      stock_minimo: initialData.stock_minimo != null ? String(initialData.stock_minimo) : '',
      peso: initialData.peso != null ? String(initialData.peso) : '',
      estado: normalizarEstado(initialData.estado?.nombre ?? initialData.estado),
      fecha_registro: String(initialData.fecha_registro ?? new Date().toISOString()),

      imagen_url: initialData.imagen_url ?? null,
    });

    // reset selección de archivo/preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open]);

  // liberar objectURL al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Opciones categoría (ordenadas)
  const catOptions: CreatableOption[] = useMemo(
    () =>
      categorias
        .slice()
        .sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        )
        .map((c) => ({ id: c.id, label: c.nombre })),
    [categorias]
  );

  // Handlers básicos
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  function onCategoriaInputChange(v: string) {
    setForm((p) => {
      const match = catOptions.find((o) => canonical(o.label) === canonical(v));
      return {
        ...p,
        categoriaInput: v,
        categoriaSelectedId: match ? String(match.id) : '',
      };
    });
  }
  function onCategoriaSelect(opt: CreatableOption) {
    setForm((p) => ({
      ...p,
      categoriaInput: opt.label,
      categoriaSelectedId: String(opt.id),
    }));
  }
  function onCategoriaCreate(value: string) {
    setForm((p) => ({ ...p, categoriaInput: value, categoriaSelectedId: '' }));
  }

  // Imagen (solo UI): seleccionar / ver / descargar / eliminar
  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setFile(f);
  }

  function onViewImage() {
    const url = previewUrl || form.imagen_url;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function onDownloadImage() {
    const url = previewUrl || form.imagen_url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imagen';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onDeleteImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    // marca intención de borrar en el submit
    setForm((p) => ({ ...p, imagen_url: null }));
  }  

  const handleClose = () => {
    // limpiar estado visual de imagen
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !initialData || saving) return;
  
    const payload: any = {
      codigo_identificacion: form.codigo_identificacion?.trim(),
      nombre_producto: form.nombre_producto?.trim(),
      descripcion: form.descripcion?.trim(),
      estado: form.estado,
      ...(form.categoriaSelectedId
        ? { categoria_id: Number(form.categoriaSelectedId) }
        : form.categoriaInput.trim()
        ? { categoria: { nombre: form.categoriaInput.trim(), descripcion: '', es_global: true } }
        : {}),
      ...(parseNum(form.precio, 2) !== undefined && { precio: parseNum(form.precio, 2) }),
      ...(parseNum(form.stock, 0) !== undefined && { stock: parseNum(form.stock, 0) }),
      ...(parseNum(form.stock_minimo, 0) !== undefined && { stock_minimo: parseNum(form.stock_minimo, 0) }),
      ...(parseNum(form.peso, 3) !== undefined && { peso: parseNum(form.peso, 3) }),
    };
  
    // ⬅️ Nuevo: subir imagen si la hay
    if (file) {
      payload.file = file;              // ↩ hace que actualizarProducto use FormData y envíe 'imagen'
    } else if (form.imagen_url === null) {
      payload.imagen_url_remove = true; // ↩ borrar imagen existente
    }
  
    setSaving(true);
    try {
      const updated = await actualizarProducto(initialData.uuid, payload, token);
      onUpdated?.(updated);
      handleClose();
    } catch (err) {
      console.error('Error al actualizar producto:', err);
    } finally {
      setSaving(false);
    }
  };
  

  if (!open || !initialData) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={handleClose} />

      {/* Panel (misma estética que crear) */}
      <div className="w-full max-w-2xl bg-white shadow-lg h-full flex flex-col">
        <div className="px-5 pt-5">
          <Tittlex
            variant="modal"
            icon="mdi:pencil-outline"
            title="EDITAR PRODUCTO"
            description="Actualiza la información del producto manteniendo su ubicación y condiciones de stock."
          />
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 pb-24"
        >
          <div className="flex flex-col gap-5">
            {/* Código / Nombre (igual que crear) */}
            <div className="grid grid-cols-2 gap-5">
              <Inputx
                name="codigo_identificacion"
                label="Código"
                value={form.codigo_identificacion}
                onChange={handleChange}
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

            {/* Descripción */}
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

            {/* Categoría (creatable) — mismo control que crear */}
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

            {/* Estado (igual que crear) */}
            <div>
              <label className="block text-base font-normal text-gray90 text-left">
                Estado
              </label>
              <div className="relative">
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, estado: e.target.value as EstadoId }))
                  }
                  className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white
                    ${!form.estado ? 'text-gray-500' : 'text-gray90'}
                    placeholder:text-gray-300 font-roboto text-sm appearance-none pr-9
                    focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-gray-300`}
                  disabled={saving}
                >
                  {ESTADO_OPCIONES.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subir imagen — MISMA FILA (sin “Título de la imagen”) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              <div className="sm:col-span-2">
                <label className="block text-base font-normal text-gray90 text-left">
                  Subir imagen
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white cursor-pointer hover:bg-gray-50">
                    <Icon icon="tabler:upload" className="text-xl" />
                    <span className="text-sm">Seleccionar archivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPickFile}
                      disabled={saving}
                    />
                  </label>

                  {(previewUrl || form.imagen_url) && (
                    <>
                      <div className="w-12 h-12 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                        <img
                          src={previewUrl || form.imagen_url || ''}
                          alt="preview"
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </div>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-md bg-gray-900 text-white inline-flex items-center justify-center"
                        title="Descargar"
                        onClick={onDownloadImage}
                      >
                        <Icon icon="tabler:download" className="text-lg" />
                      </button>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-md bg-gray-900 text-white inline-flex items-center justify-center"
                        title="Ver"
                        onClick={onViewImage}
                      >
                        <Icon icon="tabler:eye" className="text-lg" />
                      </button>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-md bg-gray-900 text-white inline-flex items-center justify-center"
                        title="Eliminar"
                        onClick={onDeleteImage}
                      >
                        <Icon icon="tabler:trash" className="text-lg" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Números */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        </form>

        {/* Footer sticky */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4">
          <div className="flex items-center gap-5 justify-start">
            <Buttonx
              variant="quartery"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={saving}
              label={saving ? 'Guardando…' : 'Guardar cambios'}
              icon={saving ? 'line-md:loading-twotone-loop' : 'mdi:content-save-outline'}
              className={`px-4 text-sm ${saving ? '[&_svg]:animate-spin' : ''}`}
              type="button"
            />
            <Buttonx
              variant="tertiary"
              onClick={handleClose}
              disabled={saving}
              label="Cancelar"
              className="px-4 text-sm text-gray-600 bg-gray-200"
              type="button"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
