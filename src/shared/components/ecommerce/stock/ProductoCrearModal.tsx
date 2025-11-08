// src/components/ecommerce/producto/ProductoCrearModal.tsx
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { crearProducto } from '@/services/ecommerce/producto/producto.api';
import { fetchCategorias } from '@/services/ecommerce/categoria/categoria.api';
import { useAuth } from '@/auth/context';

import type { Producto } from '@/services/ecommerce/producto/producto.types';
import type { Categoria } from '@/services/ecommerce/categoria/categoria.types';

import { Inputx, InputxNumber, InputxTextarea } from '@/shared/common/Inputx';
import Tittlex from '@/shared/common/Tittlex';
import Buttonx from '@/shared/common/Buttonx';
import {
  SelectxCreatable,
  type CreatableOption,
} from '@/shared/common/SelectxCreatable';
import { Icon } from '@iconify/react';
import { Selectx } from '@/shared/common/Selectx';

// ========================
// Utilidades / Tipos
// ========================
type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (producto: Producto) => void;
  /** Sede que se usará automáticamente (requerido) */
  almacenamientoId: number;
};

type EstadoId = 'activo' | 'inactivo' | 'descontinuado';
type EstadoOption = { id: EstadoId; nombre: string };

const ESTADO_OPCIONES: EstadoOption[] = [
  { id: 'activo', nombre: 'Activo' },
  { id: 'inactivo', nombre: 'Inactivo' },
  { id: 'descontinuado', nombre: 'Descontinuado' },
];

type BasePayload = {
  almacenamiento_id: number;
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
  categoriaInput: string;
  categoriaSelectedId: string;

  almacenamiento_id: string;

  precio: string;
  stock: string;
  stock_minimo: string;
  peso: string;
  estado: EstadoId;
  fecha_registro: string;
};

const getInitialForm = (almacenamientoId: number): FormState => ({
  codigo_identificacion: generarCodigoConFecha(),
  nombre_producto: '',
  descripcion: '',
  categoriaInput: '',
  categoriaSelectedId: '',
  almacenamiento_id: String(almacenamientoId),
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

function parseNum(input: string, decimals = 2): number {
  const normalized = (input ?? '').toString().replace(',', '.').trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? Number(n.toFixed(decimals)) : NaN;
}

export default function ProductoCrearModal({
  open,
  onClose,
  onCreated,
  almacenamientoId,
}: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(getInitialForm(almacenamientoId));
  const formRef = useRef<HTMLFormElement | null>(null);

  // Imagen (UI + envío opcional)
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cargar categorías
  useEffect(() => {
    if (!token || !open) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
  }, [token, open]);

  // Reset al abrir/cerrar o cuando cambia la sede por prop
  useEffect(() => {
    if (open) {
      setForm(getInitialForm(almacenamientoId));
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, almacenamientoId]);

  // Liberar URL object al desmontar o cambiar file
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm(getInitialForm(almacenamientoId));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    onClose();
  };

  // Opciones categoría
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

  // Imagen: seleccionar, ver, descargar, eliminar
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
    if (!previewUrl) return;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }

  async function onDownloadImage() {
    if (!file || !previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = file.name || 'imagen.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onDeleteImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;

    if (!form.nombre_producto.trim()) return;

    // parseo seguro
    const precio = parseNum(form.precio, 2);
    const stock = parseNum(form.stock, 0);
    const stock_minimo = parseNum(form.stock_minimo, 0);
    const peso = parseNum(form.peso, 3);

    if ([precio, stock, stock_minimo, peso].some((n) => Number.isNaN(n)))
      return;

    let payload: CreateProductoPayload & { file?: File };

    if (form.categoriaSelectedId) {
      payload = {
        categoria_id: Number(form.categoriaSelectedId),
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
    } else {
      if (!form.categoriaInput.trim()) return;
      payload = {
        categoria: {
          nombre: form.categoriaInput.trim(),
          descripcion: null,
          es_global: true as const,
        },
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
    }

    // Adjuntamos file si hay (API soporta multipart o body con file)
    if (file) {
      (payload as any).file = file;
    }

    setSaving(true);
    try {
      // ⬇️⬇️ Cambio mínimo: evita el choque de tipos con ProductoCreateInput
      const producto = await crearProducto(payload as unknown as any, token);

      // Si el backend devuelve la categoría creada, la cacheamos
      if (!form.categoriaSelectedId && (producto as any)?.categoria) {
        const nueva = (producto as any).categoria as Categoria;
        setCategorias((prev) => {
          const dup = prev.some((c) => canonical(c.nombre) === canonical(nueva.nombre));
          return dup ? prev : [...prev, nueva];
        });
      }

      onCreated?.(producto);
      setForm(getInitialForm(almacenamientoId));
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
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={handleClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-lg h-full flex flex-col gap-5 p-5">
        {/* Header */}
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="REGISTRAR NUEVO PRODUCTO"
          description="Registra un nuevo producto en tu inventario especificando su información básica, ubicación en almacén y condiciones de stock."
        />

        {/* Body scrollable */}
        <form
          id="crear-producto-form"
          ref={formRef}
          onSubmit={handleSubmit}
          className="h-full flex flex-col gap-5 w-full overflow-y-auto"
        >
          {/* Código / Nombre */}
          <div className="flex flex-col gap-5">
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

          <div className='flex gap-5'>
            {/* Categoría (creatable) */}
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

            {/* Estado */}
            <Selectx
              labelVariant='left'
              label="Estado"
              value={form.estado}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  estado: e.target.value as EstadoId,
                }))
              }
              disabled={saving}
            >
              {ESTADO_OPCIONES.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre}
                </option>
              ))}
            </Selectx>
          </div>

          {/* Subir imagen — una sola fila */}
          <div>
            <label className="block text-base font-normal text-gray90 text-left">
              Subir imagen
            </label>

            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {/* Botón seleccionar archivo */}
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

              {/* Preview + acciones (mismos renglón) */}
              {previewUrl && (
                <>
                  <div className="w-12 h-12 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    <img
                      src={previewUrl}
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

          {/* Números */}
          <div className="flex gap-5">
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

          <div className="flex gap-5">
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
        </form>

        {/* Footer sticky */}
        <div className="flex items-center gap-5 justify-start">
          <Buttonx
            variant="quartery"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={saving}
            label={saving ? 'Creando…' : 'Crear nuevo'}
            className={`px-4 text-sm ${saving ? '[&_svg]:animate-spin' : ''}`}
            type="button"
          />
          <Buttonx
            variant="tertiary"
            onClick={handleClose}
            disabled={saving}
            label="Cancelar"
            icon=""
            type="button"
          />
        </div>
      </div>
    </div>
  );
}
