// src/shared/components/ecommerce/stock/ProductoEditarModal.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { actualizarProducto } from "@/services/ecommerce/producto/producto.api";
import { fetchCategorias } from "@/services/ecommerce/categoria/categoria.api";
import { useAuth } from "@/auth/context";

import type { Producto } from "@/services/ecommerce/producto/producto.types";
import type { Categoria } from "@/services/ecommerce/categoria/categoria.types";

import Tittlex from "@/shared/common/Tittlex";
import { Inputx, InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Buttonx from "@/shared/common/Buttonx";
import {
  SelectxCreatable,
  type CreatableOption,
} from "@/shared/common/SelectxCreatable";
import ImageUploadx from "@/shared/common/ImageUploadx";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

type Props = {
  open: boolean;
  onClose: () => void;
  initialData: Producto | null;
  onUpdated?: (producto: Producto) => void;
};

type EstadoId = "activo" | "inactivo" | "descontinuado";
type EstadoOption = { id: EstadoId; nombre: string };

const ESTADO_OPCIONES: EstadoOption[] = [
  { id: "activo", nombre: "Activo" },
  { id: "inactivo", nombre: "Inactivo" },
  { id: "descontinuado", nombre: "Descontinuado" },
];

function canonical(s: string) {
  return s.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizarEstado(value: unknown): EstadoId {
  if (!value) return "activo";
  if (typeof value === "string") {
    const k = value.toLowerCase().trim();
    if (k === "activo" || k === "inactivo" || k === "descontinuado")
      return k as EstadoId;
  }
  if (typeof value === "object" && value) {
    const v = value as any;
    if (typeof v.id === "string") return normalizarEstado(v.id);
    if (typeof v.nombre === "string") return normalizarEstado(v.nombre);
    if (typeof v.estado === "string") return normalizarEstado(v.estado);
  }
  return "activo";
}

type FormState = {
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string;

  categoriaInput: string;
  categoriaSelectedId: string;

  precio: string;
  stock: string;
  stock_minimo: string;
  peso: string;
  estado: EstadoId;
  fecha_registro: string;

  imagen_url: string | null;
};

function parseNum(input: string, decimals = 2): number | undefined {
  if (input === "" || input == null) return undefined;
  const n = Number(String(input).replace(",", "."));
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

  // Imagen (File local si se cambia)
  const [file, setFile] = useState<File | null>(null);

  // Progreso visual del uploader (0–100)
  const [uploadPct, setUploadPct] = useState<number | undefined>(undefined);

  // Lightbox
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    codigo_identificacion: "",
    nombre_producto: "",
    descripcion: "",
    categoriaInput: "",
    categoriaSelectedId: "",
    precio: "",
    stock: "",
    stock_minimo: "",
    peso: "",
    estado: "activo",
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
      codigo_identificacion: String(initialData.codigo_identificacion ?? ""),
      nombre_producto: String(initialData.nombre_producto ?? ""),
      descripcion: String(initialData.descripcion ?? ""),
      categoriaInput: initialData.categoria?.nombre ?? "",
      categoriaSelectedId: initialData.categoria_id
        ? String(initialData.categoria_id)
        : "",
      precio: initialData.precio != null ? String(initialData.precio) : "",
      stock: initialData.stock != null ? String(initialData.stock) : "",
      stock_minimo:
        initialData.stock_minimo != null
          ? String(initialData.stock_minimo)
          : "",
      peso: initialData.peso != null ? String(initialData.peso) : "",
      estado: normalizarEstado(
        initialData.estado?.nombre ?? initialData.estado
      ),
      fecha_registro: String(
        initialData.fecha_registro ?? new Date().toISOString()
      ),
      imagen_url: initialData.imagen_url ?? null,
    });

    // reset selección local y progreso
    setFile(null);
    setUploadPct(undefined);
    setPreviewOpen(false);
    setPreviewSrc(null);
  }, [initialData, open]);

  // Simular progreso mientras se guarda si hay archivo nuevo
  useEffect(() => {
    if (saving && file) {
      setUploadPct(10);
      const id = window.setInterval(() => {
        setUploadPct((p) => {
          const curr = typeof p === "number" ? p : 10;
          return Math.min(curr + 3, 90); // sube hasta 90% mientras responde el backend
        });
      }, 120);
      return () => window.clearInterval(id);
    }
    // cuando no se guarda o no hay archivo, ocultar barra
    setUploadPct(undefined);
  }, [saving, file]);

  // Opciones categoría (ordenadas)
  const catOptions: CreatableOption[] = useMemo(
    () =>
      categorias
        .slice()
        .sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
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
        categoriaSelectedId: match ? String(match.id) : "",
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
    setForm((p) => ({ ...p, categoriaInput: value, categoriaSelectedId: "" }));
  }

  const handleClose = () => {
    setFile(null);
    setUploadPct(undefined);
    setPreviewOpen(false);
    setPreviewSrc(null);
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
        ? {
            categoria: {
              nombre: form.categoriaInput.trim(),
              descripcion: "",
              es_global: true,
            },
          }
        : {}),
      ...(parseNum(form.precio, 2) !== undefined && {
        precio: parseNum(form.precio, 2),
      }),
      ...(parseNum(form.stock, 0) !== undefined && {
        stock: parseNum(form.stock, 0),
      }),
      ...(parseNum(form.stock_minimo, 0) !== undefined && {
        stock_minimo: parseNum(form.stock_minimo, 0),
      }),
      ...(parseNum(form.peso, 3) !== undefined && {
        peso: parseNum(form.peso, 3),
      }),
    };

    // Imagen: subir/borrar
    if (file) {
      payload.file = file;
    } else if (form.imagen_url === null) {
      payload.imagen_url_remove = true;
    }

    setSaving(true);
    try {
      const updated = await actualizarProducto(
        initialData.uuid,
        payload,
        token
      );
      onUpdated?.(updated);
      handleClose();
    } catch (err) {
      console.error("Error al actualizar producto:", err);
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
            {/* Código / Nombre */}
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
            <div>
              <label className="block text-base font-normal text-gray90 text-left">
                Estado
              </label>
              <div className="relative">
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estado: e.target.value as EstadoId,
                    }))
                  }
                  className={`w-full h-10 px-4 rounded-md border border-gray-300 bg-white
                    ${!form.estado ? "text-gray-500" : "text-gray90"}
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

            {/* Imagen (ImageUploadx en modo edición) */}
            <ImageUploadx
              label="Subir imagen"
              mode="edit"
              value={file ?? form.imagen_url}
              onChange={(f) => {
                setFile(f);
                // Si el usuario borra y había URL previa -> marcar borrado
                if (!f && form.imagen_url) {
                  setForm((p) => ({ ...p, imagen_url: null }));
                }
              }}
              onDelete={() => {
                setFile(null);
                setForm((p) => ({ ...p, imagen_url: null }));
              }}
              onView={(url) => {
                setPreviewSrc(url);
                setPreviewOpen(true);
              }}
              maxSizeMB={5}
              size="md"
              // ⬇️ Overlay de carga solo si hay archivo nuevo y se está guardando
              uploading={saving && !!file}
              progress={uploadPct}
              uploadText="Subiendo imagen…"
              minUploadMs={2000}
            />

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
              label={saving ? "Guardando…" : "Guardar cambios"}
              icon={
                saving
                  ? "line-md:loading-twotone-loop"
                  : "mdi:content-save-outline"
              }
              className={`px-4 text-sm ${saving ? "[&_svg]:animate-spin" : ""}`}
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

        {/* Lightbox */}
        <ImagePreviewModalx
          open={previewOpen}
          src={previewSrc ?? ""}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewSrc(null);
          }}
        />
      </div>
    </div>
  );
}
